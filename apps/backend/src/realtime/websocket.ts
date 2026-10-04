/**
 * WebSocket endpoints — API_CONTRACT §3.7.
 *
 *   ws/chat/<conversationId>/
 *   ws/conversations/<conversationId>/   (alias; both paths are in the Django routing)
 *   ws/notifications/                    (per-user push; AppLayout.tsx connects to it)
 *
 * Authentication is by ?token=<access jwt> on the upgrade request. Browsers cannot
 * set headers on a WebSocket handshake, which is why the token travels in the query
 * string — the same approach the Django middleware used.
 *
 * Authorisation happens during the upgrade, before the connection is accepted: a
 * caller who is not an active participant never gets a socket, rather than being
 * accepted and filtered afterwards.
 *
 * Fan-out is cross-instance via realtime/hub.ts, so no sticky sessions are needed:
 * a client may connect to any instance and still receive events produced on any
 * other.
 */

import type { IncomingMessage, Server } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, type WebSocket } from "ws";
import { bearerToken, verifyToken } from "../lib/jwt.js";
import { prisma } from "../lib/prisma.js";
import { conversationChannel, publish, subscribe, userChannel, type ChannelKey } from "./hub.js";
import { recordConnect, recordDisconnect, isUserOnline, getOnlineUserIds } from "./presence.js";
import { quizLiveWss, handleQuizLiveUpgrade } from "./quizLiveSocket.js";

const CHAT_PATH_RE = /^\/ws\/(?:chat|conversations)\/(\d+)\/?$/;
const NOTIFICATIONS_PATH_RE = /^\/ws\/notifications\/?$/;
const QUIZ_LIVE_PATH_RE = /^\/ws\/quiz-live\/([A-Za-z0-9]+)\/?$/;

/** Heartbeat interval. Render drops idle connections, so the server pings. */
const HEARTBEAT_MS = 30_000;

interface LiveSocket extends WebSocket {
  isAlive?: boolean;
}

interface Authorised {
  channel: ChannelKey;
  userId: number;
  username: string;
  conversationId?: number;
  /** Sent as the handshake frame so a client can confirm what it is attached to. */
  hello: Record<string, unknown>;
}

async function authorise(request: IncomingMessage): Promise<Authorised | null> {
  const url = new URL(request.url ?? "", "http://localhost");

  const chatMatch = CHAT_PATH_RE.exec(url.pathname);
  const isNotifications = NOTIFICATIONS_PATH_RE.test(url.pathname);
  if (!chatMatch && !isNotifications) return null;

  // Prefer the Authorization header when present (non-browser clients), fall back
  // to the query parameter.
  const token = bearerToken(request.headers.authorization) ?? url.searchParams.get("token");
  if (!token) return null;

  let userId: number;
  try {
    userId = verifyToken(token, "access").user_id;
  } catch {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, isActive: true },
  });
  if (!user?.isActive) return null;

  if (isNotifications) {
    return {
      channel: userChannel(userId),
      userId,
      username: user.username,
      hello: { user_id: userId },
    };
  }

  const conversationId = Number(chatMatch![1]);
  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { userId: true },
  });
  if (!membership) return null;

  return {
    channel: conversationChannel(conversationId),
    userId,
    username: user.username,
    conversationId,
    hello: { conversation_id: conversationId },
  };
}

export function attachWebSockets(server: Server): void {
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request: IncomingMessage, socket: Duplex, head: Buffer) => {
    const url = new URL(request.url ?? "", "http://localhost");
    const quizMatch = QUIZ_LIVE_PATH_RE.exec(url.pathname);
    
    if (quizMatch) {
      handleQuizLiveUpgrade(request, socket, head, quizLiveWss, quizMatch[1]);
      return;
    }

    void (async () => {
      let auth: Authorised | null = null;
      try {
        auth = await authorise(request);
      } catch (error) {
        console.error("[ws] authorisation failed", error);
      }

      if (!auth) {
        // Reject at the HTTP layer; the handshake never completes.
        socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request, auth);
      });
    })();
  });

  wss.on("connection", (ws: LiveSocket, _request: IncomingMessage, auth: Authorised) => {
    const unsubscribe = subscribe(auth.channel, ws);

    ws.isAlive = true;
    ws.on("pong", () => {
      ws.isAlive = true;
    });

    // Track user socket presence
    recordConnect(auth.userId, ws);

    // If connected to a conversation, notify room of presence and send initial presence state
    if (auth.conversationId) {
      publish(auth.conversationId, "user_presence", {
        conversation_id: auth.conversationId,
        user_id: auth.userId,
        username: auth.username,
        is_online: true,
      });

      // Send initial presence state to this newly connected client
      void (async () => {
        try {
          const members = await prisma.conversationMember.findMany({
            where: { conversationId: auth.conversationId },
            select: { userId: true },
          });
          const onlineIds = await getOnlineUserIds(members.map((m) => m.userId));
          if (ws.readyState === 1) {
            ws.send(
              JSON.stringify({
                type: "presence_state",
                event_type: "presence_state",
                payload: {
                  conversation_id: auth.conversationId,
                  online_user_ids: onlineIds,
                },
              }),
            );
          }
        } catch (err) {
          console.error("[ws] failed to send initial presence_state", err);
        }
      })();
    }

    // Bi-directional frames: typing indicators
    ws.on("message", (raw) => {
      try {
        const data = JSON.parse(raw.toString()) as { type?: string; is_typing?: boolean };
        if (data.type === "typing" && auth.conversationId) {
          publish(auth.conversationId, "user_typing", {
            conversation_id: auth.conversationId,
            user_id: auth.userId,
            username: auth.username,
            is_typing: Boolean(data.is_typing),
          });
        }
      } catch {
        // Ignore malformed frames
      }
    });

    const cleanup = () => {
      unsubscribe();
      recordDisconnect(auth.userId, ws);
      if (auth.conversationId) {
        void (async () => {
          const stillOnline = await isUserOnline(auth.userId);
          publish(auth.conversationId!, "user_presence", {
            conversation_id: auth.conversationId,
            user_id: auth.userId,
            username: auth.username,
            is_online: stillOnline,
          });
        })();
      }
    };

    ws.on("close", cleanup);
    ws.on("error", () => {
      cleanup();
      ws.terminate();
    });

    ws.send(JSON.stringify({ type: "connected", payload: auth.hello }));
  });

  // Reap sockets that stopped responding, so dead peers do not accumulate in rooms.
  const heartbeat = setInterval(() => {
    for (const client of wss.clients as Set<LiveSocket>) {
      if (client.isAlive === false) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
    for (const client of quizLiveWss.clients as Set<LiveSocket>) {
      if (client.isAlive === false) {
        client.terminate();
        continue;
      }
      client.isAlive = false;
      client.ping();
    }
  }, HEARTBEAT_MS);

  wss.on("close", () => clearInterval(heartbeat));
  quizLiveWss.on("close", () => clearInterval(heartbeat));
  server.on("close", () => clearInterval(heartbeat));
}

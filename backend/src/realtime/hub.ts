/**
 * Realtime pub/sub — cross-instance.
 *
 * Django used a Redis channel layer, which fans out across processes. So does
 * this: sockets are registered in a process-local room map, and every published
 * frame also goes onto a Redis channel so the instances holding the *other*
 * sockets deliver it too. Without that step a message sent through instance A is
 * invisible to a participant connected to instance B — the classic symptom being
 * "chat only works sometimes", determined by which instance the load balancer
 * happened to pick.
 *
 * Two channel families share this machinery:
 *
 *   conv:<id>   conversation events   → /ws/chat/<id>/, /ws/conversations/<id>/
 *   user:<id>   notification pushes   → /ws/notifications/
 *
 * Redis SUBSCRIBE is per channel rather than one firehose, so an instance only
 * receives traffic for rooms it actually holds sockets for.
 *
 * With no REDIS_URL the hub runs single-process and says so once at startup.
 * Correct for local development; production refuses to boot without Redis
 * (assertProductionConfig), because degrading silently is how the bug above
 * reaches users.
 */

import { randomUUID } from "node:crypto";
import type { WebSocket } from "ws";
import { redisAvailable, redisEnabled, redisKey, redisPublisher, redisSubscriber, reportRedisFailure } from "../lib/redis.js";

export type ConversationEvent =
  | "message_created"
  | "message_updated"
  | "message_deleted"
  | "conversation_read";

/** Opaque room key. Build with conversationChannel() / userChannel(). */
export type ChannelKey = string & { readonly __brand: "ChannelKey" };

export const conversationChannel = (conversationId: number): ChannelKey => `conv:${conversationId}` as ChannelKey;
export const userChannel = (userId: number): ChannelKey => `user:${userId}` as ChannelKey;
export const quizRoomChannel = (roomCode: string): ChannelKey => `quiz:${roomCode}` as ChannelKey;

/**
 * Identifies this process. A frame carries its origin so the instance that
 * published it does not deliver it twice — once locally, once off the loopback
 * subscription.
 */
const INSTANCE_ID = randomUUID();

interface Envelope {
  origin: string;
  channel: ChannelKey;
  frame: unknown;
}

/** channel -> sockets held by *this* instance */
const rooms = new Map<ChannelKey, Set<WebSocket>>();

let subscriberReady = false;

/**
 * Wire up the inbound Redis subscription exactly once.
 *
 * Registered lazily on first subscribe rather than at import time, so a process
 * that never opens a socket (a test run, a one-off script) opens no connection.
 */
function ensureSubscriber(): void {
  if (subscriberReady) return;
  const subscriber = redisSubscriber();
  if (!subscriber) return;
  subscriberReady = true;

  subscriber.on("message", (_channel: string, raw: string) => {
    let envelope: Envelope;
    try {
      envelope = JSON.parse(raw) as Envelope;
    } catch {
      return;
    }
    // Already delivered locally by publishFrame(); the loopback copy is a duplicate.
    if (envelope.origin === INSTANCE_ID) return;

    // Routed by the envelope's own channel rather than the transport's name, so
    // the room map never has to know about Redis namespacing.
    deliverLocal(envelope.channel, JSON.stringify(envelope.frame));
  });
}

/**
 * Register a socket on a channel. Returns the unsubscribe function.
 *
 * The first socket on a channel triggers a Redis SUBSCRIBE; the last one to leave
 * triggers UNSUBSCRIBE, so a long-lived instance does not accumulate channels for
 * conversations nobody is watching.
 */
export function subscribe(channel: ChannelKey, socket: WebSocket): () => void {
  ensureSubscriber();

  let room = rooms.get(channel);
  const isFirst = room === undefined;
  if (!room) {
    room = new Set<WebSocket>();
    rooms.set(channel, room);
  }
  room.add(socket);

  if (isFirst) {
    const subscriber = redisSubscriber();
    if (subscriber) {
      subscriber.subscribe(redisKey(channel)).catch((error: unknown) => reportRedisFailure(`subscribe ${channel}`, error));
    }
  }

  return () => {
    const current = rooms.get(channel);
    if (!current) return;
    current.delete(socket);
    if (current.size > 0) return;

    // Drop empty rooms so the map does not grow without bound over a long uptime.
    rooms.delete(channel);
    const subscriber = redisSubscriber();
    if (subscriber) {
      subscriber.unsubscribe(redisKey(channel)).catch((error: unknown) => reportRedisFailure(`unsubscribe ${channel}`, error));
    }
  };
}

/** Deliver a pre-serialised frame to this instance's sockets on a channel. */
function deliverLocal(channel: ChannelKey, frame: string): void {
  const room = rooms.get(channel);
  if (!room || room.size === 0) return;

  for (const socket of room) {
    // 1 === WebSocket.OPEN. Compared numerically to avoid importing the runtime
    // constant into a module that is otherwise transport-agnostic.
    if (socket.readyState !== 1) continue;
    try {
      socket.send(frame);
    } catch {
      // Ignore: the close handler will unsubscribe it.
    }
  }
}

/**
 * Broadcast a frame to every socket on a channel, on every instance.
 *
 * Never throws: a realtime delivery failure must not roll back the HTTP request
 * that produced the event. A dead socket is skipped rather than retried — the
 * client refetches on reconnect.
 *
 * Local delivery happens first and unconditionally, so a Redis outage degrades to
 * single-instance behaviour instead of silencing chat entirely.
 */
export function publishFrame(channel: ChannelKey, frame: unknown): void {
  deliverLocal(channel, JSON.stringify(frame));

  if (!redisAvailable()) return;
  const publisher = redisPublisher();
  if (!publisher) return;

  const envelope: Envelope = { origin: INSTANCE_ID, channel, frame };
  publisher
    .publish(redisKey(channel), JSON.stringify(envelope))
    .catch((error: unknown) => reportRedisFailure(`publish ${channel}`, error));
}

/** Conversation event — the wire shape the chat clients parse. */
export function publish(conversationId: number, event: ConversationEvent, payload: unknown): void {
  publishFrame(conversationChannel(conversationId), { type: event, event_type: event, payload });
}

/**
 * Notification push.
 *
 * The frame is the notification object itself, not a `{type, payload}` wrapper:
 * `AppLayout` reads `data.title` and `data.message` straight off the parsed frame,
 * matching Django's NotificationConsumer, which sent `event['payload']` bare.
 */
export function publishNotification(userId: number, notification: Record<string, unknown>): void {
  publishFrame(userChannel(userId), notification);
}

/** Diagnostics only. */
export function roomStats(): { rooms: number; subscribers: number; instance: string; distributed: boolean } {
  let subscribers = 0;
  for (const room of rooms.values()) subscribers += room.size;
  return { rooms: rooms.size, subscribers, instance: INSTANCE_ID, distributed: redisEnabled };
}
export const quizRoomChannel = (roomCode: string): ChannelKey => `quiz:${roomCode}` as ChannelKey;

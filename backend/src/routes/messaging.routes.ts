/**
 * Conversations and messages — mounted at /api/conversations/. API_CONTRACT §3.7.
 *
 * @status ACTIVE  <id>/ <id>/messages/ <id>/messages/<mid>/ <id>/read/ <id>/unread/
 * @status ACTIVE  <id>/leave/ <id>/avatar/ <id>/participants/ <id>/participants/add/
 * @status ACTIVE  <id>/participants/<uid>/remove/ user/ private/create/ group/create/
 * @status UNUSED  /  (generic list+create; clients use user/ and private|group/create/)
 *
 * Every response carries Cache-Control: no-store via the global middleware — these
 * are the realtime surfaces CACHE_POLICY.md forbids caching.
 */

import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { NotificationType, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import {
  conversationInclude,
  messageInclude,
  serializeConversation,
  serializeMessage,
  type SerializableMessage,
} from "../serializers/conversation.js";
import { userSelect } from "../serializers/user.js";
import { ok, created, list, paginate, paginationParams } from "../lib/envelope.js";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { createNotification } from "../services/notifications.js";
import { storage } from "../services/storage.js";
import { singleUpload } from "../middleware/upload.js";
import { publish } from "../realtime/hub.js";

export const messagingRouter: Router = Router();
messagingRouter.use(requireAuth);

function conversationIdOf(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw notFound("Conversation not found.");
  return id;
}

/**
 * Load a conversation the caller participates in.
 * 404 rather than 403 for non-participants — a private thread should not confirm
 * its own existence to outsiders.
 */
async function loadConversation(req: Request) {
  const me = currentUser(req);
  const id = conversationIdOf(req);

  const conversation = await prisma.conversation.findUnique({ where: { id }, include: conversationInclude });
  if (!conversation) throw notFound("Conversation not found.");
  if (!conversation.participants.some((p) => p.userId === me.id)) throw notFound("Conversation not found.");

  return { conversation, me };
}

/** Messages after the caller's last read receipt. */
async function unreadCountFor(conversationId: number, userId: number): Promise<number> {
  const receipt = await prisma.conversationReadReceipt.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
    select: { lastReadAt: true },
  });

  return prisma.message.count({
    where: {
      conversationId,
      authorId: { not: userId },
      ...(receipt ? { createdAt: { gt: receipt.lastReadAt } } : {}),
    },
  });
}

async function lastMessageOf(conversationId: number): Promise<SerializableMessage | null> {
  return prisma.message.findFirst({
    where: { conversationId },
    include: messageInclude,
    orderBy: { createdAt: "desc" },
  });
}

/** Hydrate a page of conversations with per-viewer unread counts and last messages. */
async function serializeMany(conversations: Awaited<ReturnType<typeof prisma.conversation.findMany>>, viewerId: number) {
  return Promise.all(
    (conversations as never[]).map(async (c: never) => {
      const conversation = c as unknown as Parameters<typeof serializeConversation>[0];
      const [unreadCount, lastMessage] = await Promise.all([
        unreadCountFor(conversation.id, viewerId),
        lastMessageOf(conversation.id),
      ]);
      return serializeConversation(conversation, { viewerId, unreadCount, lastMessage });
    }),
  );
}

// ── Listings ────────────────────────────────────────────────────────────────

async function listConversations(req: Request, res: Response) {
  const me = currentUser(req);
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);

  const where: Prisma.ConversationWhereInput = { participants: { some: { userId: me.id } } };
  const [total, conversations] = await Promise.all([
    prisma.conversation.count({ where }),
    prisma.conversation.findMany({
      where,
      include: conversationInclude,
      skip,
      take: pageSize,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  list(res, await serializeMany(conversations, me.id), paginate(total, page, pageSize));
}

messagingRouter.get("/user/", listConversations);

const createSchema = z.object({
  type: z.enum(["private", "group"]).default("private"),
  name: z.string().max(100).optional(),
  participant_ids: z.array(z.number().int().positive()).min(1),
});

/** Shared by POST /, /private/create/ and /group/create/. */
async function createConversation(req: Request, res: Response, forcedType?: "private" | "group") {
  const me = currentUser(req);
  const body = req.body ?? {};

  // `private/create/` takes `{recipient_id}`; the others take `participant_ids`.
  const normalised = {
    type: forcedType ?? body.type ?? "private",
    name: body.name,
    participant_ids: body.participant_ids ?? (body.recipient_id ? [body.recipient_id] : []),
  };
  const input = createSchema.parse(normalised);

  if (input.participant_ids.includes(me.id)) {
    throw badRequest("Do not include yourself in participant_ids.", { participant_ids: ["Remove your own id."] });
  }
  if (input.type === "private" && input.participant_ids.length !== 1) {
    throw badRequest("Private conversations must have exactly two participants.");
  }

  const found = await prisma.user.findMany({
    where: { id: { in: input.participant_ids }, isActive: true },
    select: { id: true },
  });
  if (found.length !== input.participant_ids.length) throw badRequest("One or more participants do not exist.");

  if (input.type === "private") {
    // Reuse rather than duplicate: the client treats an existing thread as success.
    const existing = await prisma.conversation.findFirst({
      where: {
        type: "PRIVATE",
        AND: [
          { participants: { some: { userId: me.id } } },
          { participants: { some: { userId: input.participant_ids[0] } } },
        ],
      },
      include: conversationInclude,
    });

    if (existing) {
      ok(
        res,
        serializeConversation(existing, {
          viewerId: me.id,
          unreadCount: await unreadCountFor(existing.id, me.id),
          lastMessage: await lastMessageOf(existing.id),
        }),
        "Existing conversation found",
      );
      return;
    }
  }

  const conversation = await prisma.conversation.create({
    data: {
      type: input.type === "group" ? "GROUP" : "PRIVATE",
      name: input.name ?? "",
      createdById: input.type === "group" ? me.id : null,
      participants: {
        create: [{ userId: me.id }, ...input.participant_ids.map((userId) => ({ userId }))],
      },
    },
    include: conversationInclude,
  });

  created(res, serializeConversation(conversation, { viewerId: me.id, unreadCount: 0, lastMessage: null }));
}

messagingRouter.get("/", listConversations);
messagingRouter.post("/", (req, res) => createConversation(req, res));
messagingRouter.post("/private/create/", (req, res) => createConversation(req, res, "private"));
messagingRouter.post("/group/create/", (req, res) => createConversation(req, res, "group"));

// ── Detail ──────────────────────────────────────────────────────────────────

messagingRouter.get("/:id/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  ok(
    res,
    serializeConversation(conversation, {
      viewerId: me.id,
      unreadCount: await unreadCountFor(conversation.id, me.id),
      lastMessage: await lastMessageOf(conversation.id),
    }),
  );
});

messagingRouter.patch("/:id/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  if (conversation.type !== "GROUP") throw badRequest("Private conversations cannot be renamed.");

  const { name } = z.object({ name: z.string().min(1).max(100) }).parse(req.body ?? {});
  const updated = await prisma.conversation.update({
    where: { id: conversation.id },
    data: { name },
    include: conversationInclude,
  });

  ok(res, serializeConversation(updated, { viewerId: me.id, unreadCount: await unreadCountFor(updated.id, me.id) }));
});

messagingRouter.delete("/:id/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  if (conversation.type !== "GROUP" || conversation.createdById !== me.id) {
    throw forbidden("Only the group creator can delete this conversation.");
  }

  await prisma.conversation.delete({ where: { id: conversation.id } });
  res.status(204).send();
});

// ── Messages ────────────────────────────────────────────────────────────────

messagingRouter.get("/:id/messages/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  const { page, pageSize, skip } = paginationParams(req.query as Record<string, unknown>);

  const [total, messages, receipt] = await Promise.all([
    prisma.message.count({ where: { conversationId: conversation.id } }),
    prisma.message.findMany({
      where: { conversationId: conversation.id },
      include: messageInclude,
      skip,
      take: pageSize,
      orderBy: { createdAt: "asc" },
    }),
    prisma.conversationReadReceipt.findUnique({
      where: { conversationId_userId: { conversationId: conversation.id, userId: me.id } },
      select: { lastReadAt: true },
    }),
  ]);

  // Fetching the thread marks it read, matching the Django behaviour the unread
  // badge depends on.
  await prisma.conversationReadReceipt.upsert({
    where: { conversationId_userId: { conversationId: conversation.id, userId: me.id } },
    create: { conversationId: conversation.id, userId: me.id, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });

  const readBefore = receipt?.lastReadAt ?? null;
  list(
    res,
    messages.map((m) =>
      serializeMessage(m, {
        viewerId: me.id,
        isReadByViewer: m.authorId === me.id || (readBefore !== null && m.createdAt <= readBefore),
      }),
    ),
    paginate(total, page, pageSize),
  );
});

messagingRouter.post("/:id/messages/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  const { content } = z.object({ content: z.string().min(1) }).parse(req.body ?? {});

  const message = await prisma.message.create({
    data: { conversationId: conversation.id, authorId: me.id, content },
    include: messageInclude,
  });

  // Bump the conversation so it sorts to the top of the list.
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  const payload = serializeMessage(message, { viewerId: me.id, isReadByViewer: true });
  publish(conversation.id, "message_created", { message: payload });

  // Notify the other participants, respecting their in-app message preference.
  const others = conversation.participants.filter((p) => p.userId !== me.id).map((p) => p.userId);
  if (others.length > 0) {
    const settings = await prisma.notificationSettings.findMany({
      where: { userId: { in: others } },
      select: { userId: true, inAppMessages: true },
    });
    const muted = new Set(settings.filter((s) => !s.inAppMessages).map((s) => s.userId));

    for (const recipientId of others) {
      if (muted.has(recipientId)) continue;
      await createNotification({
        type: NotificationType.MESSAGE,
        title: "Nouveau message",
        message: `${message.author.firstName} ${message.author.lastName}`.trim() + " vous a envoyé un message",
        recipientId,
        sender: {
          id: me.id,
          username: me.username,
          firstName: message.author.firstName,
          lastName: message.author.lastName,
          avatar: message.author.avatar,
        },
        data: {
          conversation_id: String(conversation.id),
          message_id: String(message.id),
          conversation_type: conversation.type.toLowerCase(),
        },
      });
    }
  }

  created(res, payload);
});

/** Author, platform staff, or the creator of a group conversation. */
function canModerateMessage(
  message: { authorId: number },
  conversation: { type: string; createdById: number | null },
  me: { id: number; isStaff: boolean; isSuperuser: boolean },
): boolean {
  if (message.authorId === me.id) return true;
  if (me.isStaff || me.isSuperuser) return true;
  return conversation.type === "GROUP" && conversation.createdById === me.id;
}

messagingRouter.patch("/:id/messages/:messageId/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  const message = await prisma.message.findFirst({
    where: { id: Number(req.params.messageId), conversationId: conversation.id },
  });
  if (!message) throw notFound("Message not found.");
  if (!canModerateMessage(message, conversation, me)) throw forbidden("You cannot modify this message.");

  const { content } = z.object({ content: z.string().min(1) }).parse(req.body ?? {});
  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { content },
    include: messageInclude,
  });

  const payload = serializeMessage(updated, { viewerId: me.id, isReadByViewer: true });
  publish(conversation.id, "message_updated", { message: payload });
  ok(res, payload);
});

messagingRouter.delete("/:id/messages/:messageId/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  const message = await prisma.message.findFirst({
    where: { id: Number(req.params.messageId), conversationId: conversation.id },
  });
  if (!message) throw notFound("Message not found.");
  if (!canModerateMessage(message, conversation, me)) throw forbidden("You cannot delete this message.");

  await prisma.message.delete({ where: { id: message.id } });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  publish(conversation.id, "message_deleted", {
    message_id: String(message.id),
    conversation_id: String(conversation.id),
  });
  ok(res, null, "Message deleted.");
});

// ── Read state ──────────────────────────────────────────────────────────────

messagingRouter.post("/:id/read/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);

  await prisma.conversationReadReceipt.upsert({
    where: { conversationId_userId: { conversationId: conversation.id, userId: me.id } },
    create: { conversationId: conversation.id, userId: me.id, lastReadAt: new Date() },
    update: { lastReadAt: new Date() },
  });

  publish(conversation.id, "conversation_read", {
    conversation_id: String(conversation.id),
    reader_id: String(me.id),
    timestamp: new Date().toISOString(),
  });
  ok(res, null, "Conversation marked as read");
});

messagingRouter.post("/:id/unread/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);

  // Dropping the receipt makes every message unread again.
  await prisma.conversationReadReceipt.deleteMany({
    where: { conversationId: conversation.id, userId: me.id },
  });
  ok(res, null, "Conversation marked as unread");
});

// ── Participants ────────────────────────────────────────────────────────────

messagingRouter.get("/:id/participants/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  const members = await prisma.conversationMember.findMany({
    where: { conversationId: conversation.id },
    include: { user: { select: userSelect } },
    orderBy: { joinedAt: "asc" },
  });

  const { serializeUser } = await import("../serializers/user.js");
  list(res, members.map((m) => serializeUser(m.user, { viewerId: me.id })));
});

messagingRouter.post("/:id/participants/add/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  if (conversation.type !== "GROUP") throw badRequest("Only group conversations have participants to manage.");
  if (conversation.createdById !== me.id) throw forbidden("Only the conversation creator can add participants.");

  const { user_id: userId } = z.object({ user_id: z.number().int().positive() }).parse(req.body ?? {});

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, firstName: true, lastName: true, username: true } });
  if (!user) throw notFound("User not found.");

  const existing = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: conversation.id, userId } },
  });
  if (existing) throw conflict("User is already a participant.");

  await prisma.conversationMember.create({ data: { conversationId: conversation.id, userId } });
  ok(res, null, `${user.firstName} ${user.lastName}`.trim() + " added to conversation");
});

messagingRouter.delete("/:id/participants/:userId/remove/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  if (conversation.type !== "GROUP") throw badRequest("Only group conversations have participants to manage.");
  if (conversation.createdById !== me.id) throw forbidden("Only the conversation creator can remove participants.");

  const userId = Number(req.params.userId);
  if (userId === conversation.createdById) throw badRequest("Cannot remove the conversation creator.");

  const membership = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId: conversation.id, userId } },
  });
  if (!membership) throw badRequest("User is not a participant.");

  await prisma.conversationMember.delete({
    where: { conversationId_userId: { conversationId: conversation.id, userId } },
  });
  ok(res, null, "Participant removed from conversation");
});

messagingRouter.post("/:id/leave/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);

  // Hand the group over before leaving, so it is never left ownerless.
  if (conversation.type === "GROUP" && conversation.createdById === me.id) {
    const replacement = conversation.participants.find((p) => p.userId !== me.id);
    if (replacement) {
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: { createdById: replacement.userId },
      });
    }
  }

  await prisma.conversationMember.deleteMany({
    where: { conversationId: conversation.id, userId: me.id },
  });

  const remaining = await prisma.conversationMember.count({ where: { conversationId: conversation.id } });
  // A group with nobody left, or a private thread with one side gone, is dead.
  const threshold = conversation.type === "GROUP" ? 0 : 1;
  if (remaining <= threshold) {
    await prisma.conversation.delete({ where: { id: conversation.id } });
    ok(res, null, "Conversation deleted after leaving");
    return;
  }

  ok(res, null, "You left the conversation");
});

// ── Avatar ──────────────────────────────────────────────────────────────────

messagingRouter.post("/:id/avatar/", singleUpload("avatar", "conversationAvatar"), async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  if (conversation.type !== "GROUP") throw badRequest("Only group conversations have an avatar.");
  if (conversation.createdById !== me.id) throw forbidden("Only the group creator can change the avatar.");

  // The client sends `remove=true` as a form field rather than issuing a DELETE.
  if (String((req.body as Record<string, unknown>)?.remove ?? "").toLowerCase() === "true") {
    await prisma.conversation.update({ where: { id: conversation.id }, data: { avatarUrl: null } });
    ok(res, { avatar_url: null });
    return;
  }

  const file = req.file;
  if (!file) throw badRequest("No avatar file provided.", { avatar: ["This field is required."] });

  const stored = await storage.put({
    buffer: file.buffer,
    originalName: file.originalname,
    contentType: file.mimetype,
    prefix: "conversations/avatars",
  });

  await prisma.conversation.update({ where: { id: conversation.id }, data: { avatarUrl: stored.url } });
  ok(res, { avatar_url: stored.url });
});

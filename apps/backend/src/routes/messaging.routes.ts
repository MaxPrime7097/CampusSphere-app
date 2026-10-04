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
import { parseSlugId, encodeHashId } from "../lib/hashids.js";
import {
  conversationInclude,
  messageInclude,
  serializeConversation,
  serializeMessage,
  type SerializableMessage,
} from "../serializers/conversation.js";
import { serializeUser, userSelect } from "../serializers/user.js";
import { ok, created, list, paginate, paginationParams } from "../lib/envelope.js";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors.js";
import { currentUser, requireAuth } from "../middleware/auth.js";
import { createNotification } from "../services/notifications.js";
import { storage } from "../services/storage.js";
import { singleUpload } from "../middleware/upload.js";
import { publish } from "../realtime/hub.js";
import { getOnlineUserIds } from "../realtime/presence.js";
import { httpCache, autoInvalidate } from "../lib/cache.js";

export const messagingRouter: Router = Router();
messagingRouter.use(requireAuth);
messagingRouter.use(autoInvalidate("conversations"));

async function createSystemMessage(conversationId: number, content: string, senderId?: number) {
  try {
    const sysMsg = await prisma.message.create({
      data: {
        conversationId,
        authorId: senderId ?? 1,
        type: "SYSTEM",
        status: "SENT",
        content,
      },
      include: messageInclude,
    });
    const payload = serializeMessage(sysMsg, { viewerId: null, isReadByViewer: true });
    publish(conversationId, "message_created", { message: payload });
  } catch (err) {
    console.error("[messaging] failed to create system message:", err);
  }
}

function conversationIdOf(req: Request): number {
  const id = parseSlugId(req.params.id);
  if (!id || !Number.isInteger(id) || id <= 0) throw notFound("Conversation not found.");
  return id;
}

function messageIdOf(param: unknown): number {
  const id = parseSlugId(param);
  if (!id || !Number.isInteger(id) || id <= 0) throw notFound("Message not found.");
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

messagingRouter.get("/user/", httpCache({ namespace: "conversations", ttlSeconds: 30 }), listConversations);

const createSchema = z
  .object({
    type: z.enum(["private", "group"]).default("private"),
    name: z.string().max(100).optional(),
    participant_ids: z.array(z.number().int().positive()).default([]),
  })
  .refine(
    (val) => val.type === "group" || val.participant_ids.length === 1,
    { message: "Private conversations must have exactly one recipient.", path: ["participant_ids"] },
  );

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

  // Deduplicate and filter out self
  const uniqueParticipantIds = Array.from(
    new Set(input.participant_ids.filter((id) => id !== me.id))
  );

  const found =
    uniqueParticipantIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: uniqueParticipantIds }, isActive: true },
          select: { id: true },
        })
      : [];

  if (input.type === "private") {
    if (found.length !== uniqueParticipantIds.length) {
      throw badRequest("One or more participants do not exist.");
    }

    // Reuse rather than duplicate: the client treats an existing thread as success.
    const existing = await prisma.conversation.findFirst({
      where: {
        type: "PRIVATE",
        AND: [
          { participants: { some: { userId: me.id } } },
          { participants: { some: { userId: uniqueParticipantIds[0] } } },
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

  // For group conversations: use all active found participants without failing if one account is deactivated
  const validParticipantIds = input.type === "group" ? found.map((u) => u.id) : uniqueParticipantIds;

  const conversation = await prisma.conversation.create({
    data: {
      type: input.type === "group" ? "GROUP" : "PRIVATE",
      name: input.name ?? "",
      createdById: input.type === "group" ? me.id : null,
      participants: {
        create: [{ userId: me.id }, ...validParticipantIds.map((userId) => ({ userId }))],
      },
    },
    include: conversationInclude,
  });

  created(res, serializeConversation(conversation, { viewerId: me.id, unreadCount: 0, lastMessage: null }));
}

messagingRouter.get("/", httpCache({ namespace: "conversations", ttlSeconds: 30 }), listConversations);
messagingRouter.post("/", (req, res) => createConversation(req, res));
messagingRouter.post("/private/create/", (req, res) => createConversation(req, res, "private"));
messagingRouter.post("/group/create/", (req, res) => createConversation(req, res, "group"));

// ── Detail ──────────────────────────────────────────────────────────────────

messagingRouter.get("/:id/", httpCache({ namespace: "conversations", ttlSeconds: 30 }), async (req, res) => {
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

messagingRouter.get("/:id/presence/", async (req, res) => {
  const { conversation } = await loadConversation(req);
  const memberIds = conversation.participants.map((p) => p.userId);
  const onlineUserIds = await getOnlineUserIds(memberIds);
  ok(res, {
    conversation_id: conversation.id,
    conversation_hash_id: encodeHashId(conversation.id),
    online_user_ids: onlineUserIds,
  });
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

  const payload = serializeConversation(updated, { viewerId: me.id, unreadCount: await unreadCountFor(updated.id, me.id) });
  publish(conversation.id, "conversation_updated", { conversation: payload });

  const senderName = me.username;
  void createSystemMessage(conversation.id, `${senderName} a renommé le groupe en "${name}"`, me.id);

  ok(res, payload);
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

messagingRouter.get("/:id/messages/", httpCache({ namespace: "conversations", ttlSeconds: 30 }), async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  const pageSize = Math.min(100, Math.max(1, Number(req.query.page_size) || 30));
  const before = req.query.before ? Number(req.query.before) : undefined;
  const after = req.query.after ? Number(req.query.after) : undefined;
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;

  let where: Prisma.MessageWhereInput = { conversationId: conversation.id };

  if (before && Number.isInteger(before)) {
    where = { conversationId: conversation.id, id: { lt: before } };
  } else if (after && Number.isInteger(after)) {
    where = { conversationId: conversation.id, id: { gt: after } };
  }

  const [total, receipt] = await Promise.all([
    prisma.message.count({ where: { conversationId: conversation.id } }),
    prisma.conversationReadReceipt.findUnique({
      where: { conversationId_userId: { conversationId: conversation.id, userId: me.id } },
      select: { lastReadAt: true },
    }),
  ]);

  const isAscending = Boolean(after);
  const skip = before || after ? 0 : (page - 1) * pageSize;

  const rawMessages = await prisma.message.findMany({
    where,
    include: messageInclude,
    skip,
    take: pageSize,
    orderBy: isAscending ? [{ createdAt: "asc" }, { id: "asc" }] : [{ createdAt: "desc" }, { id: "desc" }],
  });

  const messages = isAscending ? rawMessages : [...rawMessages].reverse();

  // Fetching the thread marks it read, matching the Django behaviour the unread
  // badge depends on.
  const now = new Date();
  await prisma.conversationReadReceipt.upsert({
    where: { conversationId_userId: { conversationId: conversation.id, userId: me.id } },
    create: { conversationId: conversation.id, userId: me.id, lastReadAt: now },
    update: { lastReadAt: now },
  });

  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      authorId: { not: me.id },
      createdAt: { lte: now },
      status: { not: "READ" },
    },
    data: { status: "READ" },
  });

  publish(conversation.id, "conversation_read", {
    conversation_id: String(conversation.id),
    conversation_hash_id: encodeHashId(conversation.id),
    reader_id: String(me.id),
    timestamp: now.toISOString(),
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

messagingRouter.post("/:id/messages/", singleUpload("file", "other"), async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  const body = req.body ?? {};

  let content = typeof body.content === "string" ? body.content.trim() : "";
  const replyToId = body.reply_to_id ? Number(body.reply_to_id) : undefined;
  const duration = body.duration ? Number(body.duration) : undefined;

  let mediaUrl: string | null = null;
  let mediaType: string | null = null;
  let fileName: string | null = null;
  let fileSize: number | null = null;
  let type: "TEXT" | "IMAGE" | "AUDIO" | "FILE" | "SYSTEM" = "TEXT";

  if (req.file) {
    const stored = await storage.put({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      contentType: req.file.mimetype,
      prefix: "conversations/media",
    });
    mediaUrl = stored.url;
    mediaType = req.file.mimetype;
    fileName = req.file.originalname;
    fileSize = req.file.size;

    if (req.file.mimetype.startsWith("image/")) {
      type = "IMAGE";
    } else if (req.file.mimetype.startsWith("audio/")) {
      type = "AUDIO";
    } else {
      type = "FILE";
    }
  } else if (body.media_url) {
    mediaUrl = String(body.media_url);
    mediaType = body.media_type ? String(body.media_type) : null;
    fileName = body.file_name ? String(body.file_name) : null;
    fileSize = body.file_size ? Number(body.file_size) : null;
    if (body.type && ["IMAGE", "AUDIO", "FILE"].includes(String(body.type).toUpperCase())) {
      type = String(body.type).toUpperCase() as typeof type;
    }
  }

  if (!content && !mediaUrl) {
    throw badRequest("Message content or media is required.");
  }

  if (replyToId) {
    const parent = await prisma.message.findFirst({
      where: { id: replyToId, conversationId: conversation.id },
      select: { id: true },
    });
    if (!parent) throw badRequest("Parent message not found in this conversation.");
  }

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      authorId: me.id,
      content,
      type,
      status: "SENT",
      mediaUrl,
      mediaType,
      fileName,
      fileSize,
      duration: duration && Number.isFinite(duration) ? duration : null,
      replyToId: replyToId || null,
    },
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
          conversation_hash_id: encodeHashId(conversation.id) ?? String(conversation.id),
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
  const messageId = messageIdOf(req.params.messageId);

  const message = await prisma.message.findFirst({
    where: { id: messageId, conversationId: conversation.id },
  });
  if (!message) throw notFound("Message not found.");
  if (message.authorId !== me.id) throw forbidden("Vous ne pouvez modifier que vos propres messages.");
  if (message.isDeleted) throw badRequest("Ce message a été supprimé.");

  // Strict 15-minute window enforcement
  const elapsedMs = Date.now() - message.createdAt.getTime();
  if (elapsedMs > 15 * 60 * 1000) {
    throw badRequest("Le délai de 15 minutes pour modifier ce message est expiré.");
  }

  // Audio notes cannot be edited
  if (message.type === "AUDIO" || message.mediaType === "audio") {
    throw badRequest("Les messages vocaux ne peuvent pas être modifiés.");
  }

  const { content } = z.object({ content: z.string().min(1) }).parse(req.body ?? {});
  const updated = await prisma.message.update({
    where: { id: message.id },
    data: { content, updatedAt: new Date() },
    include: messageInclude,
  });

  const payload = serializeMessage(updated, { viewerId: me.id, isReadByViewer: true });
  publish(conversation.id, "message_updated", { message: payload });
  ok(res, payload);
});

messagingRouter.delete("/:id/messages/:messageId/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  const messageId = messageIdOf(req.params.messageId);

  const message = await prisma.message.findFirst({
    where: { id: messageId, conversationId: conversation.id },
  });
  if (!message) throw notFound("Message not found.");
  if (!canModerateMessage(message, conversation, me)) throw forbidden("You cannot delete this message.");

  // Soft delete message to preserve conversation thread integrity
  const updated = await prisma.message.update({
    where: { id: message.id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      content: "Ce message a été supprimé",
      mediaUrl: null,
      mediaType: null,
      fileName: null,
      fileSize: null,
      duration: null,
    },
    include: messageInclude,
  });

  await prisma.messageReaction.deleteMany({ where: { messageId: message.id } });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

  const payload = serializeMessage(updated, { viewerId: me.id });
  publish(conversation.id, "message_deleted", {
    message_id: String(message.id),
    conversation_id: String(conversation.id),
    conversation_hash_id: encodeHashId(conversation.id),
    message: payload,
  });
  ok(res, payload, "Message deleted.");
});

// ── Reactions ───────────────────────────────────────────────────────────────

messagingRouter.post("/:id/messages/:messageId/reactions/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  const messageId = messageIdOf(req.params.messageId);

  const message = await prisma.message.findFirst({
    where: { id: messageId, conversationId: conversation.id },
  });
  if (!message) throw notFound("Message not found.");

  const { emoji } = z.object({ emoji: z.string().min(1).max(10) }).parse(req.body ?? {});

  const existing = await prisma.messageReaction.findUnique({
    where: { messageId_userId: { messageId, userId: me.id } },
  });

  if (existing) {
    if (existing.emoji === emoji) {
      await prisma.messageReaction.delete({ where: { id: existing.id } });
    } else {
      await prisma.messageReaction.update({ where: { id: existing.id }, data: { emoji } });
    }
  } else {
    await prisma.messageReaction.create({
      data: { messageId, userId: me.id, emoji },
    });
  }

  const updatedReactions = await prisma.messageReaction.findMany({
    where: { messageId },
    include: { user: { select: userSelect } },
  });

  const reactionsSummary: Record<string, string[]> = {};
  for (const r of updatedReactions) {
    if (!reactionsSummary[r.emoji]) reactionsSummary[r.emoji] = [];
    reactionsSummary[r.emoji].push(String(r.userId));
  }

  const payload = {
    message_id: String(messageId),
    conversation_id: String(conversation.id),
    conversation_hash_id: encodeHashId(conversation.id),
    reactions: updatedReactions.map((r) => ({
      id: r.id,
      emoji: r.emoji,
      user_id: r.userId,
      user: serializeUser(r.user, { viewerId: me.id }),
      created_at: r.createdAt.toISOString(),
    })),
    reactions_summary: reactionsSummary,
  };

  publish(conversation.id, "message_reaction_updated", payload);
  ok(res, payload);
});

messagingRouter.delete("/:id/messages/:messageId/reactions/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  const messageId = messageIdOf(req.params.messageId);

  await prisma.messageReaction.deleteMany({
    where: { messageId, userId: me.id },
  });

  const updatedReactions = await prisma.messageReaction.findMany({
    where: { messageId },
    include: { user: { select: userSelect } },
  });

  const reactionsSummary: Record<string, string[]> = {};
  for (const r of updatedReactions) {
    if (!reactionsSummary[r.emoji]) reactionsSummary[r.emoji] = [];
    reactionsSummary[r.emoji].push(String(r.userId));
  }

  const payload = {
    message_id: String(messageId),
    conversation_id: String(conversation.id),
    conversation_hash_id: encodeHashId(conversation.id),
    reactions: updatedReactions.map((r) => ({
      id: r.id,
      emoji: r.emoji,
      user_id: r.userId,
      user: serializeUser(r.user, { viewerId: me.id }),
      created_at: r.createdAt.toISOString(),
    })),
    reactions_summary: reactionsSummary,
  };

  publish(conversation.id, "message_reaction_updated", payload);
  ok(res, payload);
});

// ── Read state ──────────────────────────────────────────────────────────────

messagingRouter.post("/:id/read/", async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  const now = new Date();

  await prisma.conversationReadReceipt.upsert({
    where: { conversationId_userId: { conversationId: conversation.id, userId: me.id } },
    create: { conversationId: conversation.id, userId: me.id, lastReadAt: now },
    update: { lastReadAt: now },
  });

  await prisma.message.updateMany({
    where: {
      conversationId: conversation.id,
      authorId: { not: me.id },
      createdAt: { lte: now },
      status: { not: "READ" },
    },
    data: { status: "READ" },
  });

  publish(conversation.id, "conversation_read", {
    conversation_id: String(conversation.id),
    conversation_hash_id: encodeHashId(conversation.id),
    reader_id: String(me.id),
    timestamp: now.toISOString(),
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

  await prisma.conversationMember.create({ data: { conversationId: conversation.id, userId, role: "MEMBER" } });

  const senderName = me.username;
  const addedName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username;
  void createSystemMessage(conversation.id, `${senderName} a ajouté ${addedName} au groupe`, me.id);

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

  const targetUser = await prisma.user.findUnique({ where: { id: userId }, select: { firstName: true, lastName: true, username: true } });

  await prisma.conversationMember.delete({
    where: { conversationId_userId: { conversationId: conversation.id, userId } },
  });

  const senderName = me.username;
  const removedName = targetUser ? `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim() || targetUser.username : "Un membre";
  void createSystemMessage(conversation.id, `${senderName} a retiré ${removedName} du groupe`, me.id);

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
      await prisma.conversationMember.update({
        where: { conversationId_userId: { conversationId: conversation.id, userId: replacement.userId } },
        data: { role: "OWNER" },
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

  const senderName = me.username;
  void createSystemMessage(conversation.id, `${senderName} a quitté le groupe`, me.id);

  ok(res, null, "You left the conversation");
});

// ── Avatar ──────────────────────────────────────────────────────────────────

messagingRouter.post("/:id/avatar/", singleUpload("avatar", "conversationAvatar"), async (req, res) => {
  const { conversation, me } = await loadConversation(req);
  if (conversation.type !== "GROUP") throw badRequest("Only group conversations have an avatar.");

  // The client sends `remove=true` as a form field rather than issuing a DELETE.
  if (String((req.body as Record<string, unknown>)?.remove ?? "").toLowerCase() === "true") {
    const updated = await prisma.conversation.update({
      where: { id: conversation.id },
      data: { avatarUrl: null },
      include: conversationInclude,
    });
    const senderName = me.username;
    void createSystemMessage(conversation.id, `${senderName} a supprimé la photo du groupe`, me.id);
    publish(conversation.id, "conversation_updated", {
      conversation: serializeConversation(updated, { viewerId: me.id }),
    });
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

  const updated = await prisma.conversation.update({
    where: { id: conversation.id },
    data: { avatarUrl: stored.url },
    include: conversationInclude,
  });

  const senderName = me.username;
  void createSystemMessage(conversation.id, `${senderName} a mis à jour la photo du groupe`, me.id);
  publish(conversation.id, "conversation_updated", {
    conversation: serializeConversation(updated, { viewerId: me.id }),
  });

  ok(res, { avatar_url: stored.url });
});


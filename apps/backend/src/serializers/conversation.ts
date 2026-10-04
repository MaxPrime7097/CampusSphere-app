/**
 * Conversation and message serialisation — API_CONTRACT §2.
 */

import type { Conversation, ConversationMember, Message, MessageReaction, Prisma } from "@prisma/client";
import { serializeUser, userSelect, type SerializableUser } from "./user.js";

export const messageInclude = {
  author: { select: userSelect },
  replyTo: {
    include: {
      author: { select: userSelect },
    },
  },
  reactions: {
    include: {
      user: { select: userSelect },
    },
  },
} satisfies Prisma.MessageInclude;

export type SerializableMessage = Message & {
  author: SerializableUser;
  replyTo?: (Message & { author: SerializableUser }) | null;
  reactions?: Array<MessageReaction & { user: SerializableUser }>;
};

export const conversationInclude = {
  participants: { include: { user: { select: userSelect } } },
  createdBy: { select: userSelect },
} satisfies Prisma.ConversationInclude;

export type SerializableConversation = Conversation & {
  participants: Array<ConversationMember & { user: SerializableUser }>;
  createdBy: SerializableUser | null;
};

export function serializeMessage(
  message: SerializableMessage,
  ctx: { viewerId: number | null; isReadByViewer?: boolean },
): Record<string, unknown> {
  const reactionsSummary: Record<string, string[]> = {};
  if (message.reactions) {
    for (const r of message.reactions) {
      if (!reactionsSummary[r.emoji]) {
        reactionsSummary[r.emoji] = [];
      }
      reactionsSummary[r.emoji].push(String(r.userId));
    }
  }

  const isDeleted = Boolean(message.isDeleted);

  return {
    id: message.id,
    type: (message.type || "TEXT").toLowerCase(),
    status: (message.status || "SENT").toLowerCase(),
    content: isDeleted ? "Ce message a été supprimé" : message.content,
    author: message.authorId,
    author_info: serializeUser(message.author, { viewerId: ctx.viewerId }),
    conversation: message.conversationId,
    media_url: isDeleted ? null : message.mediaUrl,
    media_type: isDeleted ? null : message.mediaType,
    file_name: isDeleted ? null : message.fileName,
    file_size: isDeleted ? null : message.fileSize,
    duration: isDeleted ? null : message.duration,
    reply_to_id: message.replyToId,
    reply_to: message.replyTo
      ? {
          id: message.replyTo.id,
          content: message.replyTo.isDeleted ? "Ce message a été supprimé" : message.replyTo.content,
          type: (message.replyTo.type || "TEXT").toLowerCase(),
          author: message.replyTo.authorId,
          author_info: serializeUser(message.replyTo.author, { viewerId: ctx.viewerId }),
          created_at: message.replyTo.createdAt.toISOString(),
        }
      : null,
    is_deleted: isDeleted,
    deleted_at: message.deletedAt ? message.deletedAt.toISOString() : null,
    reactions: message.reactions
      ? message.reactions.map((r) => ({
          id: r.id,
          emoji: r.emoji,
          user_id: r.userId,
          user: serializeUser(r.user, { viewerId: ctx.viewerId }),
          created_at: r.createdAt.toISOString(),
        }))
      : [],
    reactions_summary: reactionsSummary,
    // `is_read` is the coarse per-message flag the client renders; the precise
    // per-viewer answer is `is_read_by_user`.
    is_read: ctx.isReadByViewer ?? false,
    is_read_by_user: ctx.isReadByViewer ?? false,
    created_at: message.createdAt.toISOString(),
    updated_at: message.updatedAt.toISOString(),
  };
}

export interface ConversationViewerContext {
  viewerId: number;
  unreadCount?: number;
  lastMessage?: SerializableMessage | null;
}

export function serializeConversation(
  conversation: SerializableConversation,
  ctx: ConversationViewerContext,
): Record<string, unknown> {
  return {
    id: conversation.id,
    type: conversation.type.toLowerCase(),
    name: conversation.name,
    avatar: conversation.avatarUrl,
    avatar_url: conversation.avatarUrl,
    participants: conversation.participants.map((p) => p.userId),
    participants_info: conversation.participants.map((p) => serializeUser(p.user, { viewerId: ctx.viewerId })),
    members: conversation.participants.map((p) => ({
      user_id: p.userId,
      role: (p.role || "MEMBER").toLowerCase(),
      joined_at: p.joinedAt ? p.joinedAt.toISOString() : undefined,
      user: serializeUser(p.user, { viewerId: ctx.viewerId }),
    })),
    created_by: conversation.createdById,
    created_by_info: conversation.createdBy ? serializeUser(conversation.createdBy, { viewerId: ctx.viewerId }) : null,
    last_message: ctx.lastMessage ? serializeMessage(ctx.lastMessage, { viewerId: ctx.viewerId }) : null,
    unread_count: ctx.unreadCount ?? 0,
    created_at: conversation.createdAt.toISOString(),
    updated_at: conversation.updatedAt.toISOString(),
  };
}


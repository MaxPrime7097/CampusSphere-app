/**
 * Conversation and message serialisation — API_CONTRACT §2.
 */

import type { Conversation, Message, Prisma } from "@prisma/client";
import { serializeUser, userSelect, type SerializableUser } from "./user.js";

export const messageInclude = {
  author: { select: userSelect },
} satisfies Prisma.MessageInclude;

export type SerializableMessage = Message & { author: SerializableUser };

export const conversationInclude = {
  participants: { include: { user: { select: userSelect } } },
  createdBy: { select: userSelect },
} satisfies Prisma.ConversationInclude;

export type SerializableConversation = Conversation & {
  participants: Array<{ userId: number; user: SerializableUser }>;
  createdBy: SerializableUser | null;
};

export function serializeMessage(
  message: SerializableMessage,
  ctx: { viewerId: number | null; isReadByViewer?: boolean },
): Record<string, unknown> {
  return {
    id: message.id,
    content: message.content,
    author: message.authorId,
    author_info: serializeUser(message.author, { viewerId: ctx.viewerId }),
    conversation: message.conversationId,
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
    created_by: conversation.createdById,
    created_by_info: conversation.createdBy ? serializeUser(conversation.createdBy, { viewerId: ctx.viewerId }) : null,
    last_message: ctx.lastMessage ? serializeMessage(ctx.lastMessage, { viewerId: ctx.viewerId }) : null,
    unread_count: ctx.unreadCount ?? 0,
    created_at: conversation.createdAt.toISOString(),
    updated_at: conversation.updatedAt.toISOString(),
  };
}

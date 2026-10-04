import type { UserProfile } from "./user.types";

export type MessageType = "text" | "image" | "audio" | "video" | "file" | "system";
export type MessageStatus = "sending" | "sent" | "delivered" | "read" | "failed";

export interface MessageAuthor {
  id?: string | number;
  name?: string;
  username?: string;
  avatar?: string | null;
}

export interface MessageReactionItem {
  id?: number;
  emoji: string;
  user_id: number | string;
  user?: MessageAuthor;
  created_at?: string;
}

export interface QuotedMessage {
  id: string;
  content: string;
  type?: MessageType;
  author: string | number;
  author_info?: MessageAuthor;
  created_at?: string;
}

export interface Message {
  id: string;
  type?: MessageType;
  status?: MessageStatus;
  sender: string;
  senderUsername: string;
  senderId: string;
  content: string;
  timestamp: string | null;
  isEdited: boolean;
  isCurrentUser: boolean;
  avatar: string;
  canEdit: boolean;
  canDelete: boolean;
  // Media fields
  mediaUrl?: string | null;
  mediaType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  duration?: number | null;
  // Reply / Quote
  replyToId?: string | null;
  replyTo?: QuotedMessage | null;
  // Soft delete
  isDeleted?: boolean;
  deletedAt?: string | null;
  // Reactions
  reactions?: MessageReactionItem[];
  reactionsSummary?: Record<string, string[]>;
  [key: string]: unknown;
}

export interface RawApiMessage {
  id: string | number;
  type?: string;
  status?: string;
  content: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  author?: string | number | MessageAuthor;
  author_info?: MessageAuthor;
  media_url?: string | null;
  media_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  duration?: number | null;
  reply_to_id?: number | string | null;
  reply_to?: any;
  is_deleted?: boolean;
  deleted_at?: string | null;
  reactions?: MessageReactionItem[];
  reactions_summary?: Record<string, string[]>;
  can_edit?: boolean;
  can_delete?: boolean;
  is_edited?: boolean;
  [key: string]: unknown;
}

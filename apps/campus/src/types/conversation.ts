import type { UserProfile } from "./user.types";
import type { Message } from "./message";

export type ConversationType = "private" | "group";

export interface ConversationParticipant {
  id: string | number;
  name?: string;
  full_name?: string;
  username?: string;
  avatar?: string | null;
  [key: string]: unknown;
}

export interface Conversation {
  id: string;
  hash_id?: string;
  numericId?: number;
  type: ConversationType;
  name: string;
  avatar: string | null;
  participants: ConversationParticipant[];
  lastMessage: string;
  lastMessageAt: string | null;
  unread: number;
  isOnline?: boolean;
  createdBy?: string;
  [key: string]: unknown;
}

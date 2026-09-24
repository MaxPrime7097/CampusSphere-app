import type { UserProfile } from "./user.types";

export interface MessageAuthor {
  id?: string | number;
  name?: string;
  username?: string;
  avatar?: string | null;
}

export interface Message {
  id: string;
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
  [key: string]: unknown;
}

export interface RawApiMessage {
  id: string | number;
  content: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  author?: string | number | MessageAuthor;
  author_info?: MessageAuthor;
  can_edit?: boolean;
  can_delete?: boolean;
  is_edited?: boolean;
  [key: string]: unknown;
}

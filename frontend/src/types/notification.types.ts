import type { UserProfile } from "./user.types";

export type NotificationType =
  | "mention"
  | "comment"
  | "like"
  | "connection_request"
  | "connection_accepted"
  | "sphere_invite"
  | "sphere_joined"
  | "task_assigned"
  | "resource_shared"
  | "system";

export interface NotificationItem {
  id: string | number;
  type: NotificationType | string;
  title?: string;
  message?: string;
  content?: string;
  read: boolean;
  is_read?: boolean;
  actor?: UserProfile | null;
  actor_name?: string;
  actor_avatar?: string | null;
  target_id?: string | number;
  target_type?: string;
  created_at: string;
  createdAt?: string;
  [key: string]: unknown;
}

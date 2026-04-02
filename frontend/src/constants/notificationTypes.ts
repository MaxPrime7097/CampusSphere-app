export const CANONICAL_NOTIFICATION_TYPES = [
  "post_like",
  "post_comment",
  "comment_reply",
  "sphere_invitation",
  "sphere_join_request",
  "task_assigned",
  "task_completed",
  "resource_shared",
  "connection_request",
  "connection_accepted",
  "message",
  "system",
] as const;

export type CanonicalNotificationType = (typeof CANONICAL_NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_SET = new Set<string>(CANONICAL_NOTIFICATION_TYPES);

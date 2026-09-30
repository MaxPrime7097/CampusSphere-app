import { CanonicalNotificationType, NOTIFICATION_TYPE_SET } from "@/constants/notificationTypes";
import { encodeHashId } from "@/lib/hashids";

const LEGACY_TYPE_MAP: Record<string, CanonicalNotificationType> = {
  sphere_invite: "sphere_invitation",
  task: "task_assigned",
  resource: "resource_shared",
  message_received: "message",
};

export type NormalizedNotificationData = {
  postId: string | null;
  profileUsername: string | null;
  senderId: string | null;
  sphereId: string | null;
  taskId: string | null;
  resourceId: string | null;
  conversationId: string | null;
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  return null;
};

export const toCanonicalType = (rawType: unknown): CanonicalNotificationType => {
  if (typeof rawType === "string" && NOTIFICATION_TYPE_SET.has(rawType)) {
    return rawType as CanonicalNotificationType;
  }

  if (typeof rawType === "string" && LEGACY_TYPE_MAP[rawType]) {
    return LEGACY_TYPE_MAP[rawType];
  }

  return "system";
};

export const normalizeNotificationData = (notification: any): NormalizedNotificationData => {
  const data = notification?.data;

  return {
    postId: toNullableString(data?.post_id) || toNullableString(data?.post) || toNullableString(data?.postId),
    profileUsername:
      toNullableString(data?.requester_username) ||
      toNullableString(data?.sender_username) ||
      toNullableString(data?.username),
    senderId:
      toNullableString(data?.sender_id) ||
      toNullableString(data?.requester_id) ||
      toNullableString(data?.user_id) ||
      toNullableString(notification?.sender?.id),
    sphereId: toNullableString(data?.sphere_id) || toNullableString(data?.sphereId) || toNullableString(data?.sphere),
    taskId: toNullableString(data?.task_id) || toNullableString(data?.taskId) || toNullableString(data?.task),
    resourceId: toNullableString(data?.resource_id) || toNullableString(data?.resourceId) || toNullableString(data?.resource),
    conversationId: toNullableString(data?.conversation_id) || toNullableString(data?.conversationId) || toNullableString(data?.conversation),
  };
};

export const buildActionUrl = (type: CanonicalNotificationType, data: NormalizedNotificationData): string | null => {
  switch (type) {
    case "post_like":
    case "post_comment":
    case "comment_reply":
      return data.postId ? `/posts/${encodeHashId(data.postId) || data.postId}` : null;
    case "sphere_invitation":
    case "sphere_join_request":
      return data.sphereId ? `/spheres/${encodeHashId(data.sphereId) || data.sphereId}` : null;
    case "task_assigned":
    case "task_completed":
      return data.taskId ? `/tasks/${data.taskId}` : null;
    case "resource_shared":
      return data.resourceId ? `/resources/${encodeHashId(data.resourceId) || data.resourceId}` : null;
    case "connection_request":
    case "connection_accepted":
      return data.profileUsername ? `/profile/${data.profileUsername}` : null;
    case "message":
      return data.conversationId ? `/messages?id=${data.conversationId}` : "/messages";
    case "system":
    default:
      return null;
  }
};

export const resolveConnectionProfileUrl = async (
  profileUsername: string | null,
  senderId: string | null,
  fetchUsernameById: (senderId: string) => Promise<string | null>
): Promise<string | null> => {
  if (profileUsername) {
    return `/profile/${profileUsername}`;
  }

  if (!senderId) {
    return null;
  }

  const resolvedUsername = await fetchUsernameById(senderId);
  return resolvedUsername ? `/profile/${resolvedUsername}` : null;
};

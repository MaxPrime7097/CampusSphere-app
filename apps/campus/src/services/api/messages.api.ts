/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  apiFetch,
  getAccessToken,
  unwrapItem,
  unwrapList,
} from "./client";

// ============================================================================
// MESSAGING / CONVERSATIONS
// ============================================================================

export async function listConversations(token?: string) {
  return apiFetch<any[]>("api/conversations/", { token: token || getAccessToken() });
}

export async function getUserConversations(token?: string) {
  const response = await apiFetch<any>("api/conversations/user/", { token: token || getAccessToken() });
  return unwrapList<any>(response);
}

export async function getConversation(id: number | string, token?: string) {
  const response = await apiFetch<any>(`api/conversations/${id}/`, { token: token || getAccessToken() });
  return unwrapItem<any>(response);
}

export async function createConversation(
  data: {
    name?: string;
    participants?: (number | string)[];
    type?: "private" | "group";
  },
  token?: string
) {
  const participantIds = (data.participants ?? []).map(id => typeof id === 'string' ? parseInt(id, 10) : id);
  const payload = {
    type: data.type ?? (participantIds.length <= 1 ? "private" : "group"),
    name: data.name,
    participant_ids: participantIds,
  };
  return apiFetch<any>("api/conversations/", {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
}

export async function getConversationMessages(id: number | string, token?: string) {
  if (!id || id === "undefined" || id === "null") return [];
  const response = await apiFetch<any>(`api/conversations/${id}/messages/`, { token: token || getAccessToken() });
  return unwrapList<any>(response);
}

export async function sendMessage(conversationId: number | string, content: string, token?: string) {
  const response = await apiFetch<any>(`api/conversations/${conversationId}/messages/`, {
    method: "POST",
    body: { content },
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function markConversationRead(conversationId: number | string, token?: string) {
  return apiFetch<any>(`api/conversations/${conversationId}/read/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function markConversationUnread(conversationId: number | string, token?: string) {
  return apiFetch<any>(`api/conversations/${conversationId}/unread/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function updateMessage(
  conversationId: number | string,
  messageId: number | string,
  content: string,
  token?: string
) {
  const response = await apiFetch<any>(`api/conversations/${conversationId}/messages/${messageId}/`, {
    method: "PATCH",
    body: { content },
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function deleteMessage(conversationId: number | string, messageId: number | string, token?: string) {
  return apiFetch<any>(`api/conversations/${conversationId}/messages/${messageId}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function createPrivateConversation(userId: number | string, token?: string) {
  const response = await apiFetch<any>("api/conversations/private/create/", {
    method: "POST",
    body: { recipient_id: typeof userId === 'string' ? parseInt(userId, 10) : userId },
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function createGroupConversation(name: string, participantIds: (number | string)[], token?: string) {
  const response = await apiFetch<any>("api/conversations/group/create/", {
    method: "POST",
    body: { name, participant_ids: participantIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id) },
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function getConversationParticipants(conversationId: number | string, token?: string) {
  return apiFetch<any[]>(`api/conversations/${conversationId}/participants/`, { token: token || getAccessToken() });
}

export async function addParticipant(conversationId: number | string, userId: number | string, token?: string) {
  return apiFetch<any>(`api/conversations/${conversationId}/participants/add/`, {
    method: "POST",
    body: { user_id: typeof userId === 'string' ? parseInt(userId, 10) : userId },
    token: token || getAccessToken(),
  });
}

export async function removeParticipant(conversationId: number | string, userId: number | string, token?: string) {
  return apiFetch<any>(`api/conversations/${conversationId}/participants/${userId}/remove/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function renameConversation(conversationId: number | string, name: string, token?: string) {
  const response = await apiFetch<any>(`api/conversations/${conversationId}/`, {
    method: "PATCH",
    body: { name },
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function leaveConversation(conversationId: number | string, token?: string) {
  return apiFetch<any>(`api/conversations/${conversationId}/leave/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function deleteConversation(conversationId: number | string, token?: string) {
  return apiFetch<any>(`api/conversations/${conversationId}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function uploadConversationAvatar(conversationId: number | string, file: File, token?: string) {
  const formData = new FormData();
  formData.append('avatar', file);
  return apiFetch<{ success: boolean; avatar_url: string | null }>(`api/conversations/${conversationId}/avatar/`, {
    method: "POST",
    body: formData,
    token: token || getAccessToken(),
  });
}

export async function removeConversationAvatar(conversationId: number | string, token?: string) {
  const formData = new FormData();
  formData.append('remove', 'true');
  return apiFetch<{ success: boolean; avatar_url: null }>(`api/conversations/${conversationId}/avatar/`, {
    method: "POST",
    body: formData,
    token: token || getAccessToken(),
  });
}

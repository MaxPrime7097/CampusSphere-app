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

export async function getConversationMessages(
  id: number | string,
  params?: { before?: number | string; after?: number | string; page?: number; page_size?: number } | string,
  token?: string,
) {
  if (!id || id === "undefined" || id === "null") return [];
  let qs = "";
  let authToken = token;
  if (typeof params === "string") {
    authToken = params;
  } else if (params) {
    const query = new URLSearchParams();
    if (params.before) query.set("before", String(params.before));
    if (params.after) query.set("after", String(params.after));
    if (params.page) query.set("page", String(params.page));
    if (params.page_size) query.set("page_size", String(params.page_size));
    const str = query.toString();
    if (str) qs = `?${str}`;
  }
  const response = await apiFetch<any>(`api/conversations/${id}/messages/${qs}`, { token: authToken || getAccessToken() });
  return unwrapList<any>(response);
}

export interface SendMessageOptions {
  content?: string;
  file?: File;
  reply_to_id?: number | string;
  duration?: number;
}

export async function sendMessage(
  conversationId: number | string,
  contentOrOptions: string | SendMessageOptions,
  token?: string,
) {
  if (typeof contentOrOptions === "string") {
    const response = await apiFetch<any>(`api/conversations/${conversationId}/messages/`, {
      method: "POST",
      body: { content: contentOrOptions },
      token: token || getAccessToken(),
    });
    return unwrapItem<any>(response);
  }

  if (contentOrOptions.file) {
    const formData = new FormData();
    formData.append("file", contentOrOptions.file);
    if (contentOrOptions.content) formData.append("content", contentOrOptions.content);
    if (contentOrOptions.reply_to_id) formData.append("reply_to_id", String(contentOrOptions.reply_to_id));
    if (contentOrOptions.duration) formData.append("duration", String(contentOrOptions.duration));

    const response = await apiFetch<any>(`api/conversations/${conversationId}/messages/`, {
      method: "POST",
      body: formData,
      token: token || getAccessToken(),
    });
    return unwrapItem<any>(response);
  }

  const response = await apiFetch<any>(`api/conversations/${conversationId}/messages/`, {
    method: "POST",
    body: {
      content: contentOrOptions.content || "",
      reply_to_id: contentOrOptions.reply_to_id ? Number(contentOrOptions.reply_to_id) : undefined,
      duration: contentOrOptions.duration,
    },
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function toggleMessageReaction(
  conversationId: number | string,
  messageId: number | string,
  emoji: string,
  token?: string,
) {
  const response = await apiFetch<any>(`api/conversations/${conversationId}/messages/${messageId}/reactions/`, {
    method: "POST",
    body: { emoji },
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function deleteMessageReaction(
  conversationId: number | string,
  messageId: number | string,
  token?: string,
) {
  const response = await apiFetch<any>(`api/conversations/${conversationId}/messages/${messageId}/reactions/`, {
    method: "DELETE",
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
  const response = await apiFetch<any>(`api/conversations/${conversationId}/avatar/`, {
    method: "POST",
    body: formData,
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function removeConversationAvatar(conversationId: number | string, token?: string) {
  const formData = new FormData();
  formData.append('remove', 'true');
  const response = await apiFetch<any>(`api/conversations/${conversationId}/avatar/`, {
    method: "POST",
    body: formData,
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function getConversationPresence(conversationId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/conversations/${conversationId}/presence/`, {
    token: token || getAccessToken(),
  });
  return unwrapItem<{ conversation_id: number; online_user_ids: number[] }>(response);
}


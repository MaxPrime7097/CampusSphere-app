/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  apiFetch,
  getAccessToken,
  unwrapItem,
} from "./client";

// ============================================================================
// SEARCH
// ============================================================================

export async function globalSearch(query: string, type: string = 'all', limit: number = 10, token?: string) {
  return apiFetch<{ success: boolean; data: any }>(`api/search/?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`, {
    token: token || getAccessToken(),
  });
}

export async function searchSuggestions(query: string, token?: string) {
  return apiFetch<any[]>(`api/search/suggestions/?q=${encodeURIComponent(query)}`, {
    token: token || getAccessToken(),
  });
}

export async function getFilterOptions(token?: string) {
  return apiFetch<any>("api/filters/", { token: token || getAccessToken() });
}

// ============================================================================
// UPLOAD
// ============================================================================

export async function uploadFile(file: File, type: string = "other", token?: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);
  return apiFetch<any>("api/upload/", {
    method: "POST",
    body: formData,
    token: token || getAccessToken(),
  });
}

export async function uploadAvatar(userId: number | string, file: File, token?: string) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<any>(`api/users/${userId}/avatar/`, {
    method: "POST",
    body: formData,
    token: token || getAccessToken(),
  });
}

export async function uploadCoverPhoto(userId: number | string, file: File, token?: string) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<any>(`api/users/${userId}/cover/`, {
    method: "POST",
    body: formData,
    token: token || getAccessToken(),
  });
}

export async function getUserUploads(token?: string) {
  return apiFetch<any[]>("api/uploads/", { token: token || getAccessToken() });
}

export async function getUploadStats(token?: string) {
  return apiFetch<any>("api/uploads/stats/", { token: token || getAccessToken() });
}

// ============================================================================
// CONTACT MESSAGES
// ============================================================================

export async function submitContactMessage(data: { name: string; email: string; subject: string; message: string; newsletter: boolean }) {
  return apiFetch<any>("api/users/contact/", {
    method: "POST",
    body: data,
  });
}

export async function getContactMessages(token?: string) {
  const response = await apiFetch<any>("api/users/admin/contact-messages/", { token: token || getAccessToken() });
  return unwrapItem<any[]>(response) || [];
}

export async function markContactMessageAsRead(id: number, token?: string) {
  return apiFetch<any>(`api/users/admin/contact-messages/${id}/`, {
    method: "PATCH",
    body: { is_read: true },
    token: token || getAccessToken(),
  });
}

export async function deleteContactMessage(id: number, token?: string) {
  return apiFetch<any>(`api/users/admin/contact-messages/${id}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

// ============================================================================
// HEALTH & INFO
// ============================================================================

export async function healthCheck() {
  return apiFetch<{ status: string }>("api/health/");
}

export async function apiInfo() {
  return apiFetch<any>("api/info/");
}

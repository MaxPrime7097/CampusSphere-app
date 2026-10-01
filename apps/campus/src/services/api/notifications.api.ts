/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  apiFetch,
  getAccessToken,
  toNumber,
  unwrapItem,
  unwrapList,
} from "./client";

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function listNotifications(token?: string) {
  const response = await apiFetch<any[]>("api/notifications/", { token: token || getAccessToken() });
  return unwrapList<any>(response);
}

export interface ListNotificationsPaginatedParams {
  page?: number;
  pageSize?: number;
  search?: string;
  read?: "all" | "read" | "unread";
  type?: string;
  ordering?: string;
}

export interface PaginatedApiResult<T> {
  count: number;
  results: T[];
}

export async function listNotificationsPaginated(
  params: ListNotificationsPaginatedParams = {},
  token?: string
): Promise<PaginatedApiResult<any>> {
  const query = new URLSearchParams();

  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("page_size", String(params.pageSize));
  if (params.search) query.set("search", params.search);
  if (params.read && params.read !== "all") query.set("read", params.read);
  if (params.type && params.type !== "all") query.set("type", params.type);
  if (params.ordering) query.set("ordering", params.ordering);

  const suffix = query.toString();
  const response = await apiFetch<any>(
    `api/notifications/${suffix ? `?${suffix}` : ""}`,
    { token: token || getAccessToken() }
  );

  const results = unwrapList<any>(response);
  const count = toNumber(response?.count ?? response?.data?.count ?? results.length, results.length);

  return { count, results };
}

export async function getNotification(id: number | string, token?: string) {
  const response = await apiFetch<any>(`api/notifications/${id}/`, { token: token || getAccessToken() });
  return unwrapItem<any>(response);
}

export async function markNotificationRead(id: number | string, token?: string) {
  const response = await apiFetch<any>(`api/notifications/${id}/read/`, {
    method: "PUT",
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function markAllNotificationsRead(token?: string) {
  const response = await apiFetch<any>("api/notifications/read-all/", {
    method: "PUT",
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export interface DeleteNotificationResponse {
  success?: boolean;
  message?: string;
}

export async function deleteNotification(id: number | string, token?: string) {
  const response = await apiFetch<DeleteNotificationResponse>(`api/notifications/${id}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
  return unwrapItem<DeleteNotificationResponse>(response);
}

export async function getNotificationSettings(token?: string) {
  const response = await apiFetch<any>("api/notifications/settings/", { token: token || getAccessToken() });
  return unwrapItem<any>(response);
}

export async function updateNotificationSettings(data: Record<string, boolean>, token?: string) {
  const response = await apiFetch<any>("api/notifications/settings/", {
    method: "PUT",
    body: data,
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function getNotificationStats(token?: string) {
  const response = await apiFetch<any>("api/notifications/stats/", { token: token || getAccessToken() });
  return unwrapItem<any>(response);
}

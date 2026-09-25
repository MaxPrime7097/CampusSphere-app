/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  apiFetch,
  getAccessToken,
  unwrapItem,
  unwrapList,
} from "./client";

// ============================================================================
// TASKS & KANBAN
// ============================================================================

export async function listTasks(params?: Record<string, string | number>, token?: string) {
  const query = params
    ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`
    : "";
  const response = await apiFetch<any>(`api/tasks/${query}`, { token: token || getAccessToken() });
  return unwrapList(response);
}

export async function getTask(id: number | string, token?: string) {
  const response = await apiFetch<any>(`api/tasks/${id}/`, { token: token || getAccessToken() });
  return unwrapItem(response);
}

export async function createTask(
  data: {
    title: string;
    description?: string;
    sphere_id?: number;
    due_date?: string;
    priority?: string;
    status?: string;
    assigned_to?: number;
  },
  token?: string
) {
  const payload = { ...data } as any;
  if (payload.sphere_id !== undefined && payload.sphere === undefined) {
    payload.sphere = payload.sphere_id;
    delete payload.sphere_id;
  }
  return apiFetch<any>("api/tasks/", {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
}

export async function updateTask(
  id: number | string,
  data: Partial<{
    title: string;
    description: string;
    due_date: string;
    priority: string;
    status: string;
  }>,
  token?: string
) {
  return apiFetch<any>(`api/tasks/${id}/`, {
    method: "PUT",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function deleteTask(id: number | string, token?: string) {
  return apiFetch<any>(`api/tasks/${id}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function completeTask(id: number | string, token?: string) {
  return apiFetch<any>(`api/tasks/${id}/complete/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function moveTask(
  id: number | string,
  kanbanStatus: "todo" | "in_progress" | "review" | "done",
  token?: string
) {
  const response = await apiFetch<any>(`api/tasks/${id}/move/`, {
    method: "PATCH",
    body: { kanban_status: kanbanStatus },
    token: token || getAccessToken(),
  });
  return unwrapItem<any>(response);
}

export async function assignTask(id: number | string, userId: number | string, token?: string) {
  return apiFetch<any>(`api/tasks/${id}/assign/`, {
    method: "POST",
    body: { assigned_to_id: typeof userId === "string" ? parseInt(userId) : userId },
    token: token || getAccessToken(),
  });
}

export async function listSphereTasks(sphereId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/tasks/sphere/${sphereId}/`, { token: token || getAccessToken() });
  return unwrapList(response);
}

export async function getUserTasks(userId?: number | string, token?: string) {
  const path = userId ? `api/tasks/user/${userId}/` : "api/tasks/user/";
  const response = await apiFetch<any>(path, { token: token || getAccessToken() });
  return unwrapList(response);
}

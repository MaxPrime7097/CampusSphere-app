/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getAccessToken(): string | undefined {
  try {
    const token = localStorage.getItem("access");
    return token || undefined;
  } catch {
    return undefined;
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function apiFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    token?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const { method = "GET", body, token, headers = {}, signal } = options;
  const url = path.startsWith("http") ? path : `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": body instanceof FormData ? undefined as unknown as string : "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body instanceof FormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

export async function register(payload: {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  university?: string;
  faculty?: string;
  study_year?: string;
  student_id?: string;
  campus?: string;
  town?: string;
  language?: string;
  bio?: string;
  skills?: string[];
  interests?: string[];
  previous_education?: Array<{degree: string, school: string, year: string}>;
  experiences?: Array<{title: string, company: string, duration: string, description: string}>;
  portfolio_links?: Array<{name: string, url: string}>;
}) {
  return apiFetch<{ success: boolean; data: { user: any; tokens: { accessToken: string; refreshToken: string } }; message: string }>(
    "api/users/auth/register/",
    { method: "POST", body: payload }
  );
}

export async function login(payload: { email: string; password: string }) {
  const response = await apiFetch<{ success: boolean; data: { user: any; tokens: { accessToken: string; refreshToken: string } }; message: string }>(
    "api/users/auth/login/",
    { method: "POST", body: payload }
  );
  
  // Sauvegarder les tokens
  if (response.data?.tokens?.accessToken) {
    localStorage.setItem("access", response.data.tokens.accessToken);
    if (response.data.tokens.refreshToken) {
      localStorage.setItem("refresh", response.data.tokens.refreshToken);
    }
  }
  
  return response;
}

export async function refreshToken(refresh: string) {
  return apiFetch<{ access: string }>("api/auth/refresh/", { method: "POST", body: { refresh } });
}

// ============================================================================
// USERS
// ============================================================================

export async function getCurrentUser(token?: string) {
  return apiFetch<{ success: boolean; data: any; timestamp: string }>("api/users/auth/me/", { token: token || getAccessToken() });
}

export async function getUser(id: number | string, token?: string) {
  return apiFetch<any>(`api/users/${id}/`, { token: token || getAccessToken() });
}

export async function getUserProfile(token?: string) {
  return apiFetch<any>("api/users/profile/", { token: token || getAccessToken() });
}

export async function updateUserProfile(data: Partial<{
  first_name: string;
  last_name: string;
  bio: string;
  university: string;
  faculty: string;
  study_year: string;
  skills: string[];
  interests: string[];
  current_mood: string;
}>, token?: string) {
  return apiFetch<any>("api/users/profile/", {
    method: "PUT",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function searchUsers(query: string, token?: string) {
  return apiFetch<any[]>(`api/users/search/?q=${encodeURIComponent(query)}`, { token: token || getAccessToken() });
}

export async function getUserByUsername(username: string, token?: string) {
  return apiFetch<any[]>(`api/users/search/?q=${encodeURIComponent(username)}`, { token: token || getAccessToken() });
}

// Connections
export async function getUserConnections(userId: number | string, token?: string) {
  return apiFetch<any[]>(`api/users/${userId}/connections/`, { token: token || getAccessToken() });
}

export async function createConnection(userId: number | string, token?: string) {
  return apiFetch<any>(`api/users/${userId}/connections/`, {
    method: "POST",
    body: {},
    token: token || getAccessToken(),
  });
}

export async function deleteConnection(userId: number | string, connectionId: number | string, token?: string) {
  return apiFetch<any>(`api/users/${userId}/connections/${connectionId}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

// ============================================================================
// SPHERES
// ============================================================================

export async function listSpheres(params?: Record<string, string | number>, token?: string) {
  const query = params
    ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`
    : "";
  return apiFetch<any[]>(`api/spheres/${query}`, { token: token || getAccessToken() });
}

export async function getSphere(id: number | string, token?: string) {
  return apiFetch<any>(`api/spheres/${id}/`, { token: token || getAccessToken() });
}

export async function createSphere(data: {
  name: string;
  description?: string;
  category?: string;
  type?: string;
  is_private?: boolean;
}, token?: string) {
  return apiFetch<any>("api/spheres/", {
    method: "POST",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function updateSphere(id: number | string, data: Partial<{
  name: string;
  description: string;
  category: string;
  type: string;
  is_private: boolean;
}>, token?: string) {
  return apiFetch<any>(`api/spheres/${id}/`, {
    method: "PUT",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function deleteSphere(id: number | string, token?: string) {
  return apiFetch<any>(`api/spheres/${id}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function joinSphere(id: number | string, payload: Record<string, unknown> = {}, token?: string) {
  return apiFetch<{ success: boolean; data?: any }>(`api/spheres/${id}/join/`, {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
}

export async function leaveSphere(id: number | string, token?: string) {
  return apiFetch<{ success: boolean }>(`api/spheres/${id}/leave/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function listSphereMembers(id: number | string, token?: string) {
  return apiFetch<any[]>(`api/spheres/${id}/members/`, { token: token || getAccessToken() });
}

export async function getUserSpheres(token?: string) {
  return apiFetch<any[]>("api/spheres/user/spheres/", { token: token || getAccessToken() });
}

// ============================================================================
// POSTS
// ============================================================================

export async function listPosts(params?: Record<string, string | number>, token?: string) {
  const query = params
    ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`
    : "";
  return apiFetch<any[]>(`api/posts/${query}`, { token: token || getAccessToken() });
}

export async function getPost(id: number | string, token?: string) {
  return apiFetch<any>(`api/posts/${id}/`, { token: token || getAccessToken() });
}

export async function createPost(data: {
  content: string;
  visibility?: string;
  sphere_id?: number;
  tags?: string[];
  category?: string;
  subject?: string;
  type?: string;
}, token?: string) {
  return apiFetch<any>("api/posts/", {
    method: "POST",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function updatePost(id: number | string, data: Partial<{
  content: string;
  visibility: string;
  tags: string[];
}>, token?: string) {
  return apiFetch<any>(`api/posts/${id}/`, {
    method: "PUT",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function deletePost(id: number | string, token?: string) {
  return apiFetch<any>(`api/posts/${id}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function likePost(id: number | string, token?: string) {
  return apiFetch<any>(`api/posts/${id}/like/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function pinPost(id: number | string, token?: string) {
  return apiFetch<any>(`api/posts/${id}/pin/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function getUserPosts(userId: number | string, token?: string) {
  return apiFetch<any[]>(`api/posts/user/${userId}/`, { token: token || getAccessToken() });
}

export async function getSpherePosts(sphereId: number | string, token?: string) {
  return apiFetch<any[]>(`api/posts/sphere/${sphereId}/`, { token: token || getAccessToken() });
}

// Comments
export async function getPostComments(postId: number | string, token?: string) {
  return apiFetch<any[]>(`api/posts/${postId}/comments/`, { token: token || getAccessToken() });
}

export async function createComment(postId: number | string, data: { content: string }, token?: string) {
  return apiFetch<any>(`api/posts/${postId}/comments/`, {
    method: "POST",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function likeComment(commentId: number | string, token?: string) {
  return apiFetch<any>(`api/posts/comments/${commentId}/like/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

// ============================================================================
// RESOURCES
// ============================================================================

export async function listResources(params?: Record<string, string | number>, token?: string) {
  const query = params
    ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`
    : "";
  return apiFetch<any[]>(`api/resources/${query}`, { token: token || getAccessToken() });
}

export async function getResource(id: number | string, token?: string) {
  return apiFetch<any>(`api/resources/${id}/`, { token: token || getAccessToken() });
}

export async function createResource(data: FormData, token?: string) {
  return apiFetch<any>("api/resources/", {
    method: "POST",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function updateResource(id: number | string, data: Partial<{
  title: string;
  description: string;
  category: string;
  tags: string[];
}>, token?: string) {
  return apiFetch<any>(`api/resources/${id}/`, {
    method: "PUT",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function deleteResource(id: number | string, token?: string) {
  return apiFetch<any>(`api/resources/${id}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function downloadResource(id: number | string, token?: string) {
  return apiFetch<any>(`api/resources/${id}/download/`, { token: token || getAccessToken() });
}

export async function saveResource(id: number | string, token?: string) {
  return apiFetch<any>(`api/resources/${id}/save/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function getSavedResources(token?: string) {
  return apiFetch<any[]>("api/resources/saved/", { token: token || getAccessToken() });
}

export async function getUserResources(userId: number | string, token?: string) {
  return apiFetch<any[]>(`api/resources/user/${userId}/`, { token: token || getAccessToken() });
}

// ============================================================================
// TASKS
// ============================================================================

export async function listTasks(params?: Record<string, string | number>, token?: string) {
  const query = params
    ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`
    : "";
  return apiFetch<any[]>(`api/tasks/${query}`, { token: token || getAccessToken() });
}

export async function getTask(id: number | string, token?: string) {
  return apiFetch<any>(`api/tasks/${id}/`, { token: token || getAccessToken() });
}

export async function createTask(data: {
  title: string;
  description?: string;
  sphere_id?: number;
  due_date?: string;
  priority?: string;
  status?: string;
  assigned_to?: number;
}, token?: string) {
  return apiFetch<any>("api/tasks/", {
    method: "POST",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function updateTask(id: number | string, data: Partial<{
  title: string;
  description: string;
  due_date: string;
  priority: string;
  status: string;
}>, token?: string) {
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

export async function assignTask(id: number | string, userId: number | string, token?: string) {
  return apiFetch<any>(`api/tasks/${id}/assign/`, {
    method: "POST",
    body: { user_id: userId },
    token: token || getAccessToken(),
  });
}

export async function listSphereTasks(sphereId: number | string, token?: string) {
  return apiFetch<any[]>(`api/tasks/sphere/${sphereId}/`, { token: token || getAccessToken() });
}

export async function getUserTasks(userId?: number | string, token?: string) {
  const path = userId ? `api/tasks/user/${userId}/` : "api/tasks/user/";
  return apiFetch<any[]>(path, { token: token || getAccessToken() });
}

// ============================================================================
// MESSAGING / CONVERSATIONS
// ============================================================================

export async function listConversations(token?: string) {
  return apiFetch<any[]>("api/conversations/", { token: token || getAccessToken() });
}

export async function getUserConversations(token?: string) {
  return apiFetch<any[]>("api/conversations/user/", { token: token || getAccessToken() });
}

export async function getConversation(id: number | string, token?: string) {
  return apiFetch<any>(`api/conversations/${id}/`, { token: token || getAccessToken() });
}

export async function createConversation(data: {
  name?: string;
  participants?: (number | string)[];
  is_group?: boolean;
}, token?: string) {
  return apiFetch<any>("api/conversations/", {
    method: "POST",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function getConversationMessages(id: number | string, token?: string) {
  return apiFetch<any[]>(`api/conversations/${id}/messages/`, { token: token || getAccessToken() });
}

export async function sendMessage(conversationId: number | string, content: string, token?: string) {
  return apiFetch<any>(`api/conversations/${conversationId}/messages/`, {
    method: "POST",
    body: { content },
    token: token || getAccessToken(),
  });
}

export async function markConversationRead(conversationId: number | string, token?: string) {
  return apiFetch<any>(`api/conversations/${conversationId}/read/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function createPrivateConversation(userId: number | string, token?: string) {
  return apiFetch<any>("api/conversations/private/create/", {
    method: "POST",
    body: { user_id: userId },
    token: token || getAccessToken(),
  });
}

export async function createGroupConversation(name: string, participantIds: (number | string)[], token?: string) {
  return apiFetch<any>("api/conversations/group/create/", {
    method: "POST",
    body: { name, participant_ids: participantIds },
    token: token || getAccessToken(),
  });
}

export async function getConversationParticipants(conversationId: number | string, token?: string) {
  return apiFetch<any[]>(`api/conversations/${conversationId}/participants/`, { token: token || getAccessToken() });
}

export async function addParticipant(conversationId: number | string, userId: number | string, token?: string) {
  return apiFetch<any>(`api/conversations/${conversationId}/participants/add/`, {
    method: "POST",
    body: { user_id: userId },
    token: token || getAccessToken(),
  });
}

export async function removeParticipant(conversationId: number | string, userId: number | string, token?: string) {
  return apiFetch<any>(`api/conversations/${conversationId}/participants/${userId}/remove/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export async function listNotifications(token?: string) {
  return apiFetch<any[]>("api/notifications/", { token: token || getAccessToken() });
}

export async function getNotification(id: number | string, token?: string) {
  return apiFetch<any>(`api/notifications/${id}/`, { token: token || getAccessToken() });
}

export async function markNotificationRead(id: number | string, token?: string) {
  return apiFetch<any>(`api/notifications/${id}/read/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function markAllNotificationsRead(token?: string) {
  return apiFetch<any>("api/notifications/read-all/", {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function getNotificationSettings(token?: string) {
  return apiFetch<any>("api/notifications/settings/", { token: token || getAccessToken() });
}

export async function updateNotificationSettings(data: Record<string, boolean>, token?: string) {
  return apiFetch<any>("api/notifications/settings/", {
    method: "PUT",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function getNotificationStats(token?: string) {
  return apiFetch<any>("api/notifications/stats/", { token: token || getAccessToken() });
}

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

export async function uploadFile(file: File, token?: string) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<any>("api/upload/", {
    method: "POST",
    body: formData,
    token: token || getAccessToken(),
  });
}

export async function uploadAvatar(userId: number | string, file: File, token?: string) {
  const formData = new FormData();
  formData.append('avatar', file);
  return apiFetch<any>(`api/users/${userId}/avatar/`, {
    method: "POST",
    body: formData,
    token: token || getAccessToken(),
  });
}

export async function uploadCoverPhoto(userId: number | string, file: File, token?: string) {
  const formData = new FormData();
  formData.append('cover', file);
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
// HEALTH & INFO
// ============================================================================

export async function healthCheck() {
  return apiFetch<{ status: string }>("api/health/");
}

export async function apiInfo() {
  return apiFetch<any>("api/info/");
}

// ============================================================================
// EXPORTS
// ============================================================================

export const http = { apiFetch };

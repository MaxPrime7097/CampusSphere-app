/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  apiFetch,
  getAccessToken,
  normalizePosts,
  normalizeResources,
  normalizeSphere,
  normalizeSpheres,
  unwrapItem,
  unwrapList,
} from "./client";

export interface UpdateSphereMemberRequest {
  status?: "active" | "pending" | "inactive" | "banned";
  role?: "admin" | "moderator" | "member";
}

export interface SphereMemberActionResponse {
  success?: boolean;
  message?: string;
  data?: {
    id?: number | string;
    status?: string;
    role?: string;
  };
}

// ============================================================================
// SPHERE CRUD & LIFECYCLE
// ============================================================================

export async function listSpheres(params?: Record<string, string | number>, token?: string) {
  const query = params
    ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`
    : "";
  const response = await apiFetch<any>(`api/spheres/${query}`, { token: token || getAccessToken() });
  return normalizeSpheres(unwrapList(response));
}

export async function getSphere(id: number | string, token?: string) {
  const response = await apiFetch<any>(`api/spheres/${id}/`, { token: token || getAccessToken() });
  return normalizeSphere(unwrapItem(response));
}

export async function createSphere(
  data: {
    name: string;
    description?: string;
    category?: string;
    sphere_type?: string;
    is_private?: boolean;
    require_approval?: boolean;
    color?: string;
    icon?: string;
    objective?: string;
    target_audience?: string;
    duration?: string;
    collaboration_types?: string[];
  },
  token?: string
) {
  const response = await apiFetch<any>("api/spheres/", {
    method: "POST",
    body: data,
    token: token || getAccessToken(),
  });
  return normalizeSphere(unwrapItem(response));
}

export async function updateSphere(
  id: number | string,
  data: Partial<{
    name: string;
    description: string;
    category: string;
    sphere_type: string;
    is_private: boolean;
    require_approval: boolean;
    duration: string;
    auto_delete_on_expiry: boolean;
    objective: string;
    target_audience: string;
    collaboration_types: string[];
  }>,
  token?: string
) {
  return apiFetch<any>(`api/spheres/${id}/`, {
    method: "PUT",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function extendSphereDuration(
  id: number | string,
  duration: string,
  token?: string
) {
  const response = await apiFetch<any>(`api/spheres/${id}/extend-duration/`, {
    method: "POST",
    body: { duration },
    token: token || getAccessToken(),
  });
  return normalizeSphere(unwrapItem(response));
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

export async function cancelSphereJoinRequest(id: number | string, token?: string) {
  return apiFetch<{ success: boolean; message?: string }>(`api/spheres/${id}/cancel-request/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

// ============================================================================
// SPHERE MEMBERS
// ============================================================================

export async function listSphereMembers(id: number | string, token?: string) {
  const response = await apiFetch<any>(`api/spheres/${id}/members/`, { token: token || getAccessToken() });
  return unwrapList<any>(response);
}

export async function addSphereMember(
  sphereId: number | string,
  data: { user: number | string; role?: string },
  token?: string
) {
  return apiFetch<any>(`api/spheres/${sphereId}/members/`, {
    method: "POST",
    body: {
      user: data.user,
      role: data.role ?? "member",
    },
    token: token || getAccessToken(),
  });
}

export async function updateSphereMember(
  sphereId: number | string,
  memberId: number | string,
  data: UpdateSphereMemberRequest,
  token?: string
) {
  return apiFetch<SphereMemberActionResponse>(`api/spheres/${sphereId}/members/${memberId}/`, {
    method: "PATCH",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function removeSphereMember(
  sphereId: number | string,
  memberId: number | string,
  token?: string
) {
  return apiFetch<SphereMemberActionResponse>(`api/spheres/${sphereId}/members/${memberId}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function getUserSpheres(token?: string) {
  const response = await apiFetch<any>("api/spheres/user/spheres/", { token: token || getAccessToken() });
  return normalizeSpheres(unwrapList(response));
}

export async function getSphereOverview(id: number | string, token?: string) {
  const response = await apiFetch<any>(`api/spheres/${id}/overview/`, { token: token || getAccessToken() });
  return unwrapItem<any>(response);
}

// ============================================================================
// BANNER & ASSETS
// ============================================================================

export async function uploadSphereBanner(id: number | string, file: File, token?: string) {
  const formData = new FormData();
  formData.append("banner", file);
  return apiFetch<{ success: boolean; banner_image_url: string | null }>(`api/spheres/${id}/banner/`, {
    method: "POST",
    body: formData,
    token: token || getAccessToken(),
  });
}

export async function removeSphereBanner(id: number | string, token?: string) {
  const formData = new FormData();
  formData.append("remove", "true");
  return apiFetch<{ success: boolean; banner_image_url: null }>(`api/spheres/${id}/banner/`, {
    method: "POST",
    body: formData,
    token: token || getAccessToken(),
  });
}

// ============================================================================
// SPHERE POSTS, RESOURCES & FILES
// ============================================================================

export async function getSpherePosts(sphereId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/posts/sphere/${sphereId}/`, { token: token || getAccessToken() });
  return normalizePosts(unwrapList(response));
}

export async function getSphereResources(sphereId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/resources/sphere/${sphereId}/`, { token: token || getAccessToken() });
  return normalizeResources(unwrapList(response));
}

export async function getSphereFiles(sphereId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/spheres/${sphereId}/files/`, { token: token || getAccessToken() });
  return unwrapList<any>(response);
}

export async function uploadSphereFile(
  sphereId: number | string,
  file: File,
  title: string,
  token?: string
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("title", title);
  return apiFetch<any>(`api/spheres/${sphereId}/files/`, {
    method: "POST",
    body: formData,
    token: token || getAccessToken(),
  });
}

export async function deleteSphereFile(
  sphereId: number | string,
  fileId: number | string,
  token?: string
) {
  return apiFetch<any>(`api/spheres/${sphereId}/files/${fileId}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  apiFetch,
  getAccessToken,
  normalizePost,
  normalizePosts,
  unwrapItem,
  unwrapList,
} from "./client";

// ============================================================================
// POSTS CRUD
// ============================================================================

export async function listPosts(params?: Record<string, string | number>, token?: string) {
  const query = params
    ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`
    : "";
  const response = await apiFetch<any>(`api/posts/${query}`, { token: token || getAccessToken() });
  return normalizePosts(unwrapList(response));
}

export async function getPost(id: number | string, token?: string) {
  const response = await apiFetch<any>(`api/posts/${id}/`, { token: token || getAccessToken() });
  return normalizePost(unwrapItem(response));
}

export async function createPost(
  data:
    | {
        content: string;
        visibility?: string;
        sphere_id?: number;
        tags?: string[];
        category?: string;
        subject?: string;
        type?: string;
      }
    | FormData,
  token?: string
) {
  if (data instanceof FormData) {
    const sphereId = data.get("sphere_id");
    if (sphereId !== null && data.get("sphere") === null) {
      data.append("sphere", String(sphereId));
      data.delete("sphere_id");
    }

    return apiFetch<any>("api/posts/", {
      method: "POST",
      body: data,
      token: token || getAccessToken(),
    });
  }

  const payload = { ...data } as any;
  if (payload.sphere_id !== undefined && payload.sphere === undefined) {
    payload.sphere = payload.sphere_id;
    delete payload.sphere_id;
  }
  return apiFetch<any>("api/posts/", {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
}

export async function updatePost(
  id: number | string,
  data: Partial<{
    content: string;
    visibility: string;
    tags: string[];
  }>,
  token?: string
) {
  const response = await apiFetch<any>(`api/posts/${id}/`, {
    method: "PUT",
    body: data,
    token: token || getAccessToken(),
  });
  return normalizePost(unwrapItem(response));
}

export async function deletePost(id: number | string, token?: string) {
  return apiFetch<any>(`api/posts/${id}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

// ============================================================================
// INTERACTIONS & REACTIONS
// ============================================================================

export async function likePost(id: number | string, token?: string) {
  return apiFetch<any>(`api/posts/${id}/like/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function savePost(id: number | string, token?: string) {
  return apiFetch<any>(`api/posts/${id}/save/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function reportPost(
  id: number | string,
  payload: { reason?: string; details?: string } = {},
  token?: string
) {
  return apiFetch<any>(`api/posts/${id}/report/`, {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
}

export async function impactRatePost(
  id: number | string,
  value: number | null,
  token?: string
) {
  return apiFetch<any>(`api/posts/${id}/impact-rate/`, {
    method: "POST",
    body: { value },
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
  const response = await apiFetch<any>(`api/posts/user/${userId}/`, { token: token || getAccessToken() });
  return normalizePosts(unwrapList(response));
}

export async function getSavedPosts(token?: string) {
  const response = await apiFetch<any>("api/posts/saved/", { token: token || getAccessToken() });
  return normalizePosts(unwrapList(response));
}

// ============================================================================
// COMMENTS
// ============================================================================

export async function getPostComments(postId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/posts/${postId}/comments/`, { token: token || getAccessToken() });
  return unwrapList(response);
}

export async function createComment(
  postId: number | string,
  data: { content: string; parent?: number | string },
  token?: string
) {
  const bodyData: any = { content: data.content };
  if (data.parent) {
    bodyData.parent = typeof data.parent === "string" ? parseInt(data.parent) : data.parent;
  }
  return apiFetch<any>(`api/posts/${postId}/comments/`, {
    method: "POST",
    body: bodyData,
    token: token || getAccessToken(),
  });
}

export async function updateComment(commentId: number | string, data: { content: string }, token?: string) {
  return apiFetch<any>(`api/posts/comments/${commentId}/`, {
    method: "PUT",
    body: data,
    token: token || getAccessToken(),
  });
}

export async function deleteComment(commentId: number | string, token?: string) {
  return apiFetch<any>(`api/posts/comments/${commentId}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function likeComment(commentId: number | string, token?: string) {
  return apiFetch<any>(`api/posts/comments/${commentId}/like/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  apiFetch,
  getAccessToken,
  normalizeUser,
  normalizeUsers,
  unwrapItem,
  unwrapList,
} from "./client";

// ============================================================================
// USER PROFILES
// ============================================================================

export async function getCurrentUser(token?: string) {
  const response = await apiFetch<{ success: boolean; data: any; timestamp: string }>(
    "api/users/auth/me/",
    { token: token || getAccessToken() }
  );
  return normalizeUser(response?.data ?? response);
}

export async function getUser(id: number | string, token?: string) {
  const data = await apiFetch<any>(`api/users/${id}/`, { token: token || getAccessToken() });
  return normalizeUser(unwrapItem(data));
}

export async function getUserProfile(token?: string) {
  const data = await apiFetch<any>("api/users/profile/", { token: token || getAccessToken() });
  return normalizeUser(unwrapItem(data));
}

export async function updateUserProfile(
  data: Partial<{
    first_name: string;
    last_name: string;
    username: string;
    bio: string;
    university: string;
    faculty: string;
    study_year: string;
    town: string;
    language: string[];
    skills: string[];
    interests: string[];
    current_mood: string;
    experiences: any[];
    previous_education: any[];
    portfolio_links: any[];
    student_id: string;
    campus: string;
    phone_number: string;
    date_of_birth: string;
  }>,
  token?: string
) {
  const response = await apiFetch<any>("api/users/profile/", {
    method: "PATCH",
    body: data,
    token: token || getAccessToken(),
  });
  return normalizeUser(unwrapItem(response));
}

export async function getUserByUsername(username: string, token?: string) {
  const response = await apiFetch<any>(`api/users/by-username/${encodeURIComponent(username)}/`, {
    token: token || getAccessToken(),
  });
  return normalizeUser(unwrapItem(response));
}

export async function searchUsers(query: string, token?: string) {
  const response = await apiFetch<any>(`api/users/search/?q=${encodeURIComponent(query)}`, {
    token: token || getAccessToken(),
  });
  return normalizeUsers(unwrapList(response));
}

// ============================================================================
// PRIVACY & BLOCKS
// ============================================================================

export async function getPrivacySettings(token?: string) {
  const response = await apiFetch<any>("api/users/privacy/", {
    token: token || getAccessToken(),
  });
  return unwrapItem(response);
}

export async function updatePrivacySettings(
  payload: Partial<{
    profile_visibility: string;
    post_visibility: string;
  }>,
  token?: string
) {
  const response = await apiFetch<any>("api/users/privacy/", {
    method: "PUT",
    body: payload,
    token: token || getAccessToken(),
  });
  return unwrapItem(response);
}

export async function requestUserDataExport(
  payload: { include_connections: boolean; include_posts: boolean },
  token?: string
) {
  const response = await apiFetch<any>("api/users/data-export/", {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
  return unwrapItem(response);
}

export async function getBlockedUsers(token?: string) {
  const response = await apiFetch<any>("api/users/blocks/", {
    token: token || getAccessToken(),
  });
  return unwrapList(response);
}

export async function blockUser(blockedUserId: number, token?: string) {
  const response = await apiFetch<any>("api/users/blocks/", {
    method: "POST",
    body: { blocked_user_id: blockedUserId },
    token: token || getAccessToken(),
  });
  return unwrapItem(response);
}

export async function unblockUser(blockId: number, token?: string) {
  return apiFetch<any>(`api/users/blocks/${blockId}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

// ============================================================================
// CONNECTIONS
// ============================================================================

export async function getUserConnections(userId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/users/${userId}/connections/`, {
    token: token || getAccessToken(),
  });
  return unwrapList(response);
}

export interface UserConnectionRelationResponse {
  target_user_id: number;
  is_self: boolean;
  is_connected: boolean;
  can_connect: boolean;
  can_disconnect: boolean;
  connection: any | null;
}

export async function getUserConnectionRelation(targetUserId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/users/${targetUserId}/connection-relation/`, {
    token: token || getAccessToken(),
  });
  return unwrapItem<UserConnectionRelationResponse>(response);
}

export async function connectWithUser(targetUserId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/users/${targetUserId}/connection-relation/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
  return unwrapItem(response);
}

export async function disconnectFromUser(targetUserId: number | string, token?: string) {
  return apiFetch<any>(`api/users/${targetUserId}/connection-relation/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function acceptConnection(targetUserId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/users/${targetUserId}/connection-relation/`, {
    method: "PATCH",
    token: token || getAccessToken(),
  });
  return unwrapItem(response);
}

export interface MutualConnectionCountRequest {
  currentUserId: number | string;
  connectionUserIds: Array<number | string>;
}

export interface MutualConnectionCountResponse {
  counts: Record<string, number>;
}

export async function getMutualConnectionCounts(
  data: MutualConnectionCountRequest,
  token?: string
): Promise<MutualConnectionCountResponse> {
  const currentConnections = await getUserConnections(data.currentUserId, token);
  const currentConnectionIds = new Set(
    (currentConnections || []).map((conn: any) =>
      String(conn.requester === data.currentUserId ? conn.recipient : conn.requester)
    )
  );

  const results = await Promise.allSettled(
    (data.connectionUserIds || []).map(async (connectionUserId) => {
      const connectionUserConnections = await getUserConnections(connectionUserId, token);
      const mutualCount = (connectionUserConnections || []).reduce((count: number, conn: any) => {
        const counterpartId = String(
          conn.requester === connectionUserId ? conn.recipient : conn.requester
        );
        return currentConnectionIds.has(counterpartId) ? count + 1 : count;
      }, 0);

      return { userId: String(connectionUserId), mutualCount };
    })
  );

  const counts = results.reduce<Record<string, number>>((acc, result) => {
    if (result.status === "fulfilled") {
      acc[result.value.userId] = result.value.mutualCount;
    }
    return acc;
  }, {});

  return { counts };
}

export async function createConnection(recipientId: number | string, token?: string) {
  return apiFetch<any>(`api/users/${recipientId}/connections/`, {
    method: "POST",
    body: { recipient: recipientId },
    token: token || getAccessToken(),
  });
}

export async function deleteConnection(
  userId: number | string,
  connectionId: number | string,
  token?: string
) {
  return apiFetch<any>(`api/users/${userId}/connections/${connectionId}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function getConnectionRecommendations(token?: string) {
  const response = await apiFetch<any>("api/users/connections/recommendations/", {
    token: token || getAccessToken(),
  });
  return normalizeUsers(unwrapList(response));
}

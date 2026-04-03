/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalizeResourceType } from "@/constants/resourceTypes";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getAccessToken(): string | undefined {
  try {
    const token = localStorage.getItem("access");
    return token || undefined;
  } catch {
    return undefined;
  }
}

function getRefreshToken(): string | undefined {
  try {
    const token = localStorage.getItem("refresh");
    return token || undefined;
  } catch {
    return undefined;
  }
}

function setTokens(access?: string | null, refresh?: string | null) {
  try {
    if (access == null) {
      localStorage.removeItem("access");
    } else {
      localStorage.setItem("access", access);
    }

    if (refresh == null) {
      localStorage.removeItem("refresh");
    } else {
      localStorage.setItem("refresh", refresh);
    }
  } catch {
    // ignore storage errors
  }
}

function clearTokens() {
  try {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  } catch {
    // ignore
  }
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export class ApiRequestError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

export function isApiRequestErrorStatus(error: unknown, status: number): boolean {
  return (
    error instanceof ApiRequestError
      ? error.status === status
      : Boolean((error as any)?.message?.includes?.(`Request failed: ${status}`))
  );
}

function toArray<T>(value: T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function unwrapItem<T = any>(response: any): T | null {
  if (!response) return null;
  if (response?.success !== undefined && response?.data !== undefined) {
    return response.data as T;
  }
  return response as T;
}

function unwrapList<T = any>(response: any): T[] {
  if (!response) return [];
  if (Array.isArray(response)) return response as T[];
  if (response?.success !== undefined && Array.isArray(response?.data)) {
    return response.data as T[];
  }
  if (Array.isArray(response?.results)) {
    return response.results as T[];
  }
  if (Array.isArray(response?.data?.results)) {
    return response.data.results as T[];
  }
  return [];
}

export function normalizeUser(user: any) {
  if (!user) return null;

  const currentMood = user.currentMood ?? user.current_mood ?? "";

  const firstName = user.firstName ?? user.first_name ?? "";
  const lastName = user.lastName ?? user.last_name ?? "";
  const fullNameFromApi = user.full_name ?? user.name ?? "";
  const constructedName = `${firstName || ""} ${lastName || ""}`.trim();
  const name = fullNameFromApi || constructedName || user.username || "Utilisateur";

  return {
    ...user,
    id: user.id,
    firstName,
    lastName,
    name,
    username: user.username ?? "",
    email: user.email ?? "",
    avatar:
      user.avatar ??
      user.profileImage ??
      user.profile_image ??
      user.avatarUrl ??
      user.avatar_url ??
      user.profilePicture ??
      user.profile_picture ??
      user.image ??
      user.imageUrl ??
      user.image_url ??
      null,
    coverPhoto: user.coverPhoto ?? user.cover_photo ?? null,
    bio: user.bio ?? "",
    university: user.university ?? "",
    faculty: user.faculty ?? "",
    studyYear: user.studyYear ?? user.study_year ?? "",
    studentId: user.studentId ?? user.student_id ?? "",
    campus: user.campus ?? "",
    town: user.town ?? "",
    language: user.language ?? "",
    profileVisibility: user.profileVisibility ?? user.profile_visibility ?? "public",
    postVisibility: user.postVisibility ?? user.post_visibility ?? "public",
    dataExportRequestedAt: user.dataExportRequestedAt ?? user.data_export_requested_at ?? null,
    impactScore: user.impactScore ?? user.impact_score ?? 0,
    currentMood,
    current_mood: currentMood,
    skills: toArray(user.skills),
    interests: toArray(user.interests),
    previousEducation: toArray(user.previousEducation ?? user.previous_education),
    experiences: toArray(user.experiences),
    portfolioLinks: toArray(user.portfolioLinks ?? user.portfolio_links),
    joinedSpheresCount: user.joinedSpheresCount ?? user.joined_spheres_count ?? 0,
    connectionsCount: user.connectionsCount ?? user.connections_count ?? 0,
    dateJoined: user.dateJoined ?? user.date_joined ?? null,
    updatedAt: user.updatedAt ?? user.updated_at ?? null,
    stats: {
      posts: toNumber(user.posts_count ?? user.stats?.posts, 0),
      connections: toNumber(user.connections_count ?? user.stats?.connections, 0),
      contributions: toNumber(user.contributions_count ?? user.stats?.contributions, 0),
    },
  };
}

function normalizeUsers(users: any[] = []) {
  return users.map((user) => normalizeUser(user)).filter(Boolean);
}

function normalizeSphere(sphere: any) {
  if (!sphere) return null;

  const createdByInfo = normalizeUser(sphere.created_by_info ?? sphere.createdByInfo ?? sphere.creator_info);

  return {
    ...sphere,
    name: sphere.name ?? "",
    description: sphere.description ?? "",
    category: sphere.category ?? "",
    type: sphere.type ?? "",
    color: sphere.color ?? "",
    icon: sphere.icon ?? "",
    objective: sphere.objective ?? "",
    targetAudience: sphere.target_audience ?? sphere.targetAudience ?? "",
    duration: sphere.duration ?? "",
    expiresAt: sphere.expires_at ?? sphere.expiresAt ?? null,
    autoDeleteOnExpiry: sphere.auto_delete_on_expiry ?? sphere.autoDeleteOnExpiry ?? false,
    collaborationTypes: toArray(sphere.collaboration_types ?? sphere.collaborationTypes),
    isPrivate: sphere.is_private ?? sphere.isPrivate ?? false,
    requireApproval: sphere.require_approval ?? sphere.requireApproval ?? false,
    memberCount: toNumber(sphere.member_count ?? sphere.memberCount, 0),
    progression: toNumber(sphere.progression ?? sphere.progressionPercentage, 0),
    createdBy: sphere.created_by ?? sphere.createdBy ?? createdByInfo?.id ?? null,
    createdByInfo,
    isMember: sphere.is_member ?? sphere.isMember ?? false,
    membershipStatus: sphere.membership_status ?? sphere.membershipStatus ?? null,
    userRole: sphere.user_role ?? sphere.userRole ?? null,
    createdAt: sphere.created_at ?? sphere.createdAt ?? null,
    updatedAt: sphere.updated_at ?? sphere.updatedAt ?? null,
  };
}

function normalizeSpheres(spheres: any[] = []) {
  return spheres.map((sphere) => normalizeSphere(sphere)).filter(Boolean);
}


function normalizePostFiles(files: any[] | null | undefined) {
  return toArray(files).map((file) => {
    if (typeof file === "string") {
      return {
        id: null,
        name: file.split("/").pop() || "",
        url: file,
        type: "",
        size: 0,
      };
    }

    return {
      ...file,
      id: file?.id ?? null,
      name: file?.name ?? file?.original_name ?? "",
      url: file?.url ?? file?.file_url ?? file?.file ?? "",
      type: file?.type ?? file?.file_type ?? "",
      size: toNumber(file?.size ?? file?.file_size, 0),
    };
  });
}

function normalizeResource(resource: any) {
  if (!resource) return null;

  const authorInfo = normalizeUser(resource.author_info ?? resource.authorInfo);

  return {
    ...resource,
    title: resource.title ?? "",
    description: resource.description ?? "",
    subject: resource.subject ?? "other",
    type: normalizeResourceType(resource.type),
    category: resource.category ?? "",
    tags: toArray(resource.tags),
    visibility: resource.visibility ?? "public",
    fileUrl: resource.file_url ?? resource.fileUrl ?? "",
    fileSize: resource.file_size ?? resource.fileSize ?? "",
    isSaved: resource.is_saved ?? resource.isSaved ?? false,
    canEdit: resource.can_edit ?? resource.canEdit ?? false,
    canDelete: resource.can_delete ?? resource.canDelete ?? false,
    downloadCount: toNumber(resource.download_count ?? resource.downloadCount, 0),
    viewCount: toNumber(resource.view_count ?? resource.viewCount, 0),
    impactScore: toNumber(resource.impact_score ?? resource.impactScore, 0),
    author: authorInfo,
    authorId: resource.author ?? resource.author_id ?? authorInfo?.id ?? null,
    authorName: authorInfo?.name ?? resource.author_name ?? "",
    createdAt: resource.created_at ?? resource.createdAt ?? null,
    updatedAt: resource.updated_at ?? resource.updatedAt ?? null,
  };
}

function normalizeResources(resources: any[] = []) {
  return resources.map((resource) => normalizeResource(resource)).filter(Boolean);
}

function normalizePost(post: any) {
  if (!post) return null;

  const authorInfo = normalizeUser(post.author_info ?? post.authorInfo ?? post.author);
  const sphereInfo = normalizeSphere(post.sphere_info ?? post.sphereInfo);

  return {
    ...post,
    content: post.content ?? "",
    category: post.category ?? "",
    visibility: post.visibility ?? "public",
    subject: post.subject ?? "",
    type: post.type ?? "",
    audience: post.audience ?? "",
    location: post.location ?? "",
    tags: toArray(post.tags),
    files: normalizePostFiles(post.files),
    allowComments: post.allow_comments ?? post.allowComments ?? true,
    isPinned: post.is_pinned ?? post.isPinned ?? false,
    likesCount: toNumber(post.likes_count ?? post.likesCount, 0),
    commentsCount: toNumber(post.comments_count ?? post.commentsCount, 0),
    impactScore: toNumber(post.impact_score ?? post.impactScore, 0),
    userImpactRating: post.user_impact_rating ?? post.userImpactRating ?? null,
    isLiked: post.is_liked ?? post.isLiked ?? false,
    isSaved: post.is_saved ?? post.isSaved ?? false,
    canEdit: post.can_edit ?? post.canEdit ?? false,
    canDelete: post.can_delete ?? post.canDelete ?? false,
    recentComments: toArray(post.recent_comments ?? post.recentComments),
    author: authorInfo,
    authorId: post.author ?? authorInfo?.id ?? null,
    sphere: sphereInfo,
    sphereId: post.sphere ?? sphereInfo?.id ?? null,
    createdAt: post.created_at ?? post.createdAt ?? null,
    updatedAt: post.updated_at ?? post.updatedAt ?? null,
  };
}

function normalizePosts(posts: any[] = []) {
  return posts.map((post) => normalizePost(post)).filter(Boolean);
}

let refreshPromise: Promise<string | null> | null = null;

async function performRefreshRaw(refresh: string): Promise<string | null> {
  try {
    const url = `${API_BASE_URL.replace(/\/$/, "")}/api/auth/refresh/`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      credentials: "include",
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null as any);
    return json?.access || json?.accessToken || json?.data?.access || null;
  } catch {
    return null;
  }
}

async function apiFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    token?: string;
    headers?: Record<string, string>;
    signal?: AbortSignal;
    _retry?: boolean;
  } = {}
): Promise<T> {
  const { method = "GET", body, token, headers = {}, signal, _retry = false } = options as any;
  const url = path.startsWith("http") ? path : `${API_BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;

  // Resolve effective token (explicit param takes precedence)
  const effectiveToken = token ?? getAccessToken();

  // Build headers: avoid setting Content-Type when sending FormData so the browser
  // can set the correct multipart boundary automatically.
  const builtHeaders: Record<string, string> = {
    ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
    ...headers,
  };

  if (!(body instanceof FormData) && !Object.prototype.hasOwnProperty.call(builtHeaders, "Content-Type")) {
    builtHeaders["Content-Type"] = "application/json";
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: builtHeaders,
      body: body instanceof FormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
      credentials: "include",
      signal,
    });
  } catch (error: any) {
    const isNetworkError =
      error instanceof TypeError &&
      String(error?.message || "").toLowerCase().includes("failed to fetch");

    if (isNetworkError) {
      throw new ApiError("Connexion API impossible (CORS/backend indisponible)", {
        kind: "network",
        details: error,
      });
    }

    throw new ApiError(error?.message || "Erreur réseau inconnue", {
      kind: "unknown",
      details: error,
    });
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();

  if (!res.ok) {
    // Try to parse JSON error payload for a meaningful message, otherwise fall back to text.
    if (contentType.includes("application/json")) {
      try {
        const errJson = await res.json();
        const errMsg = errJson?.detail || errJson?.message || JSON.stringify(errJson);

        // If unauthorized and we haven't retried yet, try to refresh the access token once.
        if (res.status === 401 && !_retry) {
          const refresh = getRefreshToken();
          if (refresh) {
            if (!refreshPromise) {
              refreshPromise = performRefreshRaw(refresh);
            }
            const newAccess = await refreshPromise.catch(() => null);
            refreshPromise = null;
            if (newAccess) {
              setTokens(newAccess, refresh);
              // retry original request once with new token
              return apiFetch<T>(path, { ...options, token: newAccess, _retry: true });
            }
            clearTokens();
          }
        }

        throw new ApiRequestError(errMsg || `Request failed: ${res.status}`, res.status);
      } catch (e) {
        const text = await res.text().catch(() => "");
        throw new ApiRequestError(text || `Request failed: ${res.status}`, res.status);
      }
    }

    const text = await res.text().catch(() => "");
    throw new ApiRequestError(text || `Request failed: ${res.status}`, res.status);
  }

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
  
  // Sauvegarder les tokens (normalisé)
  const dataAny = (response as any)?.data ?? (response as any);
  const access = dataAny?.tokens?.accessToken || dataAny?.tokens?.access || dataAny?.access || null;
  const refresh = dataAny?.tokens?.refreshToken || dataAny?.tokens?.refresh || null;
  setTokens(access, refresh);

  return response;
}

export async function refreshToken(refresh: string) {
  return performRefreshRaw(refresh);
}

// ============================================================================
// USERS
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

export async function updateUserProfile(data: Partial<{
  first_name: string;
  last_name: string;
  username: string;
  bio: string;
  university: string;
  faculty: string;
  study_year: string;
  town: string;
  language: string;
  skills: string[];
  interests: string[];
  current_mood: string;
}>, token?: string) {
  const response = await apiFetch<any>("api/users/profile/", {
    method: "PATCH",
    body: data,
    token: token || getAccessToken(),
  });
  return normalizeUser(unwrapItem(response));
}

export async function changeUserPassword(payload: { current_password: string; new_password: string }, token?: string) {
  return apiFetch<any>("api/users/auth/change-password/", {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
}

export async function changeUserEmail(payload: { current_email: string; new_email: string }, token?: string) {
  const response = await apiFetch<any>("api/users/auth/change-email/", {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
  return normalizeUser(unwrapItem(response));
}

export async function logoutUser(token?: string) {
  const refresh = getRefreshToken();
  try {
    await apiFetch<any>("api/users/auth/logout/", {
      method: "POST",
      body: refresh ? { refresh } : {},
      token: token || getAccessToken(),
    });
  } finally {
    clearTokens();
  }
}

export async function deleteUserAccount(confirmationText: string, token?: string) {
  try {
    await apiFetch<any>("api/users/auth/delete-account/", {
      method: "DELETE",
      body: { confirmation_text: confirmationText },
      token: token || getAccessToken(),
    });
  } finally {
    clearTokens();
  }
}



export async function getPrivacySettings(token?: string) {
  const response = await apiFetch<any>("api/users/privacy/", {
    token: token || getAccessToken(),
  });
  return unwrapItem(response);
}

export async function updatePrivacySettings(payload: Partial<{
  profile_visibility: string;
  post_visibility: string;
}>, token?: string) {
  const response = await apiFetch<any>("api/users/privacy/", {
    method: "PUT",
    body: payload,
    token: token || getAccessToken(),
  });
  return unwrapItem(response);
}

export async function requestUserDataExport(payload: { include_connections: boolean; include_posts: boolean }, token?: string) {
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
export async function searchUsers(query: string, token?: string) {
  const response = await apiFetch<any>(`api/users/search/?q=${encodeURIComponent(query)}`, {
    token: token || getAccessToken(),
  });
  return normalizeUsers(unwrapList(response));
}

export async function getUserByUsername(username: string, token?: string) {
  const response = await apiFetch<any>(`api/users/by-username/${encodeURIComponent(username)}/`, {
    token: token || getAccessToken(),
  });
  return normalizeUser(unwrapItem(response));
}

// Connections
export async function getUserConnections(userId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/users/${userId}/connections/`, { token: token || getAccessToken() });
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
    (currentConnections || []).map((conn: any) => String(conn.requester === data.currentUserId ? conn.recipient : conn.requester))
  );

  const results = await Promise.allSettled(
    (data.connectionUserIds || []).map(async (connectionUserId) => {
      const connectionUserConnections = await getUserConnections(connectionUserId, token);
      const mutualCount = (connectionUserConnections || []).reduce((count: number, conn: any) => {
        const counterpartId = String(conn.requester === connectionUserId ? conn.recipient : conn.requester);
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

export async function deleteConnection(userId: number | string, connectionId: number | string, token?: string) {
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

// ============================================================================
// SPHERES
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

export async function createSphere(data: {
  name: string;
  description?: string;
  category?: string;
  type?: string;
  is_private?: boolean;
  require_approval?: boolean;
  color?: string;
  icon?: string;
  objective?: string;
  target_audience?: string;
  duration?: string;
  collaboration_types?: string[];
}, token?: string) {
  const response = await apiFetch<any>("api/spheres/", {
    method: "POST",
    body: data,
    token: token || getAccessToken(),
  });
  return normalizeSphere(unwrapItem(response));
}

export async function updateSphere(id: number | string, data: Partial<{
  name: string;
  description: string;
  category: string;
  type: string;
  is_private: boolean;
  require_approval: boolean;
  duration: string;
  auto_delete_on_expiry: boolean;
}>, token?: string) {
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

export async function listSphereMembers(id: number | string, token?: string) {
  return apiFetch<any[]>(`api/spheres/${id}/members/`, { token: token || getAccessToken() });
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

export async function removeSphereMember(sphereId: number | string, memberId: number | string, token?: string) {
  return apiFetch<SphereMemberActionResponse>(`api/spheres/${sphereId}/members/${memberId}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function getUserSpheres(token?: string) {
  const response = await apiFetch<any>("api/spheres/user/spheres/", { token: token || getAccessToken() });
  return normalizeSpheres(unwrapList(response));
}

// ============================================================================
// POSTS
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

export async function createPost(data: {
  content: string;
  visibility?: string;
  sphere_id?: number;
  tags?: string[];
  category?: string;
  subject?: string;
  type?: string;
} | FormData, token?: string) {
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

export async function updatePost(id: number | string, data: Partial<{
  content: string;
  visibility: string;
  tags: string[];
}>, token?: string) {
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

export async function reportPost(id: number | string, payload: {reason?: string; details?: string} = {}, token?: string) {
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

export async function getSpherePosts(sphereId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/posts/sphere/${sphereId}/`, { token: token || getAccessToken() });
  return normalizePosts(unwrapList(response));
}

export async function getSavedPosts(token?: string) {
  const response = await apiFetch<any>("api/posts/saved/", { token: token || getAccessToken() });
  return normalizePosts(unwrapList(response));
}

// Comments
export async function getPostComments(postId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/posts/${postId}/comments/`, { token: token || getAccessToken() });
  return unwrapList(response);
}

export async function createComment(postId: number | string, data: { content: string; parent?: number | string }, token?: string) {
  return apiFetch<any>(`api/posts/${postId}/comments/`, {
    method: "POST",
    body: data,
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

// ============================================================================
// RESOURCES
// ============================================================================

export async function listResources(params?: Record<string, string | number>, token?: string) {
  const query = params
    ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]))}`
    : "";
  const response = await apiFetch<any>(`api/resources/${query}`, { token: token || getAccessToken() });
  return normalizeResources(unwrapList(response));
}

export async function getResource(id: number | string, token?: string) {
  const response = await apiFetch<any>(`api/resources/${id}/`, { token: token || getAccessToken() });
  return normalizeResource(unwrapItem(response));
}

export async function createResource(data: FormData, token?: string) {
  const rawType = data.get("type");
  if (typeof rawType === "string" && rawType) {
    data.set("type", normalizeResourceType(rawType));
  }
  const response = await apiFetch<any>("api/resources/", {
    method: "POST",
    body: data,
    token: token || getAccessToken(),
  });
  return normalizeResource(unwrapItem(response));
}

export async function updateResource(id: number | string, data: Partial<{
  title: string;
  description: string;
  category: string;
  tags: string[];
}>, token?: string) {
  const response = await apiFetch<any>(`api/resources/${id}/`, {
    method: "PUT",
    body: data,
    token: token || getAccessToken(),
  });
  return normalizeResource(unwrapItem(response));
}

export async function deleteResource(id: number | string, token?: string) {
  return apiFetch<any>(`api/resources/${id}/`, {
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

export async function downloadResource(id: number | string, token?: string) {
  const url = `${API_BASE_URL.replace(/\/$/, "")}/api/resources/${id}/download/`;
  const effectiveToken = token || getAccessToken();

  const response = await fetch(url, {
    method: "POST",
    headers: effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {},
    credentials: "include",
  });

  if (!response.ok) {
    const contentType = (response.headers.get("content-type") || "").toLowerCase();
    if (contentType.includes("application/json")) {
      const errJson = await response.json().catch(() => null);
      throw new Error(errJson?.detail || errJson?.error || errJson?.message || `Request failed: ${response.status}`);
    }

    const text = await response.text().catch(() => "");
    throw new Error(text || `Request failed: ${response.status}`);
  }

  const blob = await response.blob();
  const disposition = response.headers.get("content-disposition") || "";
  const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
  const filename = filenameMatch?.[1] || `resource-${id}`;

  return { blob, filename };
}

export async function getResourcePreviewUrl(
  id: number | string,
  token?: string
) {
  const response = await apiFetch<any>(`api/resources/${id}/preview/`, {
    token: token || getAccessToken(),
  });
  const payload = unwrapItem<any>(response);

  return (payload?.preview_url ?? payload?.previewUrl ?? null) as string | null;
}

export async function saveResource(id: number | string, token?: string) {
  return apiFetch<any>(`api/resources/${id}/save/`, {
    method: "POST",
    token: token || getAccessToken(),
  });
}

export async function getSavedResources(token?: string) {
  const response = await apiFetch<any>("api/resources/saved/", { token: token || getAccessToken() });
  return normalizeResources(unwrapList(response));
}

export async function getUserResources(userId: number | string, token?: string) {
  const response = await apiFetch<any>(`api/resources/user/${userId}/`, { token: token || getAccessToken() });
  return normalizeResources(unwrapList(response));
}

export async function reportResource(
  id: number | string,
  payload: { reason?: string; details?: string } = {},
  token?: string
) {
  return apiFetch<any>(`api/resources/${id}/report/`, {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
}

export async function trackResourceShare(
  id: number | string,
  payload: { channel?: string } = { channel: "copy_link" },
  token?: string
) {
  return apiFetch<any>(`api/resources/${id}/share/`, {
    method: "POST",
    body: payload,
    token: token || getAccessToken(),
  });
}

// ============================================================================
// TASKS
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

export async function createTask(data: {
  title: string;
  description?: string;
  sphere_id?: number;
  due_date?: string;
  priority?: string;
  status?: string;
  assigned_to?: number;
}, token?: string) {
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
    body: { assigned_to_id: userId },
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
  type?: "private" | "group";
}, token?: string) {
  const participantIds = data.participants ?? [];
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
    body: { recipient_id: userId },
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
    method: "DELETE",
    token: token || getAccessToken(),
  });
}

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
// ADMIN
// ============================================================================

export interface AdminModerationQueueItem {
  id: string;
  title: string;
  type: string;
  subject: string;
  size: string;
  uploadDate: string | null;
  uploader: {
    name: string;
    avatar: string | null;
  };
}

export interface AdminReportedContentItem {
  id: string;
  type: string;
  content: string;
  reason: string;
  date: string | null;
  status: string;
  reporter: {
    name: string;
    avatar: string | null;
  };
}

export interface AdminPermissions {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
  export: boolean;
}

export interface AdminPermissionsPayload {
  role: string | null;
  permissions: AdminPermissions;
}

export interface AdminUserManagementSummary {
  totalUsers: number;
  newUsersToday: number;
  pendingResources: number;
  reportedContent: number;
  activeGroups: number;
  totalResources: number;
}

export type AdminStatsRange = "24h" | "7j" | "30j" | "custom";

export interface AdminKpiStats {
  newUsers: number;
  activeSpheres: number;
  pendingReports: number;
  overdueTasks: number;
  failedNotifications: number;
  range: AdminStatsRange;
  startDate: string | null;
  endDate: string | null;
}

export interface AdminQuickActionResult {
  action: string;
  success: boolean;
  message: string;
}

function mapAdminModerationQueueItem(item: any): AdminModerationQueueItem {
  const uploader = normalizeUser(item?.uploader ?? item?.author ?? item?.uploaded_by ?? item?.uploader_info);
  return {
    id: String(item?.id ?? ""),
    title: item?.title ?? item?.name ?? "Ressource sans titre",
    type: item?.type ?? item?.resource_type ?? "Ressource",
    subject: item?.subject ?? item?.category ?? "Non défini",
    size: item?.size ?? item?.file_size ?? item?.fileSize ?? "—",
    uploadDate: item?.upload_date ?? item?.created_at ?? item?.createdAt ?? null,
    uploader: {
      name: uploader?.name ?? item?.uploader_name ?? "Utilisateur inconnu",
      avatar: uploader?.avatar ?? item?.uploader_avatar ?? null,
    },
  };
}

function mapAdminReportedContentItem(item: any): AdminReportedContentItem {
  const reporter = normalizeUser(item?.reporter ?? item?.reported_by ?? item?.reporter_info);
  return {
    id: String(item?.id ?? ""),
    type: item?.type ?? item?.content_type ?? "Contenu",
    content: item?.content ?? item?.excerpt ?? item?.message ?? "",
    reason: item?.reason ?? item?.report_reason ?? "Non précisé",
    date: item?.date ?? item?.reported_at ?? item?.created_at ?? item?.createdAt ?? null,
    status: item?.status ?? "pending",
    reporter: {
      name: reporter?.name ?? item?.reporter_name ?? "Utilisateur inconnu",
      avatar: reporter?.avatar ?? item?.reporter_avatar ?? null,
    },
  };
}

function mapAdminSummary(summary: any): AdminUserManagementSummary {
  return {
    totalUsers: toNumber(summary?.totalUsers ?? summary?.total_users, 0),
    newUsersToday: toNumber(summary?.newUsersToday ?? summary?.new_users_today, 0),
    pendingResources: toNumber(summary?.pendingResources ?? summary?.pending_resources, 0),
    reportedContent: toNumber(summary?.reportedContent ?? summary?.reported_content, 0),
    activeGroups: toNumber(summary?.activeGroups ?? summary?.active_groups, 0),
    totalResources: toNumber(summary?.totalResources ?? summary?.total_resources, 0),
  };
}

function mapAdminKpiStats(stats: any): AdminKpiStats {
  return {
    newUsers: toNumber(stats?.newUsers ?? stats?.new_users, 0),
    activeSpheres: toNumber(stats?.activeSpheres ?? stats?.active_spheres, 0),
    pendingReports: toNumber(stats?.pendingReports ?? stats?.pending_reports, 0),
    overdueTasks: toNumber(stats?.overdueTasks ?? stats?.overdue_tasks, 0),
    failedNotifications: toNumber(stats?.failedNotifications ?? stats?.failed_notifications, 0),
    range: (stats?.range as AdminStatsRange) ?? "24h",
    startDate: stats?.startDate ?? stats?.start_date ?? null,
    endDate: stats?.endDate ?? stats?.end_date ?? null,
  };
}

export async function getAdminModerationQueue(token?: string): Promise<AdminModerationQueueItem[]> {
  const response = await apiFetch<any>("api/admin/moderation-queue/", { token: token || getAccessToken() });
  return unwrapList(response).map(mapAdminModerationQueueItem);
}

export async function getAdminReportedContent(token?: string): Promise<AdminReportedContentItem[]> {
  const response = await apiFetch<any>("api/admin/reported-content/", { token: token || getAccessToken() });
  return unwrapList(response).map(mapAdminReportedContentItem);
}

export async function getAdminUserManagementSummary(token?: string): Promise<AdminUserManagementSummary> {
  const response = await apiFetch<any>("api/admin/user-management-summary/", { token: token || getAccessToken() });
  return mapAdminSummary(unwrapItem(response));
}


export async function getAdminPermissions(token?: string): Promise<AdminPermissionsPayload> {
  const response = await apiFetch<any>("api/admin/permissions/", { token: token || getAccessToken() });
  const payload = unwrapItem<any>(response) || {};

  return {
    role: payload?.role ?? null,
    permissions: {
      view: Boolean(payload?.permissions?.view),
      create: Boolean(payload?.permissions?.create),
      update: Boolean(payload?.permissions?.update),
      delete: Boolean(payload?.permissions?.delete),
      export: Boolean(payload?.permissions?.export),
    },
  };
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

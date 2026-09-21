/* eslint-disable @typescript-eslint/no-explicit-any */
import { normalizeResourceType } from "@/constants/resourceTypes";

export {
  parseBackendError,
  translateError,
  translateField,
  formatUserErrorMessage,
  isRateLimitOrQuotaError,
} from "@/lib/errorUtils";

// ============================================================================
// SUPABASE RATE LIMIT HELPERS
// ============================================================================

export type SupabaseRateLimitMetadata = {
  waitSeconds: number | null;
  originalMessage: string;
};

export class SupabaseRateLimitError extends Error {
  readonly waitSeconds: number | null;
  readonly status?: number;

  constructor(message: string, waitSeconds: number | null, status?: number) {
    super(message);
    this.name = "SupabaseRateLimitError";
    this.waitSeconds = waitSeconds;
    this.status = status;
  }
}

function extractWaitSecondsFromMessage(message: string): number | null {
  const sanitized = message.toLowerCase();
  const patterns = [
    /(\d+)\s*(?:s|sec|secs|second|seconds|seconde|secondes)/i,
    /(?:after|dans)\s*(\d+)\s*(?:s|sec|secs|second|seconds|seconde|secondes)?/i,
    /(?:in|wait)\s*(\d+)\s*(?:s|sec|secs|second|seconds|seconde|secondes)?/i,
  ];
  for (const pattern of patterns) {
    const match = sanitized.match(pattern);
    if (match?.[1]) {
      const waitSeconds = Number(match[1]);
      if (Number.isFinite(waitSeconds) && waitSeconds > 0) return waitSeconds;
    }
  }
  return null;
}

export function getSupabaseRateLimitMetadata(error: unknown): SupabaseRateLimitMetadata | null {
  const status = (error as any)?.status ?? (error as any)?.code;
  const message = String((error as any)?.message ?? "");
  const hasTooManyRequestsStatus = Number(status) === 429;
  const mentionsRateLimit = /too many requests|rate limit|security purposes/i.test(message);

  if (!hasTooManyRequestsStatus && !mentionsRateLimit) return null;

  return {
    waitSeconds: extractWaitSecondsFromMessage(message),
    originalMessage: message || "Too many requests",
  };
}

export function withSupabaseRateLimitError(error: unknown): never {
  const metadata = getSupabaseRateLimitMetadata(error);
  if (metadata) {
    throw new SupabaseRateLimitError(metadata.originalMessage, metadata.waitSeconds, Number((error as any)?.status) || undefined);
  }
  throw new Error((error as any)?.message || "Unexpected Supabase error");
}

// ============================================================================
// URL RESOLUTION & TOKENS
// ============================================================================

const getDetectedApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const { hostname } = window.location;
  if (hostname === "www.campussphere.app" || hostname === "campussphere.app") {
    return "https://api.campussphere.app";
  }
  if (hostname.includes("onrender.com") && !hostname.includes("-backend")) {
    return `https://campus-sphere-backend-dyfu.onrender.com`;
  }
  return "http://127.0.0.1:8000";
};

export const API_BASE_URL = getDetectedApiUrl();

export function getFullUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const cleanPath = path.replace(/^\//, "");
  return `${baseUrl}/${cleanPath}`;
}

export function getAccessToken(): string | undefined {
  try {
    const token = localStorage.getItem("access");
    return token || undefined;
  } catch {
    return undefined;
  }
}

export function getRefreshToken(): string | undefined {
  try {
    const token = localStorage.getItem("refresh");
    return token || undefined;
  } catch {
    return undefined;
  }
}

export function setTokens(access?: string | null, refresh?: string | null) {
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

export function clearTokens() {
  try {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  } catch {
    // ignore
  }
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

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

// ============================================================================
// NORMALIZERS & UNWRAPPERS
// ============================================================================

export function toArray<T>(value: T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function toNumber(value: unknown, fallback = 0): number {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

export function unwrapItem<T = any>(response: any): T | null {
  if (!response) return null;
  if (response?.success !== undefined && response?.data !== undefined) {
    return response.data as T;
  }
  return response as T;
}

export function unwrapList<T = any>(response: any): T[] {
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
    language: Array.isArray(user.language) ? user.language : (user.language ? [user.language] : []),
    languages: Array.isArray(user.language) ? user.language : (user.language ? [user.language] : []),
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
    phoneNumber: user.phoneNumber ?? user.phone_number ?? "",
    dateOfBirth: user.dateOfBirth ?? user.date_of_birth ?? "",
    isVerified: Boolean(user.is_verified ?? user.isVerified ?? false),
    stats: {
      posts: toNumber(user.posts_count ?? user.stats?.posts, 0),
      connections: toNumber(user.connections_count ?? user.stats?.connections, 0),
      contributions: toNumber(user.contributions_count ?? user.stats?.contributions, 0),
    },
  };
}

export function normalizeUsers(users: any[] = []) {
  return users.map((user) => normalizeUser(user)).filter(Boolean);
}

export function normalizeSphere(sphere: any) {
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

export function normalizeSpheres(spheres: any[] = []) {
  return spheres.map((sphere) => normalizeSphere(sphere)).filter(Boolean);
}

export function normalizePostFiles(files: any[] | null | undefined) {
  return toArray(files).map((file) => {
    if (typeof file === "string") {
      return {
        id: null,
        name: file.split("/").pop() || "",
        url: getFullUrl(file),
        type: "",
        size: 0,
      };
    }

    return {
      ...file,
      id: file?.id ?? null,
      name: file?.name ?? file?.original_name ?? "",
      url: getFullUrl(file?.url ?? file?.file_url ?? file?.file ?? ""),
      type: file?.type ?? file?.file_type ?? "",
      size: toNumber(file?.size ?? file?.file_size, 0),
    };
  });
}

export function normalizeResource(resource: any) {
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

export function normalizeResources(resources: any[] = []) {
  return resources.map((resource) => normalizeResource(resource)).filter(Boolean);
}

export function normalizePost(post: any) {
  if (!post) return null;

  const authorInfo = normalizeUser(post.author_info ?? post.authorInfo ?? post.author);
  const sphereInfo = normalizeSphere(post.sphere_info ?? post.sphereInfo);

  return {
    ...post,
    content: post.content ?? "",
    image: getFullUrl(post.image ?? post.post_image ?? post.banner),
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

export function normalizePosts(posts: any[] = []) {
  return posts.map((post) => normalizePost(post)).filter(Boolean);
}

// ============================================================================
// CORE API FETCH WITH AUTO REFRESH
// ============================================================================

let refreshPromise: Promise<string | null> | null = null;

export async function performRefreshRaw(refresh: string): Promise<string | null> {
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

export async function apiFetch<T>(
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

  const effectiveToken = token ?? getAccessToken();

  const builtHeaders: Record<string, string> = {
    ...(effectiveToken ? { Authorization: `Bearer ${effectiveToken}` } : {}),
    ...headers,
  };

  if (!(body instanceof FormData) && !Object.prototype.hasOwnProperty.call(builtHeaders, "Content-Type")) {
    builtHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers: builtHeaders,
    body: body instanceof FormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    credentials: "include",
    signal,
  });

  const contentType = (res.headers.get("content-type") || "").toLowerCase();

  if (!res.ok) {
    let errMsg = `Request failed: ${res.status}`;

    if (contentType.includes("application/json")) {
      try {
        const errJson = await res.json();
        const { parseBackendError } = await import("@/lib/errorUtils");
        errMsg = parseBackendError(errJson, res.status) || errMsg;

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
              return apiFetch<T>(path, { ...options, token: newAccess, _retry: true });
            }
          }
          clearTokens();
        }
      } catch {
        // parsing json failed, fallback will be used
      }
    } else {
      try {
        const text = await res.text();
        if (text) errMsg = text;
      } catch {
        // ignore
      }
    }

    throw new ApiRequestError(errMsg, res.status);
  }

  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }

  return (await res.text()) as unknown as T;
}

export const http = { apiFetch };

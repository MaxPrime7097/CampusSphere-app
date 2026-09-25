/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * CampusSphere & Sphera Unified HTTP Client
 * Supporte : tokens JWT, mutex refresh automatique, upload FormData, traduction erreurs
 */

export function getApiBase(): string {
  if (typeof window !== "undefined") {
    const metaEnv = (import.meta as any).env;
    if (metaEnv?.VITE_API_URL) return metaEnv.VITE_API_URL;
    const { hostname } = window.location;
    if (hostname === "www.campussphere.app" || hostname === "campussphere.app" || hostname.includes("campussphere.app")) {
      return "https://api.campussphere.app";
    }
    if (hostname.includes("sphera.campussphere.app")) {
      return "https://sphera.campussphere.app";
    }
    if (hostname.includes("onrender.com") && !hostname.includes("-backend")) {
      return "https://campus-sphere-backend-dyfu.onrender.com";
    }
  }
  return "http://127.0.0.1:8000";
}

export const API_BASE = getApiBase();

export function getToken(): string | null {
  try {
    return localStorage.getItem("sphera_access") || localStorage.getItem("access") || null;
  } catch {
    return null;
  }
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem("sphera_refresh") || localStorage.getItem("refresh") || null;
  } catch {
    return null;
  }
}

export function setTokens(access: string, refresh: string) {
  try {
    localStorage.setItem("sphera_access", access);
    localStorage.setItem("sphera_refresh", refresh);
    localStorage.setItem("access", access);
    localStorage.setItem("refresh", refresh);
  } catch {}
}

export function clearTokens() {
  try {
    localStorage.removeItem("sphera_access");
    localStorage.removeItem("sphera_refresh");
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
  } catch {}
}

let refreshPromise: Promise<string | null> | null = null;

async function performRefreshRaw(refresh: string): Promise<string | null> {
  try {
    const url = `${getApiBase().replace(/\/$/, "")}/api/auth/refresh/`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh }),
      credentials: "include",
    });
    if (!res.ok) return null;
    const json = await res.json().catch(() => null as any);
    const newAccess = json?.access || json?.accessToken || json?.data?.access || null;
    if (newAccess) {
      setTokens(newAccess, refresh);
    }
    return newAccess;
  } catch {
    return null;
  }
}

export function translateApiError(errJson: any, status: number): string {
  if (!errJson && status === 429) {
    return "Limite de requêtes atteinte. Veuillez patienter un instant.";
  }
  const raw = errJson?.message || errJson?.error || errJson?.detail || "";
  const lower = String(raw).toLowerCase();

  if (
    status === 429 ||
    lower === "rate_limit" ||
    lower === "rate_limited" ||
    lower.includes("too many requests") ||
    lower.includes("throttled")
  ) {
    if (lower.includes("weekly_limit_reached") || lower.includes("tu as utilisé tes")) {
      return "Limite hebdomadaire atteinte : vous avez utilisé vos 5 générations Sphera gratuites pour cette semaine.";
    }
    if (lower.includes("insufficient_quota") || lower.includes("quota insuffisant")) {
      return "Quota insuffisant : le nombre d'outils sélectionnés dépasse vos générations restantes pour cette semaine.";
    }
    return "Trop de requêtes envoyées en peu de temps ou quota hebdomadaire atteint. Veuillez patienter avant de réessayer.";
  }

  if (status === 413 || lower.includes("too large")) {
    return "Le fichier sélectionné est trop volumineux (20 Mo maximum).";
  }
  if (status === 415 || lower.includes("unsupported")) {
    return "Format de document non supporté. Formats acceptés : PDF, DOCX et TXT.";
  }
  if (status === 503 || lower.includes("ai_providers_failed")) {
    return "Le service d'intelligence artificielle Sphera est temporairement saturé ou indisponible. Veuillez réessayer dans quelques instants.";
  }
  if (status === 401) {
    return "Session expirée. Veuillez vous reconnecter.";
  }
  if (status === 403) {
    return "Vous n'avez pas l'autorisation d'effectuer cette action.";
  }
  if (status === 404) {
    return "L'élément demandé est introuvable.";
  }
  return raw || `Erreur serveur (${status}). Veuillez réessayer.`;
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined | null>;
  skipAuth?: boolean;
}

export async function apiFetch<T = any>(endpoint: string, options: ApiFetchOptions = {}): Promise<T> {
  const base = getApiBase().replace(/\/$/, "");
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  let url = `${base}${cleanEndpoint}`;

  if (options.params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = new Headers(options.headers || {});

  if (!isFormData && !headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (!options.skipAuth && !headers.has("Authorization")) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const body = isFormData
    ? options.body
    : options.body && typeof options.body !== "string"
    ? JSON.stringify(options.body)
    : options.body;

  let response = await fetch(url, {
    ...options,
    headers,
    body,
    credentials: "include",
  });

  // Handle 401 automatic token refresh
  if (response.status === 401 && !options.skipAuth) {
    const refresh = getRefreshToken();
    if (refresh) {
      if (!refreshPromise) {
        refreshPromise = performRefreshRaw(refresh).finally(() => {
          refreshPromise = null;
        });
      }
      const newAccess = await refreshPromise;
      if (newAccess) {
        headers.set("Authorization", `Bearer ${newAccess}`);
        response = await fetch(url, {
          ...options,
          headers,
          body,
          credentials: "include",
        });
      }
    }
  }

  if (!response.ok) {
    const errorJson = await response.json().catch((): any => null);
    const errorMessage = translateApiError(errorJson, response.status);
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.data = errorJson;
    throw error;
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json().catch((_err: unknown): T => ({} as T));
}

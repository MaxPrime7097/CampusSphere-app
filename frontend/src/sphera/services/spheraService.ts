/**
 * Sphera Service — Toutes les fonctions API pour le module Sphera.
 * V1 : StudySessions (Fiche, Quiz, Flashcards)
 * V2 : Q&A sur le cours + Annales
 *
 * URL de base : /api/sphera/
 * (rétrocompatibilité maintenue sur /api/study/ côté backend)
 */

import type {
  StudySession,
  StudySessionListItem,
  QAMessage,
  AnnaleSession,
  AnnaleSessionListItem,
  AnnaleMode,
  ToolType,
} from "../types/sphera.types";

// ---------------------------------------------------------------------------
// Import de la fonction fetch centralisée depuis api.ts
// On réutilise apiFetch via les exports existants
// ---------------------------------------------------------------------------

const getApiBaseUrl = (): string => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const { hostname } = window.location;
  if (hostname === "www.campussphere.app" || hostname === "campussphere.app") {
    return "https://api.campussphere.app";
  }
  if (hostname.includes("onrender.com") && !hostname.includes("-backend")) {
    return "https://campus-sphere-backend-dyfu.onrender.com";
  }
  return "http://127.0.0.1:8000";
};

const API_BASE = getApiBaseUrl();

function getToken(): string | undefined {
  try {
    return localStorage.getItem("access") || undefined;
  } catch {
    return undefined;
  }
}

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Record<string, unknown> | FormData;
};

async function apiFetch<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const { method = "GET", body } = options;
  const url = `${API_BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const token = getToken();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const errJson = await res.json().catch(() => ({}));
      const msg = errJson?.error || errJson?.detail || errJson?.message || `Erreur ${res.status}`;
      throw new Error(msg);
    }
    const text = await res.text().catch(() => "");
    throw new Error(text || `Erreur ${res.status}`);
  }

  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json() as Promise<T>;
  return res.text() as unknown as Promise<T>;
}

// ===========================================================================
// V1 — StudySessions : Génération
// ===========================================================================

/**
 * Génère une session depuis une ressource existante.
 */
export async function generateStudyTools(params: {
  resource_id: string | number;
  tool_types: ToolType[];
}): Promise<{ success: boolean; data: StudySession; cached: boolean }> {
  return apiFetch("api/sphera/generate/from-resource/", {
    method: "POST",
    body: {
      resource_id: params.resource_id,
      tool_types: JSON.stringify(params.tool_types),
    } as any,
  });
}

/**
 * Génère une session depuis un fichier uploadé directement.
 */
export async function generateStudyToolsFromUpload(params: {
  file: File;
  tool_types: ToolType[];
}): Promise<{ success: boolean; data: StudySession }> {
  const formData = new FormData();
  formData.append("file", params.file);
  formData.append("tool_types", JSON.stringify(params.tool_types));
  return apiFetch("api/sphera/generate/from-upload/", { method: "POST", body: formData });
}

// ===========================================================================
// V1 — StudySessions : CRUD
// ===========================================================================

export async function getStudySessions(toolType?: ToolType): Promise<{ success: boolean; data: StudySessionListItem[] }> {
  const query = toolType ? `?tool_type=${toolType}` : "";
  return apiFetch(`api/sphera/sessions/${query}`);
}

export async function getStudySession(id: string | number): Promise<{ success: boolean; data: StudySession }> {
  return apiFetch(`api/sphera/sessions/${id}/`);
}

export async function deleteStudySession(id: string | number): Promise<void> {
  return apiFetch(`api/sphera/sessions/${id}/`, { method: "DELETE" });
}

export async function shareStudySession(
  sessionId: string | number,
  sphereId: string | number
): Promise<{ success: boolean; data: StudySession }> {
  return apiFetch(`api/sphera/sessions/${sessionId}/share/`, {
    method: "POST",
    body: { sphere_id: sphereId } as any,
  });
}

export async function unshareStudySession(
  sessionId: string | number
): Promise<{ success: boolean }> {
  return apiFetch(`api/sphera/sessions/${sessionId}/share/`, { method: "DELETE" });
}

export async function getSphereStudySessions(
  sphereId: string | number
): Promise<{ success: boolean; data: StudySessionListItem[] }> {
  return apiFetch(`api/sphera/sphere/${sphereId}/`);
}

// ===========================================================================
// V2 — Q&A sur le cours
// ===========================================================================

/**
 * Pose une question sur le contenu d'une session.
 * La réponse est exclusivement basée sur le cours extrait.
 */
export async function askStudyQuestion(
  sessionId: string | number,
  question: string
): Promise<{ success: boolean; data: QAMessage }> {
  return apiFetch(`api/sphera/sessions/${sessionId}/ask/`, {
    method: "POST",
    body: { question } as any,
  });
}

// ===========================================================================
// V2 — Annales : Génération
// ===========================================================================

/**
 * Génère une correction d'annale depuis un fichier ou une ressource.
 */
export async function generateAnnale(params: {
  file?: File;
  resource_id?: string | number;
  mode: AnnaleMode;
  cours_resource_id?: string | number;
}): Promise<{ success: boolean; data: AnnaleSession }> {
  const formData = new FormData();
  formData.append("mode", params.mode);
  if (params.file) formData.append("file", params.file);
  if (params.resource_id) formData.append("resource_id", String(params.resource_id));
  if (params.cours_resource_id) formData.append("cours_resource_id", String(params.cours_resource_id));
  return apiFetch("api/sphera/generate/annale/", { method: "POST", body: formData });
}

// ===========================================================================
// V2 — Annales : CRUD
// ===========================================================================

export async function getAnnaleSessions(): Promise<{ success: boolean; data: AnnaleSessionListItem[] }> {
  return apiFetch("api/sphera/annales/");
}

export async function getAnnaleSession(id: string | number): Promise<{ success: boolean; data: AnnaleSession }> {
  return apiFetch(`api/sphera/annales/${id}/`);
}

export async function deleteAnnaleSession(id: string | number): Promise<void> {
  return apiFetch(`api/sphera/annales/${id}/`, { method: "DELETE" });
}

export async function shareAnnaleSession(
  id: string | number,
  sphereId: string | number
): Promise<{ success: boolean; data: AnnaleSession }> {
  return apiFetch(`api/sphera/annales/${id}/share/`, {
    method: "POST",
    body: { sphere_id: sphereId } as any,
  });
}

export async function unshareAnnaleSession(id: string | number): Promise<{ success: boolean }> {
  return apiFetch(`api/sphera/annales/${id}/share/`, { method: "DELETE" });
}

export async function getSphereAnnaleSessions(
  sphereId: string | number
): Promise<{ success: boolean; data: AnnaleSessionListItem[] }> {
  return apiFetch(`api/sphera/sphere/${sphereId}/annales/`);
}

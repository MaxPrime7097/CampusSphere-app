/**
 * Sphera API Service
 * Toutes les requêtes vers api.campussphere.app
 * Supporte mode invité (sans token) et mode connecté (avec JWT)
 */

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
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
  return "http://127.0.0.1:8000";
};
export const API_BASE = getApiBase();

// ─── Auth helpers ───────────────────────────────────────────────
export function getToken(): string | null {
  try { return localStorage.getItem('sphera_access') } catch { return null }
}
export function getRefreshToken(): string | null {
  try { return localStorage.getItem('sphera_refresh') } catch { return null }
}
export function setTokens(access: string, refresh: string) {
  localStorage.setItem('sphera_access', access)
  localStorage.setItem('sphera_refresh', refresh)
}
export function clearTokens() {
  localStorage.removeItem('sphera_access')
  localStorage.removeItem('sphera_refresh')
}

let refreshPromise: Promise<string | null> | null = null;

async function performRefreshRaw(refresh: string): Promise<string | null> {
  try {
    const url = `${API_BASE.replace(/\/$/, "")}/api/auth/refresh/`;
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

// ─── Core fetch ─────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown | FormData; requireAuth?: boolean; _retry?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, requireAuth = false, _retry = false } = options
  const url = `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  const token = getToken()

  if (requireAuth && !token) {
    throw new Error('AUTH_REQUIRED')
  }

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json'

  const res = await fetch(url, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })

  // Rate limit
  if (res.status === 429) {
    throw new Error('RATE_LIMIT')
  }

  if (!res.ok) {
    // Si expiration du token (401) et que nous n'avons pas déjà réessayé, tente de rafraîchir
    if (res.status === 401 && !_retry) {
      const refresh = getRefreshToken()
      if (refresh) {
        if (!refreshPromise) {
          refreshPromise = performRefreshRaw(refresh)
        }
        const newAccess = await refreshPromise.catch(() => null)
        refreshPromise = null
        if (newAccess) {
          setTokens(newAccess, refresh)
          // Re-tente la requête avec le nouveau token
          return apiFetch<T>(path, { ...options, _retry: true })
        }
      }
      clearTokens()
    }

    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error || err?.detail || err?.message || `Erreur ${res.status}`)
    }
    const text = await res.text().catch(() => '')
    throw new Error(text || `Erreur ${res.status}`)
  }

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json() as Promise<T>
  return res.text() as unknown as Promise<T>
}

// ─── Auth API ────────────────────────────────────────────────────

export async function loginWithCS(email: string, password: string) {
  const res = await apiFetch<{
    success: boolean
    data: { user: any; tokens: { accessToken: string; refreshToken: string } }
  }>('api/users/auth/login/', { method: 'POST', body: { email, password } })

  const tokens = res?.data?.tokens
  if (tokens?.accessToken) {
    setTokens(tokens.accessToken, tokens.refreshToken)
  }
  return res?.data?.user
}

export async function registerOnSphera(params: {
  first_name: string
  last_name: string
  email: string
  password: string
  confirm_password: string
  username: string
}) {
  const res = await apiFetch<{
    success: boolean
    data: { user: any; tokens: { accessToken: string; refreshToken: string } }
  }>('api/users/auth/register/', { method: 'POST', body: params })

  const tokens = res?.data?.tokens
  if (tokens?.accessToken) {
    setTokens(tokens.accessToken, tokens.refreshToken)
  }
  return res?.data?.user
}

export async function getCurrentUser() {
  return apiFetch<{ success: boolean; data: any }>('api/users/auth/me/', { requireAuth: true })
    .then(r => r?.data ?? r)
}

export async function logoutFromSphera() {
  const refresh = getRefreshToken()
  try {
    await apiFetch('api/users/auth/logout/', {
      method: 'POST',
      body: refresh ? { refresh } : {},
      requireAuth: true,
    })
  } finally {
    clearTokens()
  }
}

// ─── Guest Generate (sans auth, rate limité) ─────────────────────

export type GuestToolType = 'fiche' | 'quiz' | 'flashcards' | 'annale'

export async function guestGenerate(params: {
  file: File
  tool_type: GuestToolType
  mode?: 'complete' | 'rapide'
}) {
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append('tool_type', params.tool_type)
  if (params.mode) formData.append('mode', params.mode)

  return apiFetch<{
    success: boolean
    tool_type: GuestToolType
    mode?: string
    content: any
  }>('api/sphera/guest/generate/', { method: 'POST', body: formData })
}

// ─── Authenticated Generate ──────────────────────────────────────

export type ToolType = 'fiche' | 'quiz' | 'flashcards'

export async function generateFromUpload(params: { file: File; tool_types: ToolType[] }) {
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append('tool_types', JSON.stringify(params.tool_types))
  return apiFetch<{ success: boolean; data: any; cached: boolean }>('api/sphera/generate/from-upload/', {
    method: 'POST',
    body: formData,
    requireAuth: true,
  })
}

export async function addToolToSession(sessionId: number | string, toolType: ToolType) {
  return apiFetch<{ success: boolean; data: any }>(`api/sphera/sessions/${sessionId}/add-tool/`, {
    method: 'PATCH',
    body: { tool_type: toolType },
    requireAuth: true,
  })
}

export async function getSuggestions(sessionId: number | string): Promise<string[]> {
  try {
    const res = await apiFetch<{ success: boolean; data: { suggestions: string[] } }>(
      `api/sphera/sessions/${sessionId}/suggestions/`,
      { requireAuth: true }
    )
    return res?.data?.suggestions ?? []
  } catch {
    return []
  }
}

export async function generateAnnale(params: { file: File; mode: 'complete' | 'rapide' }) {
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append('mode', params.mode)
  return apiFetch<{ success: boolean; data: any }>(
    'api/sphera/generate/annale/',
    { method: 'POST', body: formData, requireAuth: true }
  )
}

// ─── Sessions (auth requis) ──────────────────────────────────────

export async function getSessions() {
  return apiFetch<{ success: boolean; data: any[] }>('api/sphera/sessions/', { requireAuth: true })
}

export async function getSession(id: number | string) {
  return apiFetch<{ success: boolean; data: any }>(`api/sphera/sessions/${id}/`, { requireAuth: true })
}

export async function deleteSession(id: number | string) {
  return apiFetch(`api/sphera/sessions/${id}/`, { method: 'DELETE', requireAuth: true })
}

export async function shareSession(id: number | string) {
  return apiFetch<{ success: boolean; data: any }>(`api/sphera/sessions/${id}/share/`, { method: 'POST', body: {}, requireAuth: true })
}

export async function updateSessionText(id: number | string, text: string) {
  return apiFetch<{ success: boolean; data: { extracted_text: string } }>(`api/sphera/sessions/${id}/text/`, {
    method: 'PATCH',
    body: { text },
    requireAuth: true,
  });
}

export async function askQuestion(id: number | string, question: string, type: 'session' | 'annale' = 'session') {
  const endpoint = type === 'annale' ? `api/sphera/annales/${id}/ask/` : `api/sphera/sessions/${id}/ask/`;
  return apiFetch<{ success: boolean; data: any }>(
    endpoint,
    { method: 'POST', body: { question }, requireAuth: true }
  )
}

// ─── Annales (auth requis) ───────────────────────────────────────

export async function getAnnales() {
  return apiFetch<{ success: boolean; data: any[] }>('api/sphera/annales/', { requireAuth: true })
}

export async function getAnnale(id: number | string) {
  return apiFetch<{ success: boolean; data: any }>(`api/sphera/annales/${id}/`, { requireAuth: true })
}

export async function deleteAnnale(id: number | string) {
  return apiFetch(`api/sphera/annales/${id}/`, { method: 'DELETE', requireAuth: true })
}

export async function shareAnnale(id: number | string) {
  return apiFetch<{ success: boolean; data: any }>(`api/sphera/annales/${id}/share/`, { method: 'POST', body: {}, requireAuth: true })
}

// ── Quiz Live (Sphera Live) ─────────────────────────────────

export async function createQuizManual(title: string, questions: { question: string; options: string[]; correctIndex: number; timeLimit?: number }[]) {
  return apiFetch<{ success: boolean; data: any }>('api/quiz-live/create-manual/', {
    method: 'POST',
    body: { title, questions },
    requireAuth: true,
  });
}

export async function generateQuizQuestionsFromResource(
  resourceId: number | string,
  title?: string,
  timeLimit = 30,
  points = 1000
) {
  return apiFetch<{ success: boolean; data: { title: string; questions: any[] } }>('api/quiz-live/generate-questions/', {
    method: 'POST',
    body: { resource_id: resourceId, resourceId, title, timeLimit, points },
    requireAuth: true,
  });
}

export async function generateQuizQuestionsFromUpload(
  file: File,
  title?: string,
  timeLimit = 30,
  points = 1000
) {
  const formData = new FormData();
  if (title) formData.append('title', title);
  formData.append('timeLimit', String(timeLimit));
  formData.append('points', String(points));
  formData.append('file', file);

  return apiFetch<{ success: boolean; data: { title: string; questions: any[] } }>('api/quiz-live/generate-questions/', {
    method: 'POST',
    body: formData,
    requireAuth: true,
  });
}

export async function createQuizFromResource(
  resourceId: number | string,
  title: string,
  timeLimit = 30,
  points = 1000
) {
  return apiFetch<{ success: boolean; data: any }>('api/quiz-live/generate-and-create/', {
    method: 'POST',
    body: { resource_id: resourceId, resourceId, title, timeLimit, points },
    requireAuth: true,
  });
}

export async function createQuizFromUpload(
  file: File,
  title: string,
  timeLimit = 30,
  points = 1000
) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('timeLimit', String(timeLimit));
  formData.append('points', String(points));
  formData.append('file', file);
  return apiFetch<{ success: boolean; data: any }>('api/quiz-live/generate-from-upload/', {
    method: 'POST',
    body: formData,
    requireAuth: true,
  });
}

export async function importQuizJson(title: string, file: File) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', file);
  return apiFetch<{ success: boolean; data: any }>('api/quiz-live/import-json/', {
    method: 'POST',
    body: formData,
    requireAuth: true,
  });
}

export async function getQuizSessionByCode(roomCode: string) {
  return apiFetch<{ success: boolean; data: any }>(`api/quiz-live/${roomCode}/`, {
    method: 'GET',
    requireAuth: false,
  });
}

export async function getMyQuizSessions() {
  return apiFetch<{ success: boolean; data: any[] }>('api/quiz-live/my-sessions/', {
    method: 'GET',
    requireAuth: true,
  });
}

export function getQuizSocketUrl(roomCode: string): string {
  const baseUrl = getApiBase();
  const wsBase = baseUrl.replace(/^http/, 'ws');
  const token = getToken();
  let url = `${wsBase}/ws/quiz-live/${roomCode}/`;
  if (token) {
    url += `?token=${token}`;
  }
  return url;
}

export async function deleteQuizSession(roomCode: string) {
  return apiFetch<{ success: boolean }>(`api/quiz-live/${roomCode}/`, {
    method: 'DELETE',
    requireAuth: true,
  });
}

export async function resetQuizSession(roomCode: string) {
  return apiFetch<{ success: boolean }>(`api/quiz-live/${roomCode}/reset/`, {
    method: 'PATCH',
    requireAuth: true,
  });
}

export async function getQuizSessionHostDetails(roomCode: string) {
  return apiFetch<{
    success: boolean;
    data: {
      id: number;
      roomCode: string;
      title: string;
      status: string;
      questions: any[];
      participantCount: number;
    };
  }>(`api/quiz-live/${roomCode}/host/`, {
    method: 'GET',
    requireAuth: true,
  });
}

export async function updateQuizQuestions(roomCode: string, questions: any[], title?: string) {
  return apiFetch<{
    success: boolean;
    data: {
      id: number;
      roomCode: string;
      title: string;
      questions: any[];
      status: string;
    };
  }>(`api/quiz-live/${roomCode}/questions/`, {
    method: 'PATCH',
    body: { questions, title },
    requireAuth: true,
  });
}

// ─── Quota ──────────────────────────────────────────────────────
export interface GenerationQuota {
  used: number;
  remaining: number;
  limit: number;
  resetsOn: string;
}

export async function getQuota(): Promise<{ success: boolean; data: GenerationQuota }> {
  return apiFetch<{ success: boolean; data: GenerationQuota }>('api/sphera/quota/', {
    method: 'GET',
    requireAuth: true,
  });
}


/**
 * Sphera API Service
 * Toutes les requêtes vers api.campussphere.app
 * Supporte mode invité (sans token) et mode connecté (avec JWT)
 */

export const API_BASE = import.meta.env.VITE_API_URL || 'https://api.campussphere.app'

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

// ─── Core fetch ─────────────────────────────────────────────────
async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown | FormData; requireAuth?: boolean } = {}
): Promise<T> {
  const { method = 'GET', body, requireAuth = false } = options
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

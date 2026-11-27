/**
 * Sphera API Service
 * Toutes les requêtes vers api.campussphere.app
 * Supporte mode invité (sans token) et mode connecté (avec JWT)
 */
export * from "@cs/types";

const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const { hostname } = window.location;
  if (
    hostname === "www.campussphere.app" ||
    hostname === "campussphere.app" ||
    hostname.includes("campussphere.app") ||
    hostname.includes("vercel.app")
  ) {
    return "https://api.campussphere.app";
  }
  if (hostname.includes("onrender.com") && !hostname.includes("-backend")) {
    return "https://campus-sphere-backend-dyfu.onrender.com";
  }
  return "http://127.0.0.1:3000";
};
export const API_BASE = getApiBase();

export function resolveMediaUrl(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) return url;
  return `${API_BASE.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
}

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
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) return null;
      return "TEMPORARY_ERROR";
    }
    const json = await res.json().catch(() => null as any);
    return json?.access || json?.accessToken || json?.data?.access || null;
  } catch {
    return "TEMPORARY_ERROR";
  }
}

// ─── Core fetch ─────────────────────────────────────────────────
function translateSpheraApiError(errJson: any, status: number): string {
  if (!errJson && status === 429) {
    return "Limite de requêtes atteinte. Vous avez effectué trop d'actions en peu de temps ou atteint votre quota de 10 générations hebdomadaires. Veuillez patienter un instant.";
  }

  const FIELD_NAMES: Record<string, string> = {
    email: "Adresse email",
    password: "Mot de passe",
    confirm_password: "Confirmation du mot de passe",
    username: "Nom d'utilisateur",
    first_name: "Prénom",
    last_name: "Nom",
    file: "Document",
    roomCode: "Code du salon",
    title: "Titre",
  }

  // 1. Extraire les erreurs de champs (Zod/backend field_errors ou DRF errors)
  const fieldIssues: string[] = []
  const fieldSources = [errJson?.field_errors, errJson?.errors].filter(Boolean)

  for (const src of fieldSources) {
    if (typeof src === 'object' && !Array.isArray(src)) {
      for (const [field, msgs] of Object.entries(src)) {
        const fieldLabel = FIELD_NAMES[field] || field
        const msgList = Array.isArray(msgs) ? msgs : [msgs]
        const cleanMsgs = msgList
          .map((m: any) => {
            const str = typeof m === 'string' ? m : m?.message || m?.msg || JSON.stringify(m)
            // Traduction des messages Zod courants
            if (str.includes('Invalid email')) return 'Format d\'adresse email invalide'
            if (str.includes('at least 8 character')) return 'Doit contenir au moins 8 caractères'
            if (str.includes('Required')) return 'Champ obligatoire'
            return str
          })
          .join(', ')

        if (field === 'non_field_errors' || field === '_all_') {
          fieldIssues.push(cleanMsgs)
        } else {
          fieldIssues.push(`${fieldLabel} : ${cleanMsgs}`)
        }
      }
    } else if (Array.isArray(src)) {
      src.forEach((item: any) => {
        fieldIssues.push(typeof item === 'string' ? item : item?.message || item?.msg || JSON.stringify(item))
      })
    }
  }

  let raw = errJson?.message || errJson?.error || errJson?.detail || ""
  if (fieldIssues.length > 0) {
    return fieldIssues.join(' • ')
  }

  const lower = String(raw).toLowerCase();

  // 2. Erreurs d'authentification et comptes

  // SSO-only account: user registered via Google/Supabase, has no password
  if (errJson?.error === "sso_account" || lower.includes("sso_account") || lower.includes("uses campussphere sso")) {
    return "Ce compte a été créé via Google ou CampusSphere SSO. Utilise le bouton « Se connecter avec CampusSphere » ci-dessus — pas besoin de mot de passe !";
  }

  if (
    lower.includes("invalid credentials") ||
    lower.includes("invalid_credentials") ||
    lower.includes("mot de passe incorrect") ||
    lower.includes("incorrect password")
  ) {
    return "Adresse email ou mot de passe incorrect. Veuillez vérifier vos identifiants de connexion.";
  }

  if (lower.includes("account is disabled") || lower.includes("account_disabled")) {
    return "Votre compte étudiant est temporairement désactivé. Veuillez contacter le support de CampusSphere.";
  }

  if (lower.includes("account no longer exists") || lower.includes("user not found")) {
    return "Aucun compte étudiant n'est associé à cette adresse email. Veuillez vérifier l'adresse ou vous inscrire.";
  }

  if (lower.includes("already exists") || lower.includes("unique constraint") || lower.includes("conflict")) {
    if (lower.includes("email")) {
      return "Cette adresse email est déjà associée à un compte CampusSphere existant. Connectez-vous avec vos identifiants habituels.";
    }
    if (lower.includes("username")) {
      return "Ce nom d'utilisateur est déjà pris par un autre étudiant. Veuillez en choisir un autre.";
    }
    return "Un compte ou un enregistrement avec ces informations existe déjà.";
  }

  if (lower.includes("passwords do not match") || lower.includes("passwords_dont_match")) {
    return "Les deux mots de passe saisis ne correspondent pas. Veuillez vérifier votre saisie.";
  }

  // 3. Quota et Rate limiting
  if (
    status === 429 ||
    lower === "rate_limit" ||
    lower === "rate_limited" ||
    lower.includes("too many requests") ||
    lower.includes("throttled")
  ) {
    if (lower.includes("weekly_limit_reached") || lower.includes("tu as utilisé tes")) {
      return "Quota hebdomadaire atteint : vous avez utilisé vos 10 générations gratuites de la semaine. Votre solde se renouvelle automatiquement chaque lundi matin.";
    }
    if (lower.includes("insufficient_quota") || lower.includes("quota insuffisant")) {
      return "Générations insuffisantes : l'outil demandé dépasse votre solde disponible pour cette semaine.";
    }
    const match = String(raw).match(/available in (\d+)\s*seconds/i);
    if (match?.[1]) {
      return `Trop d'actions envoyées rapidement. Veuillez patienter environ ${match[1]} seconde(s) avant de continuer.`;
    }
    return "Trop de requêtes envoyées en peu de temps ou quota hebdomadaire atteint. Veuillez patienter un instant avant de réessayer.";
  }

  if (lower.includes("weekly_limit_reached")) {
    return "Limite hebdomadaire atteinte : vous avez utilisé vos 10 générations Sphera gratuites pour cette semaine (solde renouvelé chaque lundi).";
  }
  if (lower.includes("insufficient_quota")) {
    return "Quota insuffisant : cette action nécessite plus de générations que votre solde restant.";
  }

  // 4. Fichiers et Uploads
  if (status === 413 || lower.includes("too large") || lower.includes("file_too_large")) {
    return "Le document sélectionné est trop volumineux. La taille maximale autorisée est de 20 Mo.";
  }
  if (status === 415 || lower.includes("unsupported") || lower.includes("invalid file type")) {
    return "Format de document non supporté. Sphera accepte les fichiers PDF, Word (.docx) et texte brut (.txt).";
  }

  // 5. Providers IA
  if (status === 503 || lower.includes("ai_providers_failed") || lower.includes("allprovidersfailed") || lower.includes("all ai providers failed")) {
    return "Les serveurs d'intelligence artificielle pédagogique sont temporairement surchargés. Veuillez relancer la génération dans quelques instants.";
  }

  // 6. Statuts HTTP génériques
  if (status === 401) {
    return "Votre session a expiré ou vos identifiants sont invalides. Veuillez vous reconnecter.";
  }
  if (status === 403) {
    if (lower.includes("account_required")) {
      return "Cette action nécessite un compte étudiant. Connectez-vous ou créez un compte gratuit pour continuer.";
    }
    return raw || "Accès restreint : vous n'avez pas les autorisations nécessaires pour effectuer cette action.";
  }
  if (status === 404) {
    return raw || "Le document, la session d'étude ou la ressource demandée est introuvable ou a été supprimée.";
  }
  if (status === 400) {
    return raw || "La requête envoyée est incomplète ou invalide. Veuillez vérifier les informations saisies.";
  }
  if (status >= 500) {
    return "Une erreur technique interne est survenue sur les serveurs de Sphera. Nos équipes ont été alertées, veuillez réessayer dans un instant.";
  }

  return raw || `Erreur de communication (Code HTTP ${status})`;
}

async function apiFetch<T>(
  path: string,
  options: { method?: string; body?: unknown | FormData; requireAuth?: boolean; _retry?: boolean; signal?: AbortSignal } = {}
): Promise<T> {
  const { method = 'GET', body, requireAuth = false, _retry = false, signal } = options
  const url = `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  const token = getToken()

  if (requireAuth && !token) {
    throw new Error('Connexion requise pour effectuer cette opération.')
  }

  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`
  if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json'

  let res: Response
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
      credentials: 'include',
      signal,
    })
  } catch (netErr: any) {
    if (netErr?.name === 'AbortError' || signal?.aborted) {
      throw netErr
    }
    throw new Error("Impossible de contacter les serveurs Sphera. Vérifiez votre connexion Internet ou réessayez dans un instant.")
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
        if (newAccess && newAccess !== "TEMPORARY_ERROR") {
          setTokens(newAccess, refresh)
          // Re-tente la requête avec le nouveau token
          return apiFetch<T>(path, { ...options, _retry: true })
        }
        if (newAccess === "TEMPORARY_ERROR") {
          throw new Error("Problème temporaire de connexion. Veuillez réessayer dans un instant.")
        }
      }
      clearTokens()
    }

    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const err = await res.json().catch(() => ({}))
      throw new Error(translateSpheraApiError(err, res.status))
    }
    const text = await res.text().catch(() => '')
    throw new Error(translateSpheraApiError({ message: text }, res.status))
  }

  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json')) return res.json() as Promise<T>
  return res.text() as unknown as Promise<T>
}

export interface WebSource {
  title: string
  url: string
  domain: string
  snippet?: string
  favicon?: string
}

export async function streamApiFetch({
  path,
  body,
  onToken,
  onStatus,
  onSources,
  signal,
}: {
  path: string
  body: Record<string, unknown>
  onToken: (token: string) => void
  onStatus?: (status: string, query?: string) => void
  onSources?: (sources: WebSource[]) => void
  signal?: AbortSignal
}): Promise<{ fullText: string; metadata?: any; sources?: WebSource[] }> {
  const url = `${API_BASE.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  const token = getToken()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'text/event-stream',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...body, stream: true }),
      signal,
    })
  } catch (netErr: any) {
    if (netErr?.name === 'AbortError' || signal?.aborted) {
      const abortErr = new Error('Génération interrompue')
      abortErr.name = 'AbortError'
      throw abortErr
    }
    throw new Error('Impossible de joindre le serveur Sphera. Vérifiez votre connexion internet.')
  }

  if (!res.ok) {
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const err = await res.json().catch(() => ({}))
      throw new Error(translateSpheraApiError(err, res.status))
    }
    const text = await res.text().catch(() => '')
    throw new Error(translateSpheraApiError({ message: text }, res.status))
  }

  if (!res.body) {
    throw new Error('Flux de réponse non disponible.')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  let fullText = ''
  let metadata: any = null
  let collectedSources: WebSource[] | undefined

  try {
    while (true) {
      if (signal?.aborted) break
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue
        const dataStr = trimmed.slice(5).trim()
        if (dataStr === '[DONE]') break
        try {
          const parsed = JSON.parse(dataStr)
          if (parsed.error) {
            throw new Error(parsed.error)
          }
          if (typeof parsed.status === 'string') {
            onStatus?.(parsed.status, typeof parsed.query === 'string' ? parsed.query : undefined)
          }
          if (Array.isArray(parsed.sources)) {
            collectedSources = parsed.sources as WebSource[]
            onSources?.(collectedSources)
          }
          if (parsed.token) {
            fullText += parsed.token
            onToken(parsed.token)
          }
          if (parsed.done) {
            metadata = parsed.message || parsed.entry || parsed
          }
        } catch (jsonErr: any) {
          if (jsonErr.message && !jsonErr.message.includes('JSON')) {
            throw jsonErr
          }
        }
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError' || signal?.aborted) {
      return { fullText, metadata, sources: collectedSources }
    }
    throw err
  } finally {
    reader.releaseLock()
  }

  return { fullText, metadata, sources: collectedSources }
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

export type ToolType = 'fiche' | 'quiz' | 'flashcards' | 'mindmap' | 'audio'

export function notifyQuotaUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sphera:quota-updated'))
  }
}

export async function generateFromUpload(params: { file: File; tool_types?: ToolType[] }) {
  const formData = new FormData()
  formData.append('file', params.file)
  formData.append('tool_types', JSON.stringify(params.tool_types || []))
  const res = await apiFetch<{ success: boolean; data: any; cached: boolean }>('api/sphera/generate/from-upload/', {
    method: 'POST',
    body: formData,
    requireAuth: true,
  })
  notifyQuotaUpdated()
  return res
}

export async function generateMindmap(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiFetch<{ success: boolean; data: any }>('api/sphera/generate/mindmap/', {
    method: 'POST',
    body: formData,
    requireAuth: true,
  })
  notifyQuotaUpdated()
  return res
}

export async function generateAudioSummary(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  const res = await apiFetch<{ success: boolean; data: any }>('api/sphera/generate/audio/', {
    method: 'POST',
    body: formData,
    requireAuth: true,
  })
  notifyQuotaUpdated()
  return res
}

export async function addToolToSession(sessionId: number | string, toolType: ToolType) {
  const res = await apiFetch<{ success: boolean; data: any }>(`api/sphera/sessions/${sessionId}/add-tool/`, {
    method: 'PATCH',
    body: { tool_type: toolType },
    requireAuth: true,
  })
  notifyQuotaUpdated()
  return res
}

export async function createFromSelection(
  sessionId: number | string,
  toolType: 'quiz' | 'flashcards',
  selectedText: string,
) {
  return apiFetch<{
    success: boolean
    data: {
      created_item: any
      created_items?: any[]
      count?: number
      tool_type: 'quiz' | 'flashcards'
      session: any
    }
  }>(`api/sphera/sessions/${sessionId}/create-from-selection/`, {
    method: 'POST',
    body: { tool_type: toolType, selected_text: selectedText },
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

export async function generateAnnale(params: { file?: File; resource_id?: number; mode?: 'complete' | 'rapide'; init_only?: boolean }) {
  const formData = new FormData()
  if (params.file) formData.append('file', params.file)
  if (params.resource_id) formData.append('resource_id', String(params.resource_id))
  if (params.mode) formData.append('mode', params.mode)
  if (params.init_only) formData.append('init_only', 'true')
  const res = await apiFetch<{ success: boolean; data: any }>(
    'api/sphera/generate/annale/',
    { method: 'POST', body: formData, requireAuth: true }
  )
  notifyQuotaUpdated()
  return res
}

export async function correctAnnale(id: number | string, mode: 'complete' | 'rapide' = 'complete') {
  const res = await apiFetch<{ success: boolean; data: any }>(
    `api/sphera/annales/${id}/correct/`,
    { method: 'POST', body: { mode }, requireAuth: true }
  )
  notifyQuotaUpdated()
  return res
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

export async function askQuestion(id: number | string, question: string, type: 'session' | 'annale' = 'session', signal?: AbortSignal) {
  const endpoint = type === 'annale' ? `api/sphera/annales/${id}/ask/` : `api/sphera/sessions/${id}/ask/`;
  return apiFetch<{ success: boolean; data: any }>(
    endpoint,
    { method: 'POST', body: { question }, requireAuth: true, signal }
  )
}

export async function streamAskQuestion(
  id: number | string,
  question: string,
  type: 'session' | 'annale' = 'session',
  onToken: (token: string) => void,
  signal?: AbortSignal,
  options?: { ephemeral?: boolean },
) {
  const endpoint = type === 'annale' ? `api/sphera/annales/${id}/ask/` : `api/sphera/sessions/${id}/ask/`;
  return streamApiFetch({
    path: endpoint,
    body: { question, ...(options?.ephemeral ? { ephemeral: true } : {}) },
    onToken,
    signal,
  });
}

// ─── Sphera Artefacts & Multi-threads Q&A ────────────────────────

export interface ArtefactItem {
  id: number;
  sessionId: number;
  ownerId: number;
  type: 'quiz' | 'flashcards' | 'mindmap' | 'audio' | 'note' | 'annale_rapide' | 'annale_complete';
  title: string;
  subtitle?: string | null;
  content: any;
  targetChapter?: string | null;
  fromSelection: boolean;
  selectionText?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatThreadItem {
  id: number;
  sessionId: number;
  ownerId: number;
  title: string;
  messages: { id: number; role: 'user' | 'assistant'; content: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

export async function getArtefacts(sessionId: number | string) {
  return apiFetch<{ success: boolean; data: ArtefactItem[] }>(`api/sphera/sessions/${sessionId}/artefacts/`, { requireAuth: true });
}

export async function createArtefact(
  sessionId: number | string,
  params: {
    type: 'quiz' | 'flashcards' | 'mindmap' | 'audio' | 'note' | 'annale_rapide' | 'annale_complete';
    title?: string;
    subtitle?: string;
    target_chapter?: string;
    selection_text?: string;
    content?: any;
  }
) {
  const res = await apiFetch<{ success: boolean; data: ArtefactItem }>(`api/sphera/sessions/${sessionId}/artefacts/`, {
    method: 'POST',
    body: params,
    requireAuth: true,
  });
  notifyQuotaUpdated();
  return res;
}

export async function updateArtefact(
  artefactId: number | string,
  params: { title?: string; subtitle?: string; content?: any }
) {
  return apiFetch<{ success: boolean; data: ArtefactItem }>(`api/sphera/artefacts/${artefactId}/`, {
    method: 'PATCH',
    body: params,
    requireAuth: true,
  });
}

export async function deleteArtefact(artefactId: number | string) {
  return apiFetch(`api/sphera/artefacts/${artefactId}/`, { method: 'DELETE', requireAuth: true });
}

export async function regenerateFiche(sessionId: number | string) {
  const res = await apiFetch<{ success: boolean; data: { fiche: any; session: any } }>(`api/sphera/sessions/${sessionId}/fiche/regenerate/`, {
    method: 'POST',
    requireAuth: true,
  });
  notifyQuotaUpdated();
  return res;
}

export async function getChatThreads(sessionId: number | string) {
  return apiFetch<{ success: boolean; data: ChatThreadItem[] }>(`api/sphera/sessions/${sessionId}/threads/`, { requireAuth: true });
}

export async function createChatThread(sessionId: number | string, title?: string) {
  return apiFetch<{ success: boolean; data: ChatThreadItem }>(`api/sphera/sessions/${sessionId}/threads/`, {
    method: 'POST',
    body: { title },
    requireAuth: true,
  });
}

export async function sendThreadMessage(threadId: number | string, question: string, signal?: AbortSignal) {
  return apiFetch<{ success: boolean; data: { id: number; role: 'assistant'; content: string; createdAt: string } }>(`api/sphera/threads/${threadId}/messages/`, {
    method: 'POST',
    body: { question },
    requireAuth: true,
    signal,
  });
}

export type ChatMode = 'tutor' | 'socratic' | 'exam' | 'express';

export interface ChatAttachment {
  type: 'image' | 'pdf';
  name: string;
  mimeType: string;
  size: number;
  url: string;
  storageKey: string;
  hasText?: boolean;
}

export async function getChatCapabilities() {
  return apiFetch<{ success: boolean; data: { webSearch: boolean; vision: boolean } }>(
    'api/sphera/chat/capabilities/',
    { requireAuth: true },
  );
}

export async function uploadChatAttachment(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return apiFetch<{ success: boolean; data: ChatAttachment }>('api/sphera/chat/attachments/', {
    method: 'POST',
    body: formData,
    requireAuth: true,
  });
}

export async function streamThreadMessage(
  threadId: number | string,
  question: string,
  onToken: (token: string) => void,
  signal?: AbortSignal,
  options?: {
    replaceFromTurnIndex?: number;
    mode?: ChatMode;
    contextSessionId?: number | null;
    contextSubjectId?: number | null;
    webSearch?: boolean;
    attachments?: ChatAttachment[];
    onStatus?: (status: string, query?: string) => void;
    onSources?: (sources: WebSource[]) => void;
  },
) {
  return streamApiFetch({
    path: `api/sphera/threads/${threadId}/messages/`,
    body: {
      question,
      ...(options?.replaceFromTurnIndex !== undefined
        ? { replaceFromTurnIndex: options.replaceFromTurnIndex }
        : {}),
      ...(options?.mode ? { mode: options.mode } : {}),
      ...(options?.contextSessionId ? { contextSessionId: options.contextSessionId } : {}),
      ...(options?.contextSubjectId ? { contextSubjectId: options.contextSubjectId } : {}),
      ...(options?.webSearch ? { webSearch: true } : {}),
      ...(options?.attachments && options.attachments.length > 0
        ? { attachments: options.attachments }
        : {}),
    },
    onToken,
    onStatus: options?.onStatus,
    onSources: options?.onSources,
    signal,
  });
}

export async function deleteChatThread(threadId: number | string) {
  return apiFetch(`api/sphera/threads/${threadId}/`, { method: 'DELETE', requireAuth: true });
}

export async function renameChatThread(threadId: number | string, title: string) {
  return apiFetch<{ success: boolean; data: ChatThreadItem }>(`api/sphera/threads/${threadId}/`, {
    method: 'PATCH',
    body: { title },
    requireAuth: true,
  });
}

export async function getStandaloneChatThreads() {
  return apiFetch<{ success: boolean; data: ChatThreadItem[] }>('api/sphera/chat/threads/', { requireAuth: true });
}

export async function getStandaloneChatThread(threadId: number | string) {
  return apiFetch<{ success: boolean; data: ChatThreadItem }>(`api/sphera/chat/threads/${threadId}/`, { requireAuth: true });
}

export async function createStandaloneChatThread(params?: { question?: string; title?: string }, signal?: AbortSignal) {
  return apiFetch<{ success: boolean; data: ChatThreadItem }>('api/sphera/chat/threads/', {
    method: 'POST',
    body: params || {},
    requireAuth: true,
    signal,
  });
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
      participants?: Array<{
        id: number;
        displayName: string;
        score: number;
        userId?: number;
      }>;
      participantCount: number;
    };
  }>(`api/quiz-live/${roomCode}/host/`, {
    method: 'GET',
    requireAuth: true,
  });
}

export async function getQuizParticipants(roomCode: string) {
  return apiFetch<{
    success: boolean;
    data: {
      participants: Array<{
        id: number;
        displayName: string;
        score: number;
        userId?: number;
      }>;
      participantCount: number;
    };
  }>(`api/quiz-live/${roomCode}/participants/`, {
    method: 'GET',
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

// ─── Sphera Preferences & Settings ──────────────────────────────
export interface SpheraPreferencesData {
  id: number;
  user_id: number;
  default_language: 'auto' | 'fr' | 'en';
  detail_level: 'court' | 'standard' | 'detaille';
  tone: 'decontracte' | 'formel';
  quiz_question_count: number | null;
  quiz_time_limit: number;
  flashcard_count: number | null;
  theme: 'system' | 'sombre' | 'clair';
  created_at: string;
  updated_at: string;
}

export interface SpheraProfileData {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string | null;
  university: string;
  faculty: string;
  study_year: string;
  edit_url: string;
}

export interface SpheraStatsData {
  total_sessions: number;
  current_streak: number;
  longest_streak: number;
  favorite_tool: string;
  tool_counts: Record<string, number>;
  activity_grid: Record<string, number>;
}

export async function getSpheraPreferences(): Promise<{ success: boolean; data: SpheraPreferencesData }> {
  return apiFetch<{ success: boolean; data: SpheraPreferencesData }>('api/sphera/preferences/', {
    method: 'GET',
    requireAuth: true,
  });
}

export async function updateSpheraPreferences(
  updates: Partial<SpheraPreferencesData>
): Promise<{ success: boolean; data: SpheraPreferencesData }> {
  return apiFetch<{ success: boolean; data: SpheraPreferencesData }>('api/sphera/preferences/', {
    method: 'PATCH',
    body: updates,
    requireAuth: true,
  });
}

export async function getSpheraProfile(): Promise<{ success: boolean; data: SpheraProfileData }> {
  return apiFetch<{ success: boolean; data: SpheraProfileData }>('api/sphera/profile/', {
    method: 'GET',
    requireAuth: true,
  });
}

export async function getSpheraStats(): Promise<{ success: boolean; data: SpheraStatsData }> {
  return apiFetch<{ success: boolean; data: SpheraStatsData }>('api/sphera/stats/', {
    method: 'GET',
    requireAuth: true,
  });
}

// ─── Direct Server-Side PDF Export (Puppeteer) ──────────────────
export async function exportPdfFromBackend(
  type: 'fiche' | 'annale',
  data: unknown,
  sourceName?: string,
): Promise<{ blob: Blob; filename: string }> {
  const url = `${API_BASE.replace(/\/$/, '')}/api/sphera/export-pdf/`;
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ type, data, sourceName }),
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`PDF export failed (HTTP ${res.status})`);
  }

  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || `Sphera_${type === 'fiche' ? 'Fiche' : 'Annale'}.pdf`;

  return { blob, filename };
}

// ─── Proactive Revision Planner ─────────────────────────────────

export function getLocalIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface StudySubjectItem {
  id: number;
  name: string;
  examDate: string | null;
  daysUntilExam: number | null;
  weight: number;
  color: string;
  masteryScore?: number | null;
  createdAt: string;
  sessionsCount: number;
  sessions: Array<{ id: number; title: string; toolTypes: string[] }>;
  progress: { done: number; total: number; pct: number };
}

export interface RevisionTaskItem {
  id: number;
  planId: number;
  subjectId: number;
  sessionId: number | null;
  sessionTitle: string | null;
  scheduledDate: string;
  phase: 'decouverte' | 'ancrage' | 'validation';
  actionType: 'fiche' | 'flashcards' | 'quiz' | 'annale' | 'relecture';
  chapterTitle: string | null;
  label: string;
  estimatedMinutes: number;
  isDone: boolean;
  completedAt: string | null;
  position: number;
  isReady: boolean;
  subject: {
    id: number;
    name: string;
    color: string;
    examDate: string | null;
    weight: number;
  } | null;
}

export interface RevisionDayGroup {
  date: string;
  isToday: boolean;
  isPast: boolean;
  tasks: RevisionTaskItem[];
  doneCount: number;
  totalCount: number;
}

export interface RevisionPlanData {
  id: number;
  startDate: string;
  endDate: string;
  dailyLoad: number;
  restDays: number[];
  status: string;
  generatedAt: string;
  totalTasks: number;
  completedTasks: number;
  overdueCount: number;
  completionPct: number;
  days: RevisionDayGroup[];
}

export interface PlannerTodayData {
  hasPlan: boolean;
  planId?: number;
  subjectsCount: number;
  date: string;
  tasks: RevisionTaskItem[];
  overdueCount: number;
  nextStudyDate?: string | null;
  upcomingExams: Array<{
    id: number;
    name: string;
    color: string;
    examDate: string;
    daysUntilExam: number;
  }>;
  planProgress: { completed: number; total: number; pct: number } | null;
}

export async function getPlannerSubjects(): Promise<{ success: boolean; data: StudySubjectItem[] }> {
  const date = getLocalIsoDate();
  return apiFetch(`api/sphera/planner/subjects/?date=${encodeURIComponent(date)}`, {
    method: 'GET',
    requireAuth: true,
  });
}

export async function createPlannerSubject(payload: {
  name: string;
  examDate?: string | null;
  weight?: number;
  color?: string;
  sessionIds?: number[];
}): Promise<{ success: boolean; data: any }> {
  return apiFetch('api/sphera/planner/subjects/', {
    method: 'POST',
    body: payload,
    requireAuth: true,
  });
}

export async function updatePlannerSubject(
  id: number,
  payload: {
    name?: string;
    examDate?: string | null;
    weight?: number;
    color?: string;
    sessionIds?: number[];
  },
): Promise<{ success: boolean; data: any }> {
  return apiFetch(`api/sphera/planner/subjects/${id}/`, {
    method: 'PATCH',
    body: payload,
    requireAuth: true,
  });
}

export async function deletePlannerSubject(id: number): Promise<{ success: boolean }> {
  return apiFetch(`api/sphera/planner/subjects/${id}/`, {
    method: 'DELETE',
    requireAuth: true,
  });
}

export async function linkSessionToSubject(
  sessionId: number | string,
  subjectId: number | null,
  sessionType: 'session' | 'annale' = 'session',
): Promise<{ success: boolean; data: { sessionId: number; subjectId: number | null } }> {
  return apiFetch(`api/sphera/planner/sessions/${sessionId}/subject/`, {
    method: 'PATCH',
    body: { subjectId, sessionType },
    requireAuth: true,
  });
}

export async function getPlannerToday(): Promise<{ success: boolean; data: PlannerTodayData }> {
  const date = getLocalIsoDate();
  return apiFetch(`api/sphera/planner/today/?date=${encodeURIComponent(date)}`, {
    method: 'GET',
    requireAuth: true,
  });
}

export async function getPlannerPlan(): Promise<{ success: boolean; data: RevisionPlanData | null }> {
  const date = getLocalIsoDate();
  return apiFetch(`api/sphera/planner/plan/?date=${encodeURIComponent(date)}`, {
    method: 'GET',
    requireAuth: true,
  });
}

export async function generatePlannerPlan(options?: {
  dailyLoad?: number;
  restDays?: number[];
  startDate?: string;
  endDate?: string;
}): Promise<{ success: boolean; data: RevisionPlanData }> {
  return apiFetch('api/sphera/planner/plan/generate/', {
    method: 'POST',
    body: {
      startDate: getLocalIsoDate(),
      ...options,
    },
    requireAuth: true,
  });
}

export async function rebalancePlannerPlan(options?: {
  dailyLoad?: number;
  restDays?: number[];
}): Promise<{ success: boolean; data: RevisionPlanData }> {
  return apiFetch('api/sphera/planner/plan/rebalance/', {
    method: 'POST',
    body: {
      date: getLocalIsoDate(),
      ...options,
    },
    requireAuth: true,
  });
}

export async function togglePlannerTask(
  taskId: number,
  isDone: boolean,
): Promise<{ success: boolean; data: RevisionTaskItem }> {
  return apiFetch(`api/sphera/planner/tasks/${taskId}/`, {
    method: 'PATCH',
    body: { isDone },
    requireAuth: true,
  });
}

// ─── Cross-Device Study Progress Persistence ────────────────────

export interface StudyProgressData {
  sessionId: number;
  masteredChapters: Record<string, boolean>;
  masteredMindmapNodes: Record<string, boolean>;
  lastQuizScore: number | null;
  quizAttempts: number;
  flashcardsMastered: number;
  flashcardsTotal: number;
  updatedAt?: string;
}

export async function getSessionStudyProgress(
  sessionId: string | number,
): Promise<{ success: boolean; data: StudyProgressData }> {
  return apiFetch(`api/sphera/planner/progress/${sessionId}/`, {
    method: 'GET',
    requireAuth: true,
  });
}

export async function saveSessionStudyProgress(
  sessionId: string | number,
  patch: {
    masteredChapters?: Record<string, boolean>;
    masteredMindmapNodes?: Record<string, boolean>;
    lastQuizScore?: number | null;
    incrementQuizAttempt?: boolean;
    flashcardsMastered?: number;
    flashcardsTotal?: number;
  },
): Promise<{ success: boolean; data: StudyProgressData }> {
  return apiFetch(`api/sphera/planner/progress/${sessionId}/`, {
    method: 'PATCH',
    body: patch,
    requireAuth: true,
  });
}



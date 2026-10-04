import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getSessions, getAnnales, getMyQuizSessions, getQuota, getSession, getAnnale, type GenerationQuota } from '../services/spheraApi'
import { getCached, setCached, getOngoingGenerations } from '../utils/sessionCache'
import { queryClient } from '../lib/queryClient'

const CACHE_QUOTA_KEY = 'sphera_cached_quota'

// ─── Query Keys ───────────────────────────────────────────────────────────

export const spheraKeys = {
  all: ['sphera'] as const,
  sessions: () => ['sphera', 'sessions'] as const,
  annales: () => ['sphera', 'annales'] as const,
  quizSessions: () => ['sphera', 'quiz_sessions'] as const,
  quota: () => ['sphera', 'quota'] as const,
  detail: (id: string | number, type: 'session' | 'annale' = 'session') => ['sphera', 'detail', String(id), type] as const,
}

// ─── Queries ──────────────────────────────────────────────────────────────

export function useSessionsQuery(enabled = true) {
  return useQuery({
    queryKey: spheraKeys.sessions(),
    queryFn: async () => {
      const res = await getSessions()
      const d = (res as any)?.data
      const list = Array.isArray(d) ? d : Array.isArray(res) ? (res as any) : []
      setCached('sessions_list', list)
      return list
    },
    initialData: () => getCached<any[]>('sessions_list') || undefined,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useAnnalesQuery(enabled = true) {
  return useQuery({
    queryKey: spheraKeys.annales(),
    queryFn: async () => {
      const res = await getAnnales()
      const d = (res as any)?.data
      const list = Array.isArray(d) ? d : Array.isArray(res) ? (res as any) : []
      setCached('annales_list', list)
      return list
    },
    initialData: () => getCached<any[]>('annales_list') || undefined,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useQuizSessionsQuery(enabled = true) {
  return useQuery({
    queryKey: spheraKeys.quizSessions(),
    queryFn: async () => {
      const res = await getMyQuizSessions()
      const d = (res as any)?.data
      const list = Array.isArray(d) ? d : Array.isArray(res) ? (res as any) : []
      setCached('quiz_sessions_list', list)
      return list
    },
    initialData: () => getCached<any[]>('quiz_sessions_list') || undefined,
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}

export function useQuotaQuery(enabled = true) {
  return useQuery({
    queryKey: spheraKeys.quota(),
    queryFn: async () => {
      const res = await getQuota()
      const data = res?.data || { used: 0, remaining: 10, limit: 10, resetsOn: '' }
      try {
        localStorage.setItem(CACHE_QUOTA_KEY, JSON.stringify(data))
      } catch {}
      return data as GenerationQuota
    },
    initialData: () => {
      try {
        const raw = localStorage.getItem(CACHE_QUOTA_KEY)
        if (raw) return JSON.parse(raw) as GenerationQuota
      } catch {}
      return undefined
    },
    enabled,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

export function useSessionDetailQuery(id: string | number | undefined, type: 'session' | 'annale' = 'session') {
  const ongoing = id ? getOngoingGenerations(id) : []
  const hasOngoing = ongoing.length > 0

  return useQuery({
    queryKey: spheraKeys.detail(id || '', type),
    queryFn: async () => {
      if (!id) throw new Error('ID manquant')
      const primaryFn = type === 'annale' ? getAnnale : getSession
      try {
        const res = await primaryFn(id)
        const payload = (res as any)?.data ?? res
        setCached(`session_detail_${id}`, payload)
        return payload
      } catch (err) {
        // Fallback to other endpoint if route doesn't match backend classification
        const fallbackFn = type === 'annale' ? getSession : getAnnale
        const res = await fallbackFn(id)
        const payload = (res as any)?.data ?? res
        setCached(`session_detail_${id}`, payload)
        return payload
      }
    },
    initialData: () => {
      if (!id) return undefined
      return getCached(`session_detail_${id}`) || undefined
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
    // Poll every 3 seconds if an ongoing AI generation is in progress in the background!
    refetchInterval: hasOngoing ? 3000 : false,
  })
}

// ─── Cache Invalidation Helpers ──────────────────────────────────────────

export function invalidateSpheraSessions() {
  queryClient.invalidateQueries({ queryKey: spheraKeys.sessions() })
  queryClient.invalidateQueries({ queryKey: spheraKeys.annales() })
  queryClient.invalidateQueries({ queryKey: spheraKeys.quizSessions() })
}

export function invalidateSpheraQuota() {
  queryClient.invalidateQueries({ queryKey: spheraKeys.quota() })
}

export function invalidateSessionDetail(id: string | number, type: 'session' | 'annale' = 'session') {
  queryClient.invalidateQueries({ queryKey: spheraKeys.detail(id, type) })
}

export function updateSessionDetailCache(
  id: string | number,
  type: 'session' | 'annale' = 'session',
  updater: (prevSession: any) => any
) {
  const queryKey = spheraKeys.detail(id, type)
  queryClient.setQueryData(queryKey, (old: any) => {
    const base = old || getCached(`session_detail_${id}`)
    if (!base) return old
    const updated = updater(base)
    setCached(`session_detail_${id}`, updated)
    return updated
  })

  const stored = getCached(`session_detail_${id}`)
  if (stored) {
    const updated = updater(stored)
    setCached(`session_detail_${id}`, updated)
  }
}


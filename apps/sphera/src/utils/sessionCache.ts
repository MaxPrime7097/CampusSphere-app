/**
 * Cache utilitaire en mémoire et sessionStorage pour Sphera
 * Évite les rechargements intempestifs et le clignotement lors de la navigation
 */

const memoryCache = new Map<string, { data: any; timestamp: number }>()

export function getCached<T>(key: string, maxAgeMs = 120_000): T | null {
  // 1. En mémoire
  const mem = memoryCache.get(key)
  if (mem && Date.now() - mem.timestamp < maxAgeMs) {
    return mem.data as T
  }

  // 2. En sessionStorage
  try {
    const raw = sessionStorage.getItem(`sphera_cache_${key}`)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Date.now() - parsed.timestamp < maxAgeMs) {
        memoryCache.set(key, parsed)
        return parsed.data as T
      }
    }
  } catch {}

  return null
}

export function setCached<T>(key: string, data: T): void {
  const item = { data, timestamp: Date.now() }
  memoryCache.set(key, item)
  try {
    sessionStorage.setItem(`sphera_cache_${key}`, JSON.stringify(item))
  } catch {}
}

export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryCache.clear()
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith('sphera_cache_')) {
          sessionStorage.removeItem(k)
        }
      })
    } catch {}
    return
  }

  for (const k of Array.from(memoryCache.keys())) {
    if (k.startsWith(prefix)) {
      memoryCache.delete(k)
    }
  }

  try {
    Object.keys(sessionStorage).forEach((k) => {
      if (k.startsWith(`sphera_cache_${prefix}`)) {
        sessionStorage.removeItem(k)
      }
    })
  } catch {}
}

// ────────────────────────────────────────────────────────────────────────────
// Suivi persistant des générations d'outils en cours
// ────────────────────────────────────────────────────────────────────────────

const ONGOING_KEY = 'sphera_ongoing_generations'

interface OngoingRecord {
  [sessionId: string]: string[] // ex: { "12": ["quiz", "podcast"] }
}

export function getOngoingGenerations(sessionId: string | number): string[] {
  try {
    const raw = localStorage.getItem(ONGOING_KEY)
    if (raw) {
      const parsed: OngoingRecord = JSON.parse(raw)
      return parsed[String(sessionId)] || []
    }
  } catch {}
  return []
}

export function addOngoingGeneration(sessionId: string | number, toolType: string): void {
  try {
    const raw = localStorage.getItem(ONGOING_KEY)
    const parsed: OngoingRecord = raw ? JSON.parse(raw) : {}
    const sid = String(sessionId)
    const list = parsed[sid] || []
    if (!list.includes(toolType)) {
      parsed[sid] = [...list, toolType]
      localStorage.setItem(ONGOING_KEY, JSON.stringify(parsed))
      window.dispatchEvent(new CustomEvent('sphera:generation-started', { detail: { sessionId, toolType } }))
    }
  } catch {}
}

export function removeOngoingGeneration(sessionId: string | number, toolType: string): void {
  try {
    const raw = localStorage.getItem(ONGOING_KEY)
    if (!raw) return
    const parsed: OngoingRecord = JSON.parse(raw)
    const sid = String(sessionId)
    if (parsed[sid]) {
      parsed[sid] = parsed[sid].filter((t) => t !== toolType)
      if (parsed[sid].length === 0) {
        delete parsed[sid]
      }
      localStorage.setItem(ONGOING_KEY, JSON.stringify(parsed))
      window.dispatchEvent(new CustomEvent('sphera:generation-finished', { detail: { sessionId, toolType } }))
    }
  } catch {}
}

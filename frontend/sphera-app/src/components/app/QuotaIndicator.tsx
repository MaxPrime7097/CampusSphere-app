import React, { useEffect, useState } from 'react'
import { Sparkles, AlertCircle } from 'lucide-react'
import { getQuota, type GenerationQuota } from '../../services/spheraApi'
import { useSpheraAuth } from '../../contexts/SpheraAuthContext'

export function QuotaIndicator({ className = '' }: { className?: string }) {
  const { isAuthenticated } = useSpheraAuth()
  const [quota, setQuota] = useState<GenerationQuota | null>(null)

  useEffect(() => {
    if (!isAuthenticated) return

    let isMounted = true

    const fetchQuota = () => {
      getQuota()
        .then((res) => {
          if (isMounted && res?.data) {
            setQuota(res.data)
          } else if (isMounted) {
            setQuota({ used: 0, remaining: 5, limit: 5, resetsOn: '' })
          }
        })
        .catch((err) => {
          console.warn('[sphera] Impossible de charger le quota, utilisation du quota nominal:', err)
          if (isMounted) {
            setQuota({ used: 0, remaining: 5, limit: 5, resetsOn: '' })
          }
        })
    }

    fetchQuota()

    const handleQuotaUpdate = () => {
      fetchQuota()
    }

    window.addEventListener('sphera:quota-updated', handleQuotaUpdate)

    return () => {
      isMounted = false
      window.removeEventListener('sphera:quota-updated', handleQuotaUpdate)
    }
  }, [isAuthenticated])

  if (!isAuthenticated) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium bg-sphera-surface border-sphera-border text-sphera-text-muted ${className}`}
      >
        <Sparkles className="w-4 h-4 text-sphera-green shrink-0" />
        <span className="truncate">5 gén. offertes / semaine</span>
      </div>
    )
  }

  const effectiveQuota = quota || { used: 0, remaining: 5, limit: 5, resetsOn: '' }
  const { used, remaining, limit } = effectiveQuota

  const percentUsed = Math.min(100, Math.round((used / limit) * 100))
  const isExhausted = remaining === 0

  return (
    <div
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-xs font-medium ${
        isExhausted
          ? 'bg-red-500/10 border-red-500/30 text-red-400'
          : 'bg-sphera-surface border-sphera-border text-sphera-text-muted'
      } ${className}`}
    >
      {isExhausted ? (
        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
      ) : (
        <Sparkles className="w-4 h-4 text-sphera-green shrink-0" />
      )}
      <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
        <span className="truncate">
          <strong className={isExhausted ? 'text-red-400' : 'text-white'}>{remaining}</strong> / {limit} gén. semaine
        </span>
        <div className="w-12 h-1.5 rounded-full bg-sphera-surface-2 overflow-hidden shrink-0">
          <div
            className={`h-full transition-all duration-300 ${isExhausted ? 'bg-red-500' : 'bg-sphera-green'}`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
      </div>
    </div>
  )
}

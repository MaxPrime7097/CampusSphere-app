import React, { useEffect, useState, useRef } from 'react'
import { Sparkle as Sparkles, WarningCircle as AlertCircle, Info, X } from "@phosphor-icons/react";
import { useTranslation } from 'react-i18next'
import { useSpheraAuth } from '../../contexts/SpheraAuthContext'
import { useQuotaQuery, invalidateSpheraQuota } from '../../hooks/useSpheraQueries'

interface QuotaIndicatorProps {
  className?: string
  align?: 'left' | 'right' | 'auto'
}

export function QuotaIndicator({ className = '', align = 'auto' }: QuotaIndicatorProps) {
  const { t } = useTranslation('study')
  const { isAuthenticated } = useSpheraAuth()
  
  const { data: quota, isLoading } = useQuotaQuery(isAuthenticated)
  const [showInfo, setShowInfo] = useState(false)
  const infoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleQuotaUpdate = () => {
      invalidateSpheraQuota()
    }
    window.addEventListener('sphera:quota-updated', handleQuotaUpdate)

    const handleClickOutside = (e: MouseEvent) => {
      if (infoRef.current && !infoRef.current.contains(e.target as Node)) {
        setShowInfo(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('sphera:quota-updated', handleQuotaUpdate)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isFullWidth = className.includes('w-full') || align === 'left'

  if (!isAuthenticated) {
    return (
      <div className={`relative ${isFullWidth ? 'w-full block' : 'inline-block'}`}>
        <div
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-xs font-medium bg-sphera-surface border-sphera-border text-sphera-text-muted w-full ${className}`}
        >
          <Sparkles weight="fill" className="w-4 h-4 text-sphera-green shrink-0" />
          <span className="truncate">10 générations offertes / semaine</span>
        </div>
      </div>
    )
  }

  // Skeleton shimmer si premier chargement sans cache
  if (isLoading && !quota) {
    return (
      <div className={`relative ${isFullWidth ? 'w-full block' : 'inline-block'}`}>
        <div
          className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium bg-sphera-surface border-sphera-border text-sphera-text-muted animate-pulse w-full ${className}`}
        >
          <div className="flex items-center gap-2">
            <Sparkles weight="fill" className="w-4 h-4 text-sphera-green/40 shrink-0" />
            <div className="h-3.5 w-16 bg-sphera-surface-2 rounded"></div>
          </div>
          <div className="h-2 w-12 bg-sphera-surface-2 rounded-full"></div>
        </div>
      </div>
    )
  }

  const effectiveQuota = quota || { used: 0, remaining: 10, limit: 10, resetsOn: '' }
  const { used, remaining, limit } = effectiveQuota

  const percentUsed = Math.min(100, Math.round((used / limit) * 100))
  const isExhausted = remaining <= 0

  const formatNumber = (num: number) => (num % 1 === 0 ? num.toString() : num.toFixed(1))

  // S'assurer que la popover ne dépasse JAMAIS à gauche de l'écran (left-0 par défaut)
  const popoverAlignClass = align === 'right' ? 'right-0' : 'left-0'

  return (
    <div className={`relative ${isFullWidth ? 'w-full block' : 'inline-block'}`}>
      <div
        className={`flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs font-medium transition-colors select-none w-full ${
          isExhausted
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-sphera-surface border-sphera-border text-sphera-text-muted hover:border-sphera-border/80'
        } ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isExhausted ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <Sparkles weight="fill" className="w-4 h-4 text-sphera-green shrink-0" />
          )}
          <span className="truncate">
            <strong className={isExhausted ? 'text-red-400' : 'text-white'}>
              {formatNumber(remaining)}
            </strong>
            <span className="text-sphera-text-muted"> / {limit} gén.</span>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-sphera-surface-2 overflow-hidden shrink-0 hidden sm:block">
            <div
              className={`h-full transition-all duration-300 ${isExhausted ? 'bg-red-500' : 'bg-sphera-green'}`}
              style={{ width: `${percentUsed}%` }}
            />
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setShowInfo((prev) => !prev)
            }}
            title="Détails du barème de quota"
            className="p-1 rounded-md text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors shrink-0"
          >
            <Info weight="duotone" className="w-3.5 h-3.5 text-sphera-green" />
          </button>
        </div>
      </div>

      {/* Info Popover Modal */}
      {showInfo && (
        <div
          ref={infoRef}
          className={`absolute ${popoverAlignClass} top-full mt-2 w-72 max-w-[calc(100vw-2rem)] p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2 shadow-2xl z-50 text-xs animate-in fade-in zoom-in-95 duration-200`}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-sphera-border">
            <div className="flex items-center gap-1.5 font-semibold text-white">
              <Sparkles weight="fill" className="w-4 h-4 text-sphera-green" />
              <span>Barème de Quota</span>
            </div>
            <button
              type="button"
              onClick={() => setShowInfo(false)}
              className="text-sphera-text-muted hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2 text-white/90">
            <div className="flex items-start justify-between gap-2">
              <span>Cours complet (Fiche, Quiz, Podcast)</span>
              <span className="font-semibold text-white shrink-0">1.0 gén</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span>Par chapitre / sélection de texte</span>
              <span className="font-semibold text-sphera-green shrink-0">0.5 gén</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span>Régénération d'une fiche</span>
              <span className="font-semibold text-sphera-green shrink-0">0.5 gén</span>
            </div>
            <div className="flex items-start justify-between gap-2 border-t border-sphera-border/50 pt-1.5">
              <span>Questions Chat Q&A</span>
              <span className="font-semibold text-emerald-400 shrink-0">Gratuit</span>
            </div>
            <div className="flex items-start justify-between gap-2">
              <span>Notes personnelles manuelles</span>
              <span className="font-semibold text-emerald-400 shrink-0">Gratuit</span>
            </div>
          </div>
          <p className="mt-2.5 pt-2 border-t border-sphera-border/40 text-[10px] text-sphera-text-muted">
            Renouvellement automatique de tes 10 générations chaque lundi matin.
          </p>
        </div>
      )}
    </div>
  )
}

import React, { useState, useEffect, useMemo } from 'react'
import { Sparkle as Sparkles, Spinner as Loader2 } from "@phosphor-icons/react";
import { useTranslation } from 'react-i18next'

interface GenerateButtonProps {
  onGenerate: () => void;
  disabled: boolean;
  isGenerating: boolean;
}

const defaultLoadingMessages = [
  "Sphera lit ton cours...",
  "Extraction des points clés...",
  "Analyse de la structure...",
  "Génération en cours...",
  "Presque prêt...",
  "Sphera finalise ton outil...",
  "Ça arrive !",
]

export function GenerateButton({ onGenerate, disabled, isGenerating }: GenerateButtonProps) {
  const { t } = useTranslation('study')
  const [messageIndex, setMessageIndex] = useState(0)

  const loadingMessages = useMemo(() => {
    const msgs = t('generateButton.messages', { returnObjects: true })
    return Array.isArray(msgs) ? (msgs as string[]) : defaultLoadingMessages
  }, [t])

  useEffect(() => {
    if (!isGenerating) {
      setMessageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [isGenerating, loadingMessages.length])

  return (
    <button
      onClick={onGenerate}
      disabled={disabled || isGenerating}
      className="sphera-primary-btn w-full flex items-center justify-center gap-3 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden mt-6"
    >
      {isGenerating ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="animate-pulse">{loadingMessages[messageIndex]}</span>
        </>
      ) : (
        <>
          <Sparkles className="w-5 h-5 group-hover:scale-110 transition-transform" />
          {t('generateButton.label')}
          
          {/* Subtle sweep animation on hover */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
        </>
      )}
    </button>
  )
}

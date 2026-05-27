import React, { useState, useEffect } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'

interface GenerateButtonProps {
  onGenerate: () => void;
  disabled: boolean;
  isGenerating: boolean;
}

const loadingMessages = [
  "Sphera lit ton cours...",
  "Extraction des points clés...",
  "Analyse de la structure...",
  "Génération en cours...",
  "Presque prêt...",
  "Sphera finalise ton outil...",
  "Ça arrive !",
]

export function GenerateButton({ onGenerate, disabled, isGenerating }: GenerateButtonProps) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (!isGenerating) {
      setMessageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [isGenerating])

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
          Générer avec Sphera
          
          {/* Subtle sweep animation on hover */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
        </>
      )}
    </button>
  )
}

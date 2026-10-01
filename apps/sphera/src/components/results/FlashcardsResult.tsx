import React, { useState } from 'react'
import { ArrowCounterClockwise as RotateCcw, Check, X, ArrowCounterClockwise as Undo2 } from "@phosphor-icons/react";

interface FlashcardsResultProps {
  data: any;
}

export function FlashcardsResult({ data }: FlashcardsResultProps) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [stats, setStats] = useState({ known: 0, review: 0 })
  const [showEnd, setShowEnd] = useState(false)

  const cards = data?.flashcards ? data.flashcards : [
    { front: "Qu'est-ce que le système nerveux central ?", back: "Il comprend l'encéphale et la moelle épinière. C'est le centre d'intégration et de traitement de l'information." },
    { front: "Définir l'homéostasie", back: "Capacité d'un système à maintenir l'équilibre de son milieu intérieur, quelles que soient les contraintes externes." },
    { front: "Quelle est la fonction d'une mitochondrie ?", back: "C'est la centrale énergétique de la cellule, responsable de la production d'ATP via la respiration cellulaire." }
  ]

  const handleCardClick = () => {
    setIsFlipped(!isFlipped)
  }

  const handleAction = (known: boolean) => {
    if (!isFlipped) return // Prevent action if not flipped

    setStats(prev => ({
      known: prev.known + (known ? 1 : 0),
      review: prev.review + (known ? 0 : 1)
    }))

    setIsFlipped(false)
    setTimeout(() => {
      if (currentIdx < cards.length - 1) {
        setCurrentIdx(prev => prev + 1)
      } else {
        setShowEnd(true)
      }
    }, 150) // wait for flip animation to finish
  }

  const reset = () => {
    setCurrentIdx(0)
    setIsFlipped(false)
    setStats({ known: 0, review: 0 })
    setShowEnd(false)
  }

  if (showEnd) {
    return (
      <div className="p-8 rounded-2xl bg-sphera-surface border border-sphera-border text-center animate-in zoom-in-95 max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-white mb-6">Session terminée</h2>
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-sphera-green mb-1">{stats.known}</div>
            <div className="text-sm text-sphera-text-muted">Acquises</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-400 mb-1">{stats.review}</div>
            <div className="text-sm text-sphera-text-muted">À revoir</div>
          </div>
        </div>
        <button onClick={reset} className="sphera-primary-btn w-full flex items-center justify-center gap-2">
          <RotateCcw className="w-5 h-5" /> Revoir le paquet
        </button>
      </div>
    )
  }

  const currentCard = cards[currentIdx]

  return (
    <div className="max-w-xl mx-auto flex flex-col items-center">
      
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-8 text-sm">
        <button onClick={reset} className="text-sphera-text-muted hover:text-white flex items-center gap-2 transition-colors">
          <Undo2 className="w-4 h-4" /> Recommencer
        </button>
        <span className="font-bold text-white bg-sphera-surface px-4 py-1.5 rounded-full border border-sphera-border">
          {currentIdx + 1} / {cards.length}
        </span>
      </div>

      {/* Flashcard 3D Container */}
      <div 
        className="w-full aspect-[4/3] perspective-1000 cursor-pointer mb-8 group"
        onClick={handleCardClick}
      >
        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          
          {/* Front */}
          <div className="absolute w-full h-full backface-hidden rounded-2xl bg-sphera-surface border border-sphera-border p-8 flex flex-col items-center justify-center text-center shadow-xl group-hover:border-sphera-border/80 transition-colors">
            <span className="text-xs font-bold uppercase tracking-widest text-sphera-green mb-4 opacity-50">Recto</span>
            <h3 className="font-display text-2xl text-white leading-relaxed">{currentCard.front}</h3>
            <p className="absolute bottom-6 text-xs text-sphera-text-muted animate-pulse">Clique pour retourner</p>
          </div>

          {/* Back */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl bg-sphera-surface-2 border border-sphera-green/30 p-8 flex flex-col items-center justify-center text-center shadow-[0_0_30px_rgba(34,197,94,0.1)]">
            <span className="text-xs font-bold uppercase tracking-widest text-sphera-green mb-4 opacity-50">Verso</span>
            <p className="text-lg text-white leading-relaxed">{currentCard.back}</p>
          </div>

        </div>
      </div>

      {/* Action Buttons */}
      <div className={`flex items-center gap-4 w-full transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <button 
          onClick={(e) => { e.stopPropagation(); handleAction(false) }}
          className="flex-1 py-4 rounded-xl border border-sphera-border bg-sphera-bg text-white hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-400 transition-all flex items-center justify-center gap-2 font-medium"
        >
          <X className="w-5 h-5" /> À revoir
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); handleAction(true) }}
          className="flex-1 py-4 rounded-xl border border-sphera-green/50 bg-sphera-green/10 text-sphera-green hover:bg-sphera-green hover:text-[#0A0A0A] transition-all flex items-center justify-center gap-2 font-medium"
        >
          <Check className="w-5 h-5" /> Je savais
        </button>
      </div>

      {/* Injecting CSS for 3D flip if not in global CSS */}
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  )
}

import React, { useState } from 'react'
import {
  X,
  Globe,
  BookOpen,
  Question,
  Cards,
  Check,
  PencilSimple,
  Spinner,
  Sparkle,
} from '@phosphor-icons/react'
import type { DetectedChapter } from '../../utils/extractChapters'

interface GenerateScopeModalProps {
  isOpen: boolean
  onClose: () => void
  toolType: 'quiz' | 'flashcards'
  chapters: DetectedChapter[]
  onGenerateFull: () => void
  onGenerateChapter: (chapterTitle: string, chapterSummary: string) => void
  isGenerating?: boolean
}

export function GenerateScopeModal({
  isOpen,
  onClose,
  toolType,
  chapters,
  onGenerateFull,
  onGenerateChapter,
  isGenerating = false,
}: GenerateScopeModalProps) {
  const [scopeMode, setScopeMode] = useState<'full' | 'chapter' | 'custom'>('full')
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number>(0)
  const [customTopic, setCustomTopic] = useState('')

  if (!isOpen) return null

  const isQuiz = toolType === 'quiz'
  const title = isQuiz ? 'Créer un Quiz' : 'Créer des Flashcards'
  const accentColor = isQuiz ? 'rose' : 'orange'

  const handleConfirm = () => {
    if (scopeMode === 'full') {
      onGenerateFull()
      onClose()
      return
    }

    if (scopeMode === 'chapter') {
      const targetChap = chapters[selectedChapterIdx]
      if (targetChap) {
        onGenerateChapter(targetChap.titre, targetChap.resume || targetChap.titre)
        onClose()
      }
      return
    }

    if (scopeMode === 'custom') {
      const topic = customTopic.trim()
      if (topic) {
        onGenerateChapter(topic, topic)
        onClose()
      }
    }
  }

  const hasChapters = chapters && chapters.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-sphera-surface-2 border border-sphera-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-sphera-border bg-sphera-surface">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                isQuiz
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : 'bg-orange-500/10 border-orange-500/20 text-orange-400'
              }`}
            >
              {isQuiz ? <Question weight="duotone" className="w-4 h-4" /> : <Cards weight="duotone" className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">{title}</h2>
              <p className="text-[11px] text-sphera-text-muted">Choisissez le périmètre de révision</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Scope selection cards */}
          <div className="grid grid-cols-1 gap-2.5">
            {/* 1. Full Course */}
            <div
              onClick={() => setScopeMode('full')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                scopeMode === 'full'
                  ? isQuiz
                    ? 'border-rose-500/50 bg-rose-500/10 shadow-sm'
                    : 'border-orange-500/50 bg-orange-500/10 shadow-sm'
                  : 'border-sphera-border bg-sphera-surface hover:bg-sphera-surface/80'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                  scopeMode === 'full'
                    ? isQuiz ? 'bg-rose-500 text-black font-bold' : 'bg-orange-500 text-black font-bold'
                    : 'bg-sphera-surface-2 text-sphera-text-muted'
                }`}
              >
                <Globe className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs sm:text-sm font-semibold text-white">Tout le cours (Document entier)</p>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sphera-surface border border-sphera-border text-sphera-text-muted">
                    1.0 gén
                  </span>
                </div>
                <p className="text-[11px] text-sphera-text-muted mt-0.5">
                  {isQuiz
                    ? 'Génère un test global de 20 questions couvrant l\'ensemble du document.'
                    : 'Génère un paquet complet de 20 flashcards couvrant tout le document.'}
                </p>
              </div>
              {scopeMode === 'full' && (
                <Check className={`w-4 h-4 shrink-0 mt-1 ${isQuiz ? 'text-rose-400' : 'text-orange-400'}`} />
              )}
            </div>

            {/* 2. By Chapter */}
            <div
              onClick={() => setScopeMode('chapter')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                scopeMode === 'chapter'
                  ? isQuiz
                    ? 'border-rose-500/50 bg-rose-500/10 shadow-sm'
                    : 'border-orange-500/50 bg-orange-500/10 shadow-sm'
                  : 'border-sphera-border bg-sphera-surface hover:bg-sphera-surface/80'
              }`}
            >
              <div className="flex items-start gap-3 w-full">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    scopeMode === 'chapter'
                      ? isQuiz ? 'bg-rose-500 text-black font-bold' : 'bg-orange-500 text-black font-bold'
                      : 'bg-sphera-surface-2 text-sphera-text-muted'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-semibold text-white">Par chapitre spécifique (Ciblé)</p>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sphera-green/10 border border-sphera-green/20 text-sphera-green">
                      0.5 gén
                    </span>
                  </div>
                  <p className="text-[11px] text-sphera-text-muted mt-0.5">
                    Entraînement ciblé et approfondi sur une partie spécifique du cours.
                  </p>
                </div>
                {scopeMode === 'chapter' && (
                  <Check className={`w-4 h-4 shrink-0 mt-1 ${isQuiz ? 'text-rose-400' : 'text-orange-400'}`} />
                )}
              </div>

              {/* Chapter Selection list when chapter mode is active */}
              {scopeMode === 'chapter' && (
                <div className="pt-2 border-t border-sphera-border/50 space-y-1.5 animate-in fade-in">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-sphera-text-muted px-1">
                    Sélectionnez un chapitre ({chapters.length}) :
                  </p>
                  {hasChapters ? (
                    <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {chapters.map((chap, idx) => (
                        <div
                          key={chap.id || idx}
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedChapterIdx(idx)
                          }}
                          className={`p-2 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                            selectedChapterIdx === idx
                              ? 'border-sphera-green bg-sphera-green/10 text-white font-medium'
                              : 'border-sphera-border/60 bg-sphera-surface hover:bg-sphera-surface-2 text-sphera-text-muted hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-5 h-5 rounded-md bg-sphera-surface-2 text-[10px] font-bold flex items-center justify-center shrink-0">
                              {chap.numero || idx + 1}
                            </span>
                            <span className="truncate">{chap.titre}</span>
                          </div>
                          {selectedChapterIdx === idx && (
                            <Check className="w-3.5 h-3.5 text-sphera-green shrink-0 ml-2" />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-sphera-surface border border-sphera-border text-center text-xs text-sphera-text-muted">
                      Aucun chapitre explicite détecté. Vous pouvez utiliser le sujet libre ci-dessous.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Custom Topic */}
            <div
              onClick={() => setScopeMode('custom')}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2.5 ${
                scopeMode === 'custom'
                  ? isQuiz
                    ? 'border-rose-500/50 bg-rose-500/10 shadow-sm'
                    : 'border-orange-500/50 bg-orange-500/10 shadow-sm'
                  : 'border-sphera-border bg-sphera-surface hover:bg-sphera-surface/80'
              }`}
            >
              <div className="flex items-start gap-3 w-full">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    scopeMode === 'custom'
                      ? isQuiz ? 'bg-rose-500 text-black font-bold' : 'bg-orange-500 text-black font-bold'
                      : 'bg-sphera-surface-2 text-sphera-text-muted'
                  }`}
                >
                  <PencilSimple className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm font-semibold text-white">Sujet libre / Notion précise</p>
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-sphera-green/10 border border-sphera-green/20 text-sphera-green">
                      0.5 gén
                    </span>
                  </div>
                  <p className="text-[11px] text-sphera-text-muted mt-0.5">
                    Entrez un mot-clé ou un concept pour un quiz sur-mesure.
                  </p>
                </div>
                {scopeMode === 'custom' && (
                  <Check className={`w-4 h-4 shrink-0 mt-1 ${isQuiz ? 'text-rose-400' : 'text-orange-400'}`} />
                )}
              </div>

              {scopeMode === 'custom' && (
                <div className="pt-2 border-t border-sphera-border/50 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    placeholder="Ex: Les pointeurs en C, La méiose, Les lois de Kepler..."
                    autoFocus
                    className="w-full px-3 py-2 bg-sphera-surface border border-sphera-border rounded-lg text-xs text-white placeholder:text-sphera-text-muted/60 focus:outline-none focus:border-sphera-green"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-sphera-border bg-sphera-surface flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors cursor-pointer"
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isGenerating || (scopeMode === 'chapter' && !hasChapters) || (scopeMode === 'custom' && !customTopic.trim())}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
              isQuiz
                ? 'bg-rose-500 hover:bg-rose-400 text-black'
                : 'bg-orange-500 hover:bg-orange-400 text-black'
            }`}
          >
            {isGenerating ? <Spinner className="w-3.5 h-3.5 animate-spin" /> : <Sparkle weight="fill" className="w-3.5 h-3.5" />}
            <span>{isGenerating ? 'Génération en cours…' : `Lancer la création (${scopeMode === 'full' ? '1.0' : '0.5'} gén)`}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

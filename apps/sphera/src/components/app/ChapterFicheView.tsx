import React, { useState } from 'react'
import {
  FileText,
  Question,
  Cards,
  ArrowClockwise,
  CaretDown,
  CaretRight,
  Sparkle,
  BookOpen,
  WarningCircle,
  Function as MathFunction,
  ListChecks,
  Spinner,
} from "@phosphor-icons/react"
import { MarkdownRenderer } from './MarkdownRenderer'
import DownloadPDFButton from '../shared/DownloadPDFButton'
import { useDownloadPDF } from '../../hooks/useDownloadPDF'

interface ChapterBlock {
  id?: string
  numero?: number
  titre: string
  resume: string
  points_cles?: string[]
}

interface FicheData {
  titre?: string
  resume?: string
  chapitres?: ChapterBlock[]
  points_cles?: string[]
  definitions?: Array<{ terme: string; definition: string }>
  formules?: string[]
  a_retenir?: string[]
}

interface ChapterFicheViewProps {
  fiche: FicheData
  onGenerateChapterQuiz: (chapterTitle: string, chapterSummary: string) => void
  onGenerateChapterFlashcards: (chapterTitle: string, chapterSummary: string) => void
  onRegenerateFiche: () => void
  isRegenerating?: boolean
  isGeneratingItem?: boolean
  generatingChapterArtefact?: { type: 'quiz' | 'flashcards'; chapter: string } | null
}

export function ChapterFicheView({
  fiche,
  onGenerateChapterQuiz,
  onGenerateChapterFlashcards,
  onRegenerateFiche,
  isRegenerating = false,
  isGeneratingItem = false,
  generatingChapterArtefact = null,
}: ChapterFicheViewProps) {
  const { isDownloading, generateFiche } = useDownloadPDF()

  const [openSections, setOpenSections] = useState<{
    definitions: boolean
    formules: boolean
    a_retenir: boolean
  }>({
    definitions: false,
    formules: false,
    a_retenir: true,
  })

  const toggleSection = (section: 'definitions' | 'formules' | 'a_retenir') => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const chapitres = Array.isArray(fiche.chapitres) && fiche.chapitres.length > 0 ? fiche.chapitres : null

  return (
    <div className="w-full flex flex-col gap-6 py-2 animate-in fade-in duration-300">
      {/* 1. Header with Fiche Title, Download and Regenerate action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sphera-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
            <FileText weight="duotone" className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
              {fiche.titre || "Fiche de Révision"}
            </h1>
            <p className="text-xs text-sphera-text-muted mt-0.5">
              Structure par blocs & chapitres d'étude
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5 self-start sm:self-auto shrink-0 items-end">
          <button
            type="button"
            onClick={onRegenerateFiche}
            disabled={isRegenerating || isGeneratingItem}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-xs font-medium text-white/90 transition-colors disabled:opacity-50 shrink-0"
          >
            <ArrowClockwise className={`w-3.5 h-3.5 text-sphera-green ${isRegenerating ? 'animate-spin' : ''}`} />
            <span>{isRegenerating ? "Régénération..." : "Régénérer (0.5 gén)"}</span>
          </button>
          <DownloadPDFButton
            isDownloading={isDownloading}
            onDownload={() => generateFiche(fiche)}
            label="Télécharger en PDF"
          />
        </div>
      </div>

      {/* 2. Global Overview Summary */}
      {fiche.resume && (
        <div className="p-4 rounded-2xl bg-sphera-surface-2/60 border border-sphera-border/70 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-sphera-green uppercase tracking-wider">
            <Sparkle weight="duotone" className="w-4 h-4" />
            <span>Synthèse Générale</span>
          </div>
          <div className="text-sm leading-relaxed text-white/90">
            <MarkdownRenderer content={fiche.resume} />
          </div>
        </div>
      )}

      {/* 3. Chapter Blocks (The Core Innovation) */}
      {chapitres ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen weight="duotone" className="w-4 h-4 text-cyan-400" />
            <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
              Chapitres & Blocs d'Étude ({chapitres.length})
            </h2>
          </div>

          <div className="space-y-4">
            {chapitres.map((chap, idx) => (
              <div
                key={chap.id || idx}
                className="p-4 sm:p-5 rounded-2xl border border-sphera-border bg-sphera-surface/90 shadow-sm space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sphera-border/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-md bg-cyan-500/10 text-cyan-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {chap.numero || idx + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      {chap.titre}
                    </h3>
                  </div>

                  {/* Contextual Action Buttons on each Chapter */}
                  {(() => {
                    const isThisQuizGenerating = generatingChapterArtefact?.type === 'quiz' && generatingChapterArtefact?.chapter === chap.titre
                    const isThisFlashGenerating = generatingChapterArtefact?.type === 'flashcards' && generatingChapterArtefact?.chapter === chap.titre
                    return (
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          disabled={isGeneratingItem}
                          onClick={() => onGenerateChapterQuiz(chap.titre, chap.resume)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-colors disabled:opacity-50"
                          title="Générer un quiz ciblé sur ce chapitre (0.5 gén)"
                        >
                          {isThisQuizGenerating ? (
                            <Spinner className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                          ) : (
                            <Question weight="duotone" className="w-3.5 h-3.5" />
                          )}
                          <span>{isThisQuizGenerating ? "Création..." : "Quiz (0.5)"}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isGeneratingItem}
                          onClick={() => onGenerateChapterFlashcards(chap.titre, chap.resume)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                          title="Générer des flashcards ciblées sur ce chapitre (0.5 gén)"
                        >
                          {isThisFlashGenerating ? (
                            <Spinner className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                          ) : (
                            <Cards weight="duotone" className="w-3.5 h-3.5" />
                          )}
                          <span>{isThisFlashGenerating ? "Création..." : "Flashcards (0.5)"}</span>
                        </button>
                      </div>
                    )
                  })()}
                </div>

                {/* Chapter Summary Text */}
                <div className="text-sm leading-relaxed text-white/90">
                  <MarkdownRenderer content={chap.resume} />
                </div>

                {/* Chapter Specific Key Points */}
                {Array.isArray(chap.points_cles) && chap.points_cles.length > 0 && (
                  <div className="pt-2 border-t border-sphera-border/30">
                    <ul className="space-y-1 pl-4 list-disc marker:text-sphera-green text-xs text-white/80">
                      {chap.points_cles.map((pt, pIdx) => (
                        <li key={pIdx}>{pt}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Fallback for legacy fiche format with points_cles array */
        Array.isArray(fiche.points_cles) &&
        fiche.points_cles.length > 0 && (
          <div className="p-4 rounded-2xl border border-sphera-border bg-sphera-surface space-y-2">
            <h3 className="text-xs font-semibold text-sphera-green uppercase tracking-wider">
              Points Essentiels du Cours
            </h3>
            <ul className="space-y-1.5 pl-4 list-disc marker:text-sphera-green text-sm text-white/90">
              {fiche.points_cles.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        )
      )}

      {/* 4. Foldable Secondary Sections (Definitions, Formulas, Exam Traps) */}
      <div className="space-y-3 pt-2">
        {/* A. Définitions Clés */}
        {Array.isArray(fiche.definitions) && fiche.definitions.length > 0 && (
          <div className="rounded-xl border border-sphera-border bg-sphera-surface/70 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('definitions')}
              className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-sphera-surface-2/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ListChecks weight="duotone" className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Définitions Clés ({fiche.definitions.length})
                </span>
              </div>
              {openSections.definitions ? (
                <CaretDown className="w-4 h-4 text-sphera-text-muted" />
              ) : (
                <CaretRight className="w-4 h-4 text-sphera-text-muted" />
              )}
            </button>

            {openSections.definitions && (
              <div className="px-4 pb-4 space-y-2.5 border-t border-sphera-border/40 pt-3">
                {fiche.definitions.map((def, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-sphera-surface-2/50 border border-sphera-border/40">
                    <span className="font-semibold text-xs text-sphera-green">{def.terme} : </span>
                    <span className="text-xs text-white/80">{def.definition}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* B. Formules Essentielles */}
        {Array.isArray(fiche.formules) && fiche.formules.length > 0 && (
          <div className="rounded-xl border border-sphera-border bg-sphera-surface/70 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('formules')}
              className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-sphera-surface-2/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <MathFunction weight="duotone" className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Formules Mathématiques ({fiche.formules.length})
                </span>
              </div>
              {openSections.formules ? (
                <CaretDown className="w-4 h-4 text-sphera-text-muted" />
              ) : (
                <CaretRight className="w-4 h-4 text-sphera-text-muted" />
              )}
            </button>

            {openSections.formules && (
              <div className="px-4 pb-4 space-y-2 border-t border-sphera-border/40 pt-3 font-mono text-xs text-purple-300">
                {fiche.formules.map((formule, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-sphera-surface-2/60 border border-purple-500/20">
                    {formule}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* C. Pièges & Conseils Examens */}
        {Array.isArray(fiche.a_retenir) && fiche.a_retenir.length > 0 && (
          <div className="rounded-xl border border-sphera-border bg-sphera-surface/70 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection('a_retenir')}
              className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-sphera-surface-2/60 transition-colors"
            >
              <div className="flex items-center gap-2">
                <WarningCircle weight="duotone" className="w-4 h-4 text-yellow-400" />
                <span className="text-xs font-semibold text-white uppercase tracking-wider">
                  Pièges & Conseils pour le Partiel ({fiche.a_retenir.length})
                </span>
              </div>
              {openSections.a_retenir ? (
                <CaretDown className="w-4 h-4 text-sphera-text-muted" />
              ) : (
                <CaretRight className="w-4 h-4 text-sphera-text-muted" />
              )}
            </button>

            {openSections.a_retenir && (
              <div className="px-4 pb-4 space-y-2 border-t border-sphera-border/40 pt-3">
                {fiche.a_retenir.map((conseil, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-white/80">
                    <span className="text-yellow-400 font-bold shrink-0">⚠️</span>
                    <span>{conseil}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

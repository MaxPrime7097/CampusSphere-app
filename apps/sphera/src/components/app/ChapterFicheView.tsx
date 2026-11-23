import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
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
  CheckCircle,
  Circle,
  Lightbulb,
  Lightning,
  Exam,
  Eye,
  EyeSlash,
} from '@phosphor-icons/react'
import { MarkdownRenderer } from './MarkdownRenderer'
import DownloadPDFButton from '../shared/DownloadPDFButton'
import { useDownloadPDF } from '../../hooks/useDownloadPDF'
import type { WorkspaceSlots } from './workspaceSlots'
import { InlineSpheraAnswerCard, useInlineSpheraAsk } from './InlineSpheraExplanation'

interface ChapterBlock {
  id?: string
  numero?: number
  titre: string
  resume: string
  points_cles?: string[]
}

type FormulaItem =
  | string
  | {
      nom?: string
      formule?: string
      explication?: string
      application?: string
    }

type ExampleItem =
  | string
  | {
      titre?: string
      concept?: string
      description?: string
      exemple?: string
    }

type TrapItem =
  | string
  | {
      piege?: string
      description?: string
    }

type ExamQuestionItem =
  | string
  | {
      question?: string
      reponse?: string
      elements_reponse?: string
    }

interface FicheData {
  titre?: string
  resume?: string
  chapitres?: ChapterBlock[]
  points_cles?: string[]
  definitions?: Array<{ terme?: string; nom?: string; definition?: string; explication?: string }>
  formules?: FormulaItem[]
  exemples?: ExampleItem[]
  pieges?: TrapItem[]
  a_retenir?: string[]
  questions_examen?: ExamQuestionItem[]
}

interface ChapterFicheViewProps {
  fiche: FicheData
  sessionId?: string | number | null
  sessionType?: 'session' | 'annale'
  onGenerateChapterQuiz: (chapterTitle: string, chapterSummary: string) => void
  onGenerateChapterFlashcards: (chapterTitle: string, chapterSummary: string) => void
  onRegenerateFiche: () => void
  onSaveNote?: (title: string, text: string) => Promise<void> | void
  isRegenerating?: boolean
  isGeneratingItem?: boolean
  generatingChapterArtefact?: { type: 'quiz' | 'flashcards'; chapter: string } | null
  workspaceSlots?: WorkspaceSlots
}

type FicheTab = 'all' | 'chapters' | 'memento' | 'exam'

function formatFormulaMarkdown(raw: string): string {
  const trimmed = (raw || '').trim()
  if (!trimmed) return ''
  if (
    (trimmed.startsWith('$$') && trimmed.endsWith('$$')) ||
    (trimmed.startsWith('$') && trimmed.endsWith('$')) ||
    (trimmed.startsWith('\\[') && trimmed.endsWith('\\]')) ||
    (trimmed.startsWith('\\(') && trimmed.endsWith('\\)'))
  ) {
    return trimmed
  }
  if (
    /\\(frac|sum|int|sqrt|Delta|alpha|beta|gamma|sigma|mu|lambda|theta|pi|times|cdot|leq|geq|neq|approx|infty|vec|bar|hat|text|lim|log|ln|sin|cos)/.test(
      trimmed,
    )
  ) {
    return `$$${trimmed}$$`
  }
  return trimmed
}

function buildEnrichedChapterContext(chap: ChapterBlock): string {
  const parts: string[] = [chap.resume || '']
  if (Array.isArray(chap.points_cles) && chap.points_cles.length > 0) {
    parts.push('\nPoints clés du chapitre :\n' + chap.points_cles.map((p) => `- ${p}`).join('\n'))
  }
  return parts.join('\n').trim()
}

export function ChapterFicheView({
  fiche,
  sessionId,
  sessionType = 'session',
  onGenerateChapterQuiz,
  onGenerateChapterFlashcards,
  onRegenerateFiche,
  onSaveNote,
  isRegenerating = false,
  isGeneratingItem = false,
  generatingChapterArtefact = null,
  workspaceSlots,
}: ChapterFicheViewProps) {
  const { isDownloading, generateFiche } = useDownloadPDF()
  const inlineAsk = useInlineSpheraAsk({ sessionId, sessionType })

  const chapitres = useMemo(
    () => (Array.isArray(fiche.chapitres) && fiche.chapitres.length > 0 ? fiche.chapitres : null),
    [fiche.chapitres],
  )
  const definitions = Array.isArray(fiche.definitions) ? fiche.definitions : []
  const formules = Array.isArray(fiche.formules) ? fiche.formules : []
  const exemples = Array.isArray(fiche.exemples) ? fiche.exemples : []
  const pieges = Array.isArray(fiche.pieges) ? fiche.pieges : []
  const aRetenir = Array.isArray(fiche.a_retenir) ? fiche.a_retenir : []
  const questionsExamen = Array.isArray(fiche.questions_examen) ? fiche.questions_examen : []

  const mementoCount = definitions.length + formules.length + exemples.length + pieges.length + aRetenir.length
  const hasChapters = Boolean(chapitres && chapitres.length > 0)
  const hasMemento = mementoCount > 0
  const hasExam = questionsExamen.length > 0

  const [activeTab, setActiveTab] = useState<FicheTab>('all')
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({})

  // Sections open by default so key definitions & formulas are never hidden
  const [openSections, setOpenSections] = useState({
    definitions: true,
    formules: true,
    exemples: true,
    pieges: true,
    a_retenir: true,
  })

  // Chapter mastery persistence in localStorage
  const masteryStorageKey = useMemo(() => {
    const idPart = sessionId ? String(sessionId) : (fiche.titre || 'fiche').slice(0, 40)
    return `sphera_fiche_mastered_${idPart}`
  }, [sessionId, fiche.titre])

  const [masteredChapters, setMasteredChapters] = useState<Record<string, boolean>>({})

  useEffect(() => {
    try {
      const saved = localStorage.getItem(masteryStorageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && typeof parsed === 'object') {
          setMasteredChapters(parsed)
          return
        }
      }
      setMasteredChapters({})
    } catch {
      setMasteredChapters({})
    }
  }, [masteryStorageKey])

  const toggleChapterMastered = (chapterKey: string) => {
    setMasteredChapters((prev) => {
      const next = { ...prev, [chapterKey]: !prev[chapterKey] }
      if (!next[chapterKey]) delete next[chapterKey]
      try {
        localStorage.setItem(masteryStorageKey, JSON.stringify(next))
      } catch {
        // ignore quota errors
      }
      return next
    })
  }

  const masteredCount = useMemo(() => {
    if (!chapitres) return 0
    return chapitres.reduce((acc, chap, idx) => {
      const key = chap.id || `chap_${idx}`
      return acc + (masteredChapters[key] ? 1 : 0)
    }, 0)
  }, [chapitres, masteredChapters])

  const masteryPct = chapitres && chapitres.length > 0 ? Math.round((masteredCount / chapitres.length) * 100) : 0

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const scrollToChapter = (idx: number) => {
    const el = document.getElementById(`fiche-chapter-${idx}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleExplainChapter = (chapterKey: string, chap: ChapterBlock) => {
    const prompt = `Explique-moi de manière claire, structurée et pédagogique le chapitre « ${chap.titre} » de ce cours, en clarifiant les mécanismes essentiels et en donnant une analogie ou un exemple concret.`
    inlineAsk.ask(chapterKey, prompt, `Explication — ${chap.titre}`)
  }

  const handleExplainQuestion = (qKey: string, questionText: string) => {
    const prompt = `Aide-moi à maîtriser parfaitement cette question d'examen en lien avec le cours : « ${questionText} ». Explique la méthode attendue et les points clés à ne surtout pas oublier.`
    inlineAsk.ask(qKey, prompt, 'Méthode & Approfondissement')
  }

  const allQuestionsRevealed =
    questionsExamen.length > 0 && questionsExamen.every((_, idx) => Boolean(revealedQuestions[idx]))

  const toggleRevealAllQuestions = () => {
    if (allQuestionsRevealed) {
      setRevealedQuestions({})
    } else {
      const next: Record<number, boolean> = {}
      questionsExamen.forEach((_, idx) => {
        next[idx] = true
      })
      setRevealedQuestions(next)
    }
  }

  const availableTabs: Array<{ id: FicheTab; label: string; count?: number }> = [
    { id: 'all', label: 'Tout' },
    ...(hasChapters ? [{ id: 'chapters' as FicheTab, label: 'Chapitres', count: chapitres!.length }] : []),
    ...(hasMemento ? [{ id: 'memento' as FicheTab, label: 'Mémento', count: mementoCount }] : []),
    ...(hasExam ? [{ id: 'exam' as FicheTab, label: 'Auto-éval', count: questionsExamen.length }] : []),
  ]

  const headerActions = (
    <div className="flex items-center justify-between gap-2 w-full min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        <FileText weight="duotone" className="w-4 h-4 text-cyan-400 shrink-0 hidden sm:block" />
        <span className="text-xs sm:text-sm font-semibold text-white truncate">
          {fiche.titre || 'Fiche de Révision'}
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onRegenerateFiche}
          disabled={isRegenerating || isGeneratingItem}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-xs font-medium text-white/90 transition-colors disabled:opacity-50 cursor-pointer"
          title="Régénérer la fiche (0.5 génération)"
        >
          <ArrowClockwise className={`w-3.5 h-3.5 text-sphera-green ${isRegenerating ? 'animate-spin' : ''}`} />
          <span className="hidden md:inline">{isRegenerating ? 'Régénération...' : 'Régénérer'}</span>
        </button>
        <DownloadPDFButton
          isDownloading={isDownloading}
          onDownload={() => generateFiche(fiche)}
          label="PDF"
          className="!px-2.5 !py-1.5 !text-xs !rounded-lg cursor-pointer"
        />
      </div>
    </div>
  )

  const progressBar = hasChapters ? (
    <div className="w-full h-1 bg-sphera-surface-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 transition-all duration-300"
        style={{ width: `${masteryPct}%` }}
      />
    </div>
  ) : null

  const showChapters = activeTab === 'all' || activeTab === 'chapters'
  const showMemento = activeTab === 'all' || activeTab === 'memento'
  const showExam = activeTab === 'all' || activeTab === 'exam'

  return (
    <div className="w-full flex flex-col gap-5 py-1 animate-in fade-in duration-300">
      {workspaceSlots?.progressSlot && progressBar && createPortal(progressBar, workspaceSlots.progressSlot)}

      {workspaceSlots?.headerSlot ? (
        createPortal(headerActions, workspaceSlots.headerSlot)
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-sphera-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
              <FileText weight="duotone" className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-white leading-tight">
                {fiche.titre || 'Fiche de Révision'}
              </h1>
              <p className="text-xs text-sphera-text-muted mt-0.5">
                Fiche structurée par chapitres & mémento d'examen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={onRegenerateFiche}
              disabled={isRegenerating || isGeneratingItem}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-xs font-medium text-white/90 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
            >
              <ArrowClockwise className={`w-3.5 h-3.5 text-sphera-green ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? 'Régénération...' : 'Régénérer (0.5)'}</span>
            </button>
            <DownloadPDFButton
              isDownloading={isDownloading}
              onDownload={() => generateFiche(fiche)}
              label="PDF"
            />
          </div>
        </div>
      )}

      {/* 1. Synthèse Express ("L'essentiel en 30 secondes") */}
      {fiche.resume && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sphera-surface-2/80 via-sphera-surface-2/60 to-sphera-surface/80 border border-sphera-border/80 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-sphera-green uppercase tracking-wider">
              <Sparkle weight="duotone" className="w-4 h-4" />
              <span>L'essentiel en 30 secondes</span>
            </div>

            {hasChapters && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sphera-surface border border-sphera-border text-white/85">
                <CheckCircle
                  weight={masteredCount === chapitres!.length ? 'fill' : 'duotone'}
                  className={`w-3.5 h-3.5 ${masteredCount > 0 ? 'text-sphera-green' : 'text-sphera-text-muted'}`}
                />
                <span>
                  {masteredCount}/{chapitres!.length} maîtrisé{masteredCount > 1 ? 's' : ''}
                </span>
              </span>
            )}
          </div>

          <div className="text-sm leading-relaxed text-white/90">
            <MarkdownRenderer content={fiche.resume} />
          </div>

          {/* Discreet metadata pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {hasChapters && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-sphera-surface/80 border border-sphera-border/60 text-sphera-text-muted">
                {chapitres!.length} chapitre{chapitres!.length > 1 ? 's' : ''}
              </span>
            )}
            {definitions.length > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-sphera-surface/80 border border-sphera-border/60 text-sphera-text-muted">
                {definitions.length} définition{definitions.length > 1 ? 's' : ''}
              </span>
            )}
            {formules.length > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-sphera-surface/80 border border-sphera-border/60 text-sphera-text-muted">
                {formules.length} formule{formules.length > 1 ? 's' : ''}
              </span>
            )}
            {exemples.length > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-sphera-surface/80 border border-sphera-border/60 text-sphera-text-muted">
                {exemples.length} exemple{exemples.length > 1 ? 's' : ''}
              </span>
            )}
            {questionsExamen.length > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-sphera-surface/80 border border-sphera-border/60 text-sphera-text-muted">
                {questionsExamen.length} question{questionsExamen.length > 1 ? 's' : ''} d'examen
              </span>
            )}
          </div>
        </div>
      )}

      {/* 2. Segmented View Tabs (Tout / Chapitres / Mémento / Auto-éval) */}
      {availableTabs.length > 2 && (
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-sphera-surface-2/70 border border-sphera-border/70 overflow-x-auto no-scrollbar">
          {availableTabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-sphera-surface text-white shadow-sm border border-sphera-border'
                    : 'text-sphera-text-muted hover:text-white border border-transparent'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-sphera-green/15 text-sphera-green' : 'bg-sphera-surface/60 text-sphera-text-muted'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* 3. Mini Table of Contents (clickable chapter pills for 3+ chapters) */}
      {showChapters && chapitres && chapitres.length >= 3 && (
        <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 rounded-xl bg-sphera-surface/60 border border-sphera-border/60">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-sphera-text-muted mr-1">
            Plan :
          </span>
          {chapitres.map((chap, idx) => {
            const chapKey = chap.id || `chap_${idx}`
            const isMastered = Boolean(masteredChapters[chapKey])
            return (
              <button
                key={chapKey}
                type="button"
                onClick={() => scrollToChapter(idx)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer max-w-[220px] ${
                  isMastered
                    ? 'bg-sphera-green/10 border border-sphera-green/30 text-sphera-green'
                    : 'bg-sphera-surface-2/70 border border-sphera-border/60 text-white/80 hover:text-white hover:border-cyan-500/40'
                }`}
              >
                <span className="font-bold opacity-80">{String(chap.numero || idx + 1).padStart(2, '0')}</span>
                <span className="truncate">{chap.titre}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* 4. Chapters Section */}
      {showChapters && (
        chapitres ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen weight="duotone" className="w-4 h-4 text-cyan-400" />
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                Chapitres & Développement ({chapitres.length})
              </h2>
            </div>

            <div className="space-y-4">
              {chapitres.map((chap, idx) => {
                const chapKey = chap.id || `chap_${idx}`
                const isMastered = Boolean(masteredChapters[chapKey])
                const isThisQuizGenerating =
                  generatingChapterArtefact?.type === 'quiz' && generatingChapterArtefact?.chapter === chap.titre
                const isThisFlashGenerating =
                  generatingChapterArtefact?.type === 'flashcards' && generatingChapterArtefact?.chapter === chap.titre
                const inlineEntry = inlineAsk.entries[chapKey]
                const enrichedContext = buildEnrichedChapterContext(chap)

                return (
                  <article
                    key={chapKey}
                    id={`fiche-chapter-${idx}`}
                    className={`rounded-2xl border bg-sphera-surface/95 shadow-sm transition-colors scroll-mt-4 ${
                      isMastered ? 'border-sphera-green/35' : 'border-sphera-border'
                    }`}
                  >
                    {/* Calm Editorial Chapter Header */}
                    <div className="flex items-start sm:items-center justify-between gap-3 px-4 sm:px-5 pt-4 pb-3 border-b border-sphera-border/50">
                      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                        <span
                          className={`w-6 h-6 rounded-lg font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                            isMastered
                              ? 'bg-sphera-green/15 text-sphera-green border border-sphera-green/30'
                              : 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          }`}
                        >
                          {String(chap.numero || idx + 1).padStart(2, '0')}
                        </span>
                        <h3 className="text-sm sm:text-[15px] font-bold text-white leading-snug">
                          {chap.titre}
                        </h3>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleChapterMastered(chapKey)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
                          isMastered
                            ? 'bg-sphera-green/15 border border-sphera-green/35 text-sphera-green'
                            : 'bg-sphera-surface-2/70 border border-sphera-border text-sphera-text-muted hover:text-white hover:border-sphera-border'
                        }`}
                        title={isMastered ? 'Marquer comme à revoir' : 'Marquer ce chapitre comme maîtrisé'}
                      >
                        {isMastered ? (
                          <CheckCircle weight="fill" className="w-3.5 h-3.5" />
                        ) : (
                          <Circle className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">{isMastered ? 'Maîtrisé' : 'À maîtriser'}</span>
                      </button>
                    </div>

                    {/* Chapter Body */}
                    <div className="px-4 sm:px-5 py-4 space-y-4">
                      <div className="text-sm leading-relaxed text-white/90">
                        <MarkdownRenderer content={chap.resume} />
                      </div>

                      {/* Accented Key Takeaways Box */}
                      {Array.isArray(chap.points_cles) && chap.points_cles.length > 0 && (
                        <div className="rounded-xl bg-sphera-surface-2/60 border border-sphera-border/60 border-l-[3px] border-l-sphera-green px-3.5 py-3 space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-sphera-green">
                            À retenir du chapitre
                          </div>
                          <ul className="space-y-1.5">
                            {chap.points_cles.map((pt, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-2 text-xs text-white/85 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-sphera-green shrink-0 mt-1.5" />
                                <div className="min-w-0 flex-1">
                                  <MarkdownRenderer content={String(pt)} className="[&_p]:my-0 [&_p]:text-xs [&_p]:text-white/85" />
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Inline SSE Explanation (appears directly under chapter when requested) */}
                      {inlineEntry && (
                        <InlineSpheraAnswerCard
                          entry={inlineEntry}
                          onStop={() => inlineAsk.stop(chapKey)}
                          onClose={() => inlineAsk.close(chapKey)}
                          onRetry={() => handleExplainChapter(chapKey, chap)}
                          onSaveNote={onSaveNote}
                        />
                      )}
                    </div>

                    {/* Clean Action Footer (Read first, act after!) */}
                    <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-5 py-2.5 bg-sphera-surface-2/35 border-t border-sphera-border/40 rounded-b-2xl">
                      <div>
                        {sessionId && (
                          <button
                            type="button"
                            onClick={() => handleExplainChapter(chapKey, chap)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-sphera-green bg-sphera-green/10 border border-sphera-green/20 hover:bg-sphera-green/20 transition-colors cursor-pointer"
                            title="Demander une explication claire à Sphera sans quitter la fiche"
                          >
                            <Sparkle weight="duotone" className="w-3.5 h-3.5" />
                            <span>Expliquer</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isGeneratingItem}
                          onClick={() => onGenerateChapterQuiz(chap.titre, enrichedContext)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-sphera-surface border border-sphera-border text-white/80 hover:text-rose-300 hover:border-rose-500/35 hover:bg-rose-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Générer un quiz ciblé sur ce chapitre (0.5 gén)"
                        >
                          {isThisQuizGenerating ? (
                            <Spinner className="w-3.5 h-3.5 text-rose-400 animate-spin" />
                          ) : (
                            <Question weight="duotone" className="w-3.5 h-3.5 text-rose-400" />
                          )}
                          <span>{isThisQuizGenerating ? 'Création...' : 'Quiz (0.5)'}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isGeneratingItem}
                          onClick={() => onGenerateChapterFlashcards(chap.titre, enrichedContext)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-sphera-surface border border-sphera-border text-white/80 hover:text-orange-300 hover:border-orange-500/35 hover:bg-orange-500/10 transition-colors disabled:opacity-50 cursor-pointer"
                          title="Générer des cartes mémoire ciblées sur ce chapitre (0.5 gén)"
                        >
                          {isThisFlashGenerating ? (
                            <Spinner className="w-3.5 h-3.5 text-orange-400 animate-spin" />
                          ) : (
                            <Cards weight="duotone" className="w-3.5 h-3.5 text-orange-400" />
                          )}
                          <span>{isThisFlashGenerating ? 'Création...' : 'Flashcards (0.5)'}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        ) : (
          /* Fallback for legacy fiches without chapitres */
          Array.isArray(fiche.points_cles) &&
          fiche.points_cles.length > 0 && (
            <div className="p-4 rounded-2xl border border-sphera-border bg-sphera-surface space-y-2">
              <h3 className="text-xs font-semibold text-sphera-green uppercase tracking-wider">
                Points Essentiels du Cours
              </h3>
              <ul className="space-y-2">
                {fiche.points_cles.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-white/90">
                    <span className="w-1.5 h-1.5 rounded-full bg-sphera-green shrink-0 mt-2" />
                    <div className="flex-1 min-w-0">
                      <MarkdownRenderer content={String(point)} className="[&_p]:my-0" />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        )
      )}

      {/* 5. Mémento Section (Définitions, Formules, Exemples, Pièges, À retenir) */}
      {showMemento && hasMemento && (
        <div className="space-y-3.5 pt-1">
          {activeTab === 'all' && (
            <div className="flex items-center gap-2 pt-2">
              <ListChecks weight="duotone" className="w-4 h-4 text-sphera-green" />
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                Mémento & Par Cœur
              </h2>
            </div>
          )}

          {/* A. Définitions Clés — 2-column scannable glossary grid */}
          {definitions.length > 0 && (
            <div className="rounded-2xl border border-sphera-border bg-sphera-surface/80 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('definitions')}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-sphera-surface-2/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ListChecks weight="duotone" className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    Définitions Clés ({definitions.length})
                  </span>
                </div>
                {openSections.definitions ? (
                  <CaretDown className="w-4 h-4 text-sphera-text-muted" />
                ) : (
                  <CaretRight className="w-4 h-4 text-sphera-text-muted" />
                )}
              </button>

              {openSections.definitions && (
                <div className="px-4 pb-4 pt-3 border-t border-sphera-border/40 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {definitions.map((def, idx) => {
                    const terme = def.terme || def.nom || ''
                    const desc = def.definition || def.explication || ''
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-sphera-surface-2/55 border border-sphera-border/50 border-t-2 border-t-cyan-500/60 space-y-1"
                      >
                        <div className="font-bold text-xs text-cyan-300 leading-snug">
                          <MarkdownRenderer content={String(terme)} className="[&_p]:my-0 [&_p]:text-xs [&_p]:text-cyan-300 [&_p]:font-bold" />
                        </div>
                        <div className="text-xs text-white/85 leading-relaxed">
                          <MarkdownRenderer content={String(desc)} className="[&_p]:my-0 [&_p]:text-xs [&_p]:text-white/85" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* B. Formules, Lois & Règles — 3-tier KaTeX cards */}
          {formules.length > 0 && (
            <div className="rounded-2xl border border-sphera-border bg-sphera-surface/80 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('formules')}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-sphera-surface-2/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <MathFunction weight="duotone" className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    Formules, Lois & Règles ({formules.length})
                  </span>
                </div>
                {openSections.formules ? (
                  <CaretDown className="w-4 h-4 text-sphera-text-muted" />
                ) : (
                  <CaretRight className="w-4 h-4 text-sphera-text-muted" />
                )}
              </button>

              {openSections.formules && (
                <div className="px-4 pb-4 pt-3 border-t border-sphera-border/40 space-y-2.5">
                  {formules.map((item, idx) => {
                    const isObj = typeof item === 'object' && item !== null
                    const nom = isObj ? item.nom || '' : ''
                    const rawForm = isObj ? item.formule || item.nom || '' : String(item)
                    const expl = isObj ? item.explication || item.application || '' : ''

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-sphera-surface-2/60 border border-purple-500/25 space-y-2"
                      >
                        {nom && (
                          <div className="text-xs font-bold text-purple-300">
                            {nom}
                          </div>
                        )}
                        <div className="px-3 py-2 rounded-lg bg-sphera-surface border border-sphera-border/60 text-white overflow-x-auto">
                          <MarkdownRenderer
                            content={formatFormulaMarkdown(rawForm)}
                            className="[&_p]:my-0 [&_p]:text-sm [&_p]:font-mono [&_p]:text-purple-200"
                          />
                        </div>
                        {expl && (
                          <div className="text-xs text-white/75 leading-relaxed">
                            <MarkdownRenderer content={expl} className="[&_p]:my-0 [&_p]:text-xs [&_p]:text-white/75" />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* C. Exemples Concrets d'Application */}
          {exemples.length > 0 && (
            <div className="rounded-2xl border border-sphera-border bg-sphera-surface/80 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('exemples')}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-sphera-surface-2/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Lightning weight="duotone" className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    Exemples Concrets & Applications ({exemples.length})
                  </span>
                </div>
                {openSections.exemples ? (
                  <CaretDown className="w-4 h-4 text-sphera-text-muted" />
                ) : (
                  <CaretRight className="w-4 h-4 text-sphera-text-muted" />
                )}
              </button>

              {openSections.exemples && (
                <div className="px-4 pb-4 pt-3 border-t border-sphera-border/40 space-y-2.5">
                  {exemples.map((ex, idx) => {
                    const isObj = typeof ex === 'object' && ex !== null
                    const exTitle = isObj ? ex.titre || ex.concept || `Exemple ${idx + 1}` : `Exemple ${idx + 1}`
                    const exDesc = isObj ? ex.description || ex.exemple || '' : String(ex)
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-sky-500/5 border border-sky-500/20 space-y-1.5"
                      >
                        <div className="text-xs font-bold text-sky-300">{exTitle}</div>
                        <div className="text-xs text-white/85 leading-relaxed">
                          <MarkdownRenderer content={exDesc} className="[&_p]:my-0.5 [&_p]:text-xs [&_p]:text-white/85" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* D. Pièges d'Examen & Confusions Fréquentes */}
          {pieges.length > 0 && (
            <div className="rounded-2xl border border-amber-500/25 bg-sphera-surface/80 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('pieges')}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-sphera-surface-2/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <WarningCircle weight="duotone" className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    Pièges d'Examen & Confusions ({pieges.length})
                  </span>
                </div>
                {openSections.pieges ? (
                  <CaretDown className="w-4 h-4 text-sphera-text-muted" />
                ) : (
                  <CaretRight className="w-4 h-4 text-sphera-text-muted" />
                )}
              </button>

              {openSections.pieges && (
                <div className="px-4 pb-4 pt-3 border-t border-amber-500/15 space-y-2">
                  {pieges.map((item, idx) => {
                    const txt = typeof item === 'object' && item !== null ? item.piege || item.description || '' : String(item)
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20"
                      >
                        <WarningCircle weight="fill" className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0 text-xs text-white/85 leading-relaxed">
                          <MarkdownRenderer content={txt} className="[&_p]:my-0 [&_p]:text-xs [&_p]:text-white/85" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* E. À Retenir & Conseils pour le Partiel */}
          {aRetenir.length > 0 && (
            <div className="rounded-2xl border border-sphera-green/25 bg-sphera-surface/80 overflow-hidden">
              <button
                type="button"
                onClick={() => toggleSection('a_retenir')}
                className="flex items-center justify-between w-full px-4 py-3 text-left hover:bg-sphera-surface-2/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Lightbulb weight="duotone" className="w-4 h-4 text-sphera-green" />
                  <span className="text-xs font-semibold text-white uppercase tracking-wider">
                    À Retenir & Conseils Partiel ({aRetenir.length})
                  </span>
                </div>
                {openSections.a_retenir ? (
                  <CaretDown className="w-4 h-4 text-sphera-text-muted" />
                ) : (
                  <CaretRight className="w-4 h-4 text-sphera-text-muted" />
                )}
              </button>

              {openSections.a_retenir && (
                <div className="px-4 pb-4 pt-3 border-t border-sphera-green/15 space-y-2">
                  {aRetenir.map((conseil, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-sphera-green/5 border border-sphera-green/15"
                    >
                      <Lightbulb weight="fill" className="w-4 h-4 text-sphera-green shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 text-xs text-white/85 leading-relaxed">
                        <MarkdownRenderer content={String(conseil)} className="[&_p]:my-0 [&_p]:text-xs [&_p]:text-white/85" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 6. Auto-évaluation (Questions Types d'Examen — Active Recall) */}
      {showExam && hasExam && (
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between gap-2 pt-2">
            <div className="flex items-center gap-2">
              <Exam weight="duotone" className="w-4 h-4 text-emerald-400" />
              <h2 className="text-xs font-semibold text-white uppercase tracking-wider">
                Auto-évaluation — Questions d'Examen ({questionsExamen.length})
              </h2>
            </div>

            <button
              type="button"
              onClick={toggleRevealAllQuestions}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium text-sphera-text-muted hover:text-white bg-sphera-surface border border-sphera-border transition-colors cursor-pointer"
            >
              {allQuestionsRevealed ? <EyeSlash className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{allQuestionsRevealed ? 'Tout masquer' : 'Tout révéler'}</span>
            </button>
          </div>

          <div className="space-y-3">
            {questionsExamen.map((q, idx) => {
              const isObj = typeof q === 'object' && q !== null
              const qText = isObj ? q.question || '' : String(q)
              const qAns = isObj ? q.reponse || q.elements_reponse || '' : ''
              const isRevealed = Boolean(revealedQuestions[idx])
              const qKey = `exam_q_${idx}`
              const inlineEntry = inlineAsk.entries[qKey]

              return (
                <div
                  key={qKey}
                  className="rounded-2xl border border-sphera-border bg-sphera-surface/90 p-4 space-y-3"
                >
                  <div className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 rounded-md bg-sphera-surface-2 border border-sphera-border text-[11px] font-bold text-sphera-green shrink-0 mt-0.5">
                      Q{idx + 1}
                    </span>
                    <div className="flex-1 min-w-0 text-sm font-medium text-white leading-relaxed">
                      <MarkdownRenderer content={qText} className="[&_p]:my-0 [&_p]:font-medium [&_p]:text-white" />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-0.5">
                    {qAns && (
                      <button
                        type="button"
                        onClick={() =>
                          setRevealedQuestions((prev) => ({ ...prev, [idx]: !prev[idx] }))
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isRevealed
                            ? 'bg-sphera-surface-2 border border-sphera-border text-white/85'
                            : 'bg-sphera-green/15 border border-sphera-green/30 text-sphera-green hover:bg-sphera-green/25'
                        }`}
                      >
                        {isRevealed ? <EyeSlash className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{isRevealed ? 'Masquer la réponse' : 'Voir les éléments de réponse'}</span>
                      </button>
                    )}

                    {sessionId && (
                      <button
                        type="button"
                        onClick={() => handleExplainQuestion(qKey, qText)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-sphera-text-muted hover:text-sphera-green bg-sphera-surface-2/60 border border-sphera-border/60 hover:border-sphera-green/30 transition-colors cursor-pointer"
                      >
                        <Sparkle weight="duotone" className="w-3.5 h-3.5" />
                        <span>Approfondir</span>
                      </button>
                    )}
                  </div>

                  {isRevealed && qAns && (
                    <div className="p-3.5 rounded-xl bg-sphera-surface-2/70 border border-sphera-border/60 border-l-[3px] border-l-sphera-green space-y-1.5 animate-in fade-in duration-150">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-sphera-green">
                        Éléments de réponse attendus
                      </div>
                      <div className="text-xs text-white/90 leading-relaxed">
                        <MarkdownRenderer content={qAns} className="[&_p]:my-0.5 [&_p]:text-xs [&_p]:text-white/90" />
                      </div>
                    </div>
                  )}

                  {inlineEntry && (
                    <InlineSpheraAnswerCard
                      entry={inlineEntry}
                      onStop={() => inlineAsk.stop(qKey)}
                      onClose={() => inlineAsk.close(qKey)}
                      onRetry={() => handleExplainQuestion(qKey, qText)}
                      onSaveNote={onSaveNote}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

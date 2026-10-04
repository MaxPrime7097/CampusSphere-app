import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  Waveform,
  FileText,
  Cards,
  Question,
  Note,
  GitFork,
  BookOpen,
  Sparkle,
  FadersHorizontal,
  CaretRight,
  DotsThreeVertical,
  Trash,
  PencilSimple,
  Plus,
  X,
  ArrowsOut as Maximize2,
  ArrowsIn as Minimize2,
  PaperPlaneTilt as Send,
  Funnel,
  Spinner,
  ChatCircle,
  ClockCounterClockwise,
  At as AtSign,
  Square,
  ShareNetwork,
  ArrowLeft,
  TextB,
  TextItalic,
  TextHOne,
  TextHTwo,
  ListBullets,
  ListNumbers,
  Quotes,
  CodeSimple,
  Check,
  Eye,
  ArrowDown,
  FileCode,
  Play,
  Pause,
  Exam,
  Lightning,
} from '@phosphor-icons/react'
import { SpheraSettingsModal } from '../settings/SpheraSettingsModal'
import { MarkdownRenderer } from './MarkdownRenderer'
import { useTranslation } from 'react-i18next'
import { ChapterFicheView } from './ChapterFicheView'
import { FicheView, QuizView, FlashcardsView, MindmapView, AudioSummaryView, AnnaleView } from './ResultViews'
import { AiMessageItem } from './AiMessageItem'
import { CommandMenu, COMMANDS, type Command } from './CommandMenu'
import { QuestionSuggestions } from './QuestionSuggestions'
import { isTextEnglish } from '../../utils/detectLanguage'
import { createArtefact, type ArtefactItem, type ChatThreadItem, type ToolType } from '../../services/spheraApi'
import { usePodcastPlayer, podcastStore } from '../../utils/podcastPlayerStore'
import { GenerateScopeModal } from './GenerateScopeModal'
import { detectChaptersFromText, type DetectedChapter } from '../../utils/extractChapters'

export interface ActiveWorkspaceView {
  type: 'fiche' | 'quiz' | 'flashcards' | 'mindmap' | 'audio' | 'note' | 'annale' | 'chapitres' | 'chat'
  title: string
  artefactId?: number
}

interface StudyWorkspacePanelProps {
  sessionId?: string | number | null
  documentTitle: string
  sessionContent: any
  artefacts: ArtefactItem[]
  threads: ChatThreadItem[]
  activeThreadId?: number | null
  onSelectThread: (threadId: number) => void
  onCreateThread: (title: string) => void
  onDeleteThread?: (threadId: number) => void
  chatHistory: any[]
  isChatting: boolean
  onSendMessage: (question: string) => void
  onStopChat: () => void
  onEditMessage?: (index: number, newQuestion: string) => void
  onRegenerateResponse?: (index: number) => void
  isGeneratingTool?: boolean
  generatingToolType?: string | null
  onGenerateTool: (toolType: ToolType) => Promise<void>
  onDeleteArtefact: (id: number) => void
  onRenameArtefact: (id: number, newTitle: string) => void
  onNewNote: () => Promise<any> | void
  onSaveNote: (id: number, text: string) => void
  onGenerateChapterQuiz: (chapterTitle: string, chapterSummary: string) => void
  onGenerateChapterFlashcards: (chapterTitle: string, chapterSummary: string) => void
  onRegenerateFiche: () => void
  isRegeneratingFiche?: boolean
  isGeneratingArtefact?: boolean
  generatingChapterArtefact?: { type: 'quiz' | 'flashcards'; chapter: string } | null
  isPdfExpanded?: boolean
  onTogglePdfExpanded?: () => void
  rawAnnale?: any
  onOpenShare?: () => void
  onOpenDelete?: () => void
  onArtefactCreated?: (artefact: ArtefactItem) => void
  onCreateNoteWithContent?: (title: string, text: string) => Promise<void>
  extractedText?: string
}

export function StudyWorkspacePanel({
  sessionId,
  documentTitle,
  sessionContent,
  artefacts,
  threads,
  activeThreadId,
  onSelectThread,
  onCreateThread,
  onDeleteThread,
  chatHistory,
  isChatting,
  onSendMessage,
  onStopChat,
  onEditMessage,
  onRegenerateResponse,
  isGeneratingTool = false,
  generatingToolType = null,
  onGenerateTool,
  onDeleteArtefact,
  onRenameArtefact,
  onNewNote,
  onSaveNote,
  onGenerateChapterQuiz,
  onGenerateChapterFlashcards,
  onRegenerateFiche,
  isRegeneratingFiche = false,
  isGeneratingArtefact = false,
  generatingChapterArtefact = null,
  isPdfExpanded = false,
  onTogglePdfExpanded,
  rawAnnale,
  onOpenShare,
  onOpenDelete,
  onArtefactCreated,
  onCreateNoteWithContent,
  extractedText = '',
}: StudyWorkspacePanelProps) {
  const { t } = useTranslation('study')

  // Scope modal state for Quiz and Flashcards
  const [scopeModal, setScopeModal] = useState<{ isOpen: boolean; toolType: 'quiz' | 'flashcards' }>({
    isOpen: false,
    toolType: 'quiz',
  })

  // Synchronized chapters: sync with Résumé (fiche) if generated, otherwise extract client-side
  const detectedChapters: DetectedChapter[] = useMemo(() => {
    const ficheChapitres = sessionContent?.fiche_content?.chapitres || sessionContent?.fiche?.chapitres
    if (Array.isArray(ficheChapitres) && ficheChapitres.length > 0) {
      return ficheChapitres.map((c: any, idx: number) => ({
        id: c.id || `chap-${idx + 1}`,
        numero: c.numero ?? (idx + 1),
        titre: c.titre,
        resume: c.resume || c.titre,
      }))
    }
    return detectChaptersFromText(extractedText || sessionContent?.extracted_text || '')
  }, [sessionContent, extractedText])

  const podcast = usePodcastPlayer()

  // Pause podcast if switching to a different session
  useEffect(() => {
    if (podcast.isActive && podcast.sessionId && podcast.sessionId !== sessionId) {
      podcastStore.pause()
    }
  }, [sessionId, podcast.sessionId, podcast.isActive])

  const formatPodcastTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00'
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s < 10 ? '0' : ''}${s}`
  }

  const isAnnale = Boolean(
    rawAnnale || 
    sessionContent?.sections || 
    sessionContent?.corrections || 
    sessionContent?.mode ||
    sessionContent?.isAnnaleWorkspace ||
    artefacts.some(a => a.type === 'annale_rapide' || a.type === 'annale_complete')
  )

  const hasDirectAnnaleCorrection = Boolean(
    (sessionContent?.sections && sessionContent.sections.length > 0) ||
    (sessionContent?.corrections && sessionContent.corrections.length > 0) ||
    (rawAnnale?.sections && rawAnnale.sections.length > 0) ||
    (rawAnnale?.corrections && rawAnnale.corrections.length > 0)
  )

  // Active view: default to AnnaleView ONLY if there is already a direct correction, otherwise null (dashboard)
  const [activeView, setActiveView] = useState<ActiveWorkspaceView | null>(() =>
    isAnnale && hasDirectAnnaleCorrection ? { type: 'annale', title: "Corrigé de l'annale" } : null
  )

  const [generatingAnnaleMode, setGeneratingAnnaleMode] = useState<'rapide' | 'complete' | null>(null)

  const handleGenerateAnnale = async (mode: 'rapide' | 'complete') => {
    if (!sessionId) return
    const artType = mode === 'rapide' ? 'annale_rapide' : 'annale_complete'
    const existing = artefacts.find((a) => a.type === artType)
    if (existing) {
      setActiveView({
        type: 'annale',
        title: existing.title,
        artefactId: existing.id,
      })
      return
    }

    setGeneratingAnnaleMode(mode)
    try {
      const res = await createArtefact(sessionId, {
        type: artType,
        title: mode === 'rapide' ? 'Correction Rapide' : 'Correction Complète',
        subtitle: mode === 'rapide' ? 'Points clés & barème indicatif' : 'Résolution détaillée pas à pas',
      })
      if (res?.data) {
        setJustCreatedArtefact(res.data)
        if (onArtefactCreated) {
          onArtefactCreated(res.data)
        }
        setActiveView({
          type: 'annale',
          title: res.data.title,
          artefactId: res.data.id,
        })
        showPanelFeedback(mode === 'rapide' ? '⚡ Correction Rapide disponible !' : '📘 Correction Complète disponible !', 'success')
      }
    } catch (err: any) {
      console.error('Erreur lors de la génération de l\'annale:', err)
      showPanelFeedback('Erreur lors de la génération du corrigé.', 'error')
    } finally {
      setGeneratingAnnaleMode(null)
    }
  }

  const handleCreateNoteFromAi = async (question: string, answer: string) => {
    const cleanTitle = `Note : ${question.length > 35 ? question.slice(0, 35) + '…' : question}`
    const noteBody = `## Question\n${question}\n\n## Réponse de Sphera\n${answer}`

    if (onCreateNoteWithContent) {
      await onCreateNoteWithContent(cleanTitle, noteBody)
      return
    }

    if (!sessionId) return
    try {
      const res = await createArtefact(sessionId, {
        type: 'note',
        title: cleanTitle,
        subtitle: 'Créée depuis le Q&A',
        content: { text: noteBody },
      })
      if (res?.data && onArtefactCreated) {
        onArtefactCreated(res.data)
      }
    } catch (err: any) {
      console.error('Erreur création note depuis chat:', err)
    }
  }

  // Local floating feedback for panel actions
  const [panelFeedback, setPanelFeedback] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null)
  const feedbackTimeoutRef = useRef<any>(null)
  const [justCreatedArtefact, setJustCreatedArtefact] = useState<ArtefactItem | null>(null)

  const showPanelFeedback = (message: string, type: 'success' | 'info' | 'error' = 'success', duration = 3000) => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current)
    setPanelFeedback({ message, type })
    feedbackTimeoutRef.current = setTimeout(() => {
      setPanelFeedback(null)
    }, duration)
  }

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settingsTab, setSettingsTab] = useState<'profile' | 'generation' | 'tools' | 'quota' | 'stats' | 'appearance'>('generation')

  const handleOpenSettingsTab = (tab: 'generation' | 'tools') => {
    setSettingsTab(tab)
    setSettingsOpen(true)
  }

  // Filter in "Mes outils"
  const [activeFilter, setActiveFilter] = useState<'all' | 'fiche' | 'quiz' | 'flashcards' | 'note' | 'audio' | 'mindmap'>('all')
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  // Note editor local buffer, view mode ('preview' by default) & formatting
  const [noteText, setNoteText] = useState('')
  const [noteViewMode, setNoteViewMode] = useState<'preview' | 'edit'>('preview')
  const noteTextareaRef = useRef<HTMLTextAreaElement>(null)
  const [isSavingNoteLocal, setIsSavingNoteLocal] = useState(false)
  const [saveSuccessLocal, setSaveSuccessLocal] = useState(false)

  // Immediate Note creation and opening
  const handleNoteTileClick = async () => {
    setNoteText('')
    setNoteViewMode('edit')
    setActiveView({
      type: 'note',
      title: 'Nouvelle note',
    })
    showPanelFeedback('Nouvelle note prête pour rédaction', 'success')
    try {
      const created = await (onNewNote() as any)
      if (created?.id) {
        setJustCreatedArtefact(created)
        setActiveView((prev) => (prev?.type === 'note' && !prev.artefactId ? {
          ...prev,
          title: created.title || 'Nouvelle note',
          artefactId: created.id,
        } : prev))
      }
    } catch {
      // ignore
    }
  }

  const applyFormatting = (before: string, after = '') => {
    const textarea = noteTextareaRef.current
    if (!textarea) return
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = noteText.substring(start, end)
    const replacement = `${before}${selected || 'texte'}${after}`
    const updated = noteText.substring(0, start) + replacement + noteText.substring(end)
    setNoteText(updated)
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + (selected ? selected.length : 5))
    }, 0)
  }

  const handleSaveCurrentNote = async () => {
    if (!activeView?.artefactId) return
    setIsSavingNoteLocal(true)
    try {
      await onSaveNote(activeView.artefactId, noteText)
      setSaveSuccessLocal(true)
      showPanelFeedback('Note enregistrée avec succès !', 'success')
      setTimeout(() => setSaveSuccessLocal(false), 2000)
    } finally {
      setIsSavingNoteLocal(false)
    }
  }

  // Artefact renaming modal/state
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null)
  const [editingArtefactId, setEditingArtefactId] = useState<number | null>(null)
  const [editingTitle, setEditingTitle] = useState('')

  // Thread selector & create modal
  const [showThreadMenu, setShowThreadMenu] = useState(false)
  const [showNewThreadModal, setShowNewThreadModal] = useState(false)
  const [newThreadTitle, setNewThreadTitle] = useState('')

  // Chat input & Scroll to bottom handling
  const [chatMessage, setChatMessage] = useState('')
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [commandFilter, setCommandFilter] = useState('')
  const [commandActiveIdx, setCommandActiveIdx] = useState(0)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const mainScrollRef = useRef<HTMLDivElement>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({
        top: mainScrollRef.current.scrollHeight,
        behavior,
      })
    }
  }

  // Auto-scroll chat when history updates or when entering chat
  useEffect(() => {
    if (activeView?.type === 'chat') {
      const timer = setTimeout(() => {
        scrollToBottom('auto')
      }, 60)
      return () => clearTimeout(timer)
    }
  }, [chatHistory, activeView?.type, isChatting])

  const handleMainScroll = () => {
    if (!mainScrollRef.current || activeView?.type !== 'chat') {
      if (showScrollBottom) setShowScrollBottom(false)
      return
    }
    const { scrollTop, scrollHeight, clientHeight } = mainScrollRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    setShowScrollBottom(distanceFromBottom > 120)
  }

  // Current active thread
  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0]

  const handleOpenTool = (tool: ToolType) => {
    if (tool === 'quiz' || tool === 'flashcards') {
      const hasContent = sessionContent && sessionContent[tool]
      if (!hasContent) {
        setScopeModal({ isOpen: true, toolType: tool })
        return
      }
    }
    const hasContent = sessionContent && sessionContent[tool]
    if (hasContent) {
      const titles: Record<ToolType, string> = {
        fiche: 'Résumé du cours',
        quiz: 'Quiz interactif',
        flashcards: 'Flashcards',
        mindmap: 'Mindmap & Plan',
        audio: 'Podcast audio',
      }
      setActiveView({ type: tool, title: titles[tool] || tool })
    } else {
      onGenerateTool(tool) // generates in background, shows in "Mes outils"
    }
  }

  const handleOpenArtefact = (art: ArtefactItem) => {
    if (art.type === 'note') {
      setNoteText(art.content?.text || '')
      setNoteViewMode('preview') // Par défaut en mode visualisation comme demandé
      setActiveView({
        type: 'note',
        title: art.title,
        artefactId: art.id,
      })
      return
    }
    if (art.type === 'annale_rapide' || art.type === 'annale_complete') {
      setActiveView({
        type: 'annale',
        title: art.title,
        artefactId: art.id,
      })
      return
    }
    setActiveView({
      type: art.type as any,
      title: art.title,
      artefactId: art.id,
    })
  }

  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = chatMessage.trim()
    if (!trimmed || isChatting) return
    onSendMessage(trimmed)
    setChatMessage('')
    setShowCommandMenu(false)
    setActiveView({ type: 'chat', title: 'Q&A' }) // navigate to chat view
    setTimeout(() => scrollToBottom('smooth'), 100)
  }

  const handleChatInputChange = (val: string) => {
    setChatMessage(val)
    const match = val.match(/@([a-zA-Z0-9_-]*)$/)
    if (match) {
      setShowCommandMenu(true)
      setCommandFilter('@' + match[1])
      setCommandActiveIdx(0)
    } else if (!val.includes('@') && showCommandMenu) {
      setShowCommandMenu(false)
    }
  }

  const handleCommandSelect = (cmd: Command) => {
    setShowCommandMenu(false)
    if (cmd.category === 'tool' && cmd.toolType) {
      setChatMessage('')
      handleOpenTool(cmd.toolType as ToolType)
      return
    }
    const isDocEn = isTextEnglish(sessionContent?.extracted_text || documentTitle)
    const templateToUse = isDocEn ? (cmd.templateEn || cmd.template) : cmd.template
    if (templateToUse) {
      setChatMessage((prev) => {
        const atIdx = prev.lastIndexOf('@')
        if (atIdx !== -1) {
          return prev.slice(0, atIdx) + templateToUse
        }
        return templateToUse || ''
      })
      setTimeout(() => chatInputRef.current?.focus(), 50)
    }
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCommandMenu) {
      const search = commandFilter.replace(/^@/, '').toLowerCase().trim()
      const filtered = COMMANDS.filter((c) =>
        c.trigger.toLowerCase().includes(search) ||
        (c.aliases && c.aliases.some((a) => a.toLowerCase().includes(search))) ||
        c.label.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search)
      )
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCommandActiveIdx((i) => Math.min(i + 1, filtered.length - 1))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCommandActiveIdx((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (filtered[commandActiveIdx]) {
          handleCommandSelect(filtered[commandActiveIdx])
        }
        return
      }
      if (e.key === 'Escape') {
        setShowCommandMenu(false)
        return
      }
      return
    }
    if (e.key === 'Enter') {
      handleSendChat()
    }
  }

  const activeArtefactObj = activeView?.artefactId
    ? (artefacts.find((a) => a.id === activeView.artefactId) || (justCreatedArtefact?.id === activeView.artefactId ? justCreatedArtefact : null))
    : null

  const TOOL_META: Record<ToolType, { label: string; color: string }> = {
    audio: { label: 'Podcast', color: 'purple' },
    fiche: { label: 'Résumé', color: 'cyan' },
    flashcards: { label: 'Flashcards', color: 'orange' },
    quiz: { label: 'Quiz', color: 'rose' },
    mindmap: { label: 'Mindmap', color: 'emerald' },
  }

  const TOOL_COLORS: Record<ToolType, string> = {
    audio: '#a855f7',
    fiche: '#06b6d4', 
    flashcards: '#f97316',
    quiz: '#f43f5e',
    mindmap: '#10b981',
  }

  const generatedTools = (['fiche', 'quiz', 'flashcards', 'mindmap', 'audio'] as ToolType[]).filter(
    (t) => sessionContent && sessionContent[t] !== undefined
  )

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 bg-sphera-bg overflow-hidden relative">
      {/* ─── 1. TOP BAR ─── */}
      <div className="h-14 border-b border-sphera-border flex items-center justify-between px-4 bg-sphera-surface-2/80 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          {activeView === null ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setActiveView({ type: 'chat', title: 'Discussion Q&A' })}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-sphera-surface hover:bg-sphera-surface-2 border border-sphera-border text-sphera-green hover:border-sphera-green/40 transition-colors shadow-xs"
                title="Ouvrir le dialogue Q&A"
              >
                <ChatCircle weight="duotone" className="w-4 h-4" />
                <span>Q&A</span>
                {chatHistory.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sphera-green/20 text-sphera-green font-mono">
                    {chatHistory.length}
                  </span>
                )}
              </button>
              {onOpenShare && (
                <button type="button" onClick={onOpenShare} className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors" title="Partager">
                  <ShareNetwork className="w-4 h-4" />
                </button>
              )}
              {onOpenDelete && (
                <button type="button" onClick={onOpenDelete} className="p-1.5 rounded-lg text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Supprimer">
                  <Trash className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button type="button" onClick={() => setActiveView(null)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Retour</span>
            </button>
          )}
        </div>
        {onTogglePdfExpanded && (
          <button type="button" onClick={onTogglePdfExpanded} className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors shrink-0" title={isPdfExpanded ? 'Réduire la vue' : 'Plein écran'}>
            {isPdfExpanded ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Dynamic Panel Feedback Toast */}
      {panelFeedback && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-sphera-surface-2/95 border border-sphera-border shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 text-xs pointer-events-none">
          {panelFeedback.type === 'success' && <Check className="w-3.5 h-3.5 text-sphera-green shrink-0" />}
          {panelFeedback.type === 'info' && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
          {panelFeedback.type === 'error' && <X className="w-3.5 h-3.5 text-red-400 shrink-0" />}
          <span className="font-medium text-white">{panelFeedback.message}</span>
        </div>
      )}

      {/* ─── 2. MAIN SCROLLABLE BODY ─── */}
      <div
        ref={mainScrollRef}
        onScroll={handleMainScroll}
        className="flex-1 overflow-y-auto min-h-0 custom-scrollbar p-4 sm:p-5 relative"
      >
        {activeView === null ? (
          /* DASHBOARD VIEW: "Générer" grid + "Mes ensembles" */
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Section A: "Générer" (2-column interactive tiles) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Générer
                </span>
                <span className="text-[11px] text-sphera-text-muted">
                  Création instantanée par IA
                </span>
              </div>

              {isAnnale ? (
                /* Annale Mode: 3 Dedicated Artefacts */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* 1. Correction Rapide */}
                  <button
                    type="button"
                    onClick={() => handleGenerateAnnale('rapide')}
                    disabled={generatingAnnaleMode !== null}
                    className="flex flex-col justify-between p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2/60 hover:bg-sphera-surface-2 hover:border-amber-500/40 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <Lightning weight="duotone" className="w-4 h-4 text-amber-400" />
                      </div>
                      {generatingAnnaleMode === 'rapide' ? (
                        <Spinner className="w-4 h-4 text-amber-400 animate-spin" />
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          Express
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                        Correction Rapide
                      </p>
                      <p className="text-[11px] text-sphera-text-muted mt-0.5">
                        Points clés, réponses directes & barème indicatif
                      </p>
                    </div>
                  </button>

                  {/* 2. Correction Complète */}
                  <button
                    type="button"
                    onClick={() => handleGenerateAnnale('complete')}
                    disabled={generatingAnnaleMode !== null}
                    className="flex flex-col justify-between p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2/60 hover:bg-sphera-surface-2 hover:border-cyan-500/40 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                        <BookOpen weight="duotone" className="w-4 h-4 text-cyan-400" />
                      </div>
                      {generatingAnnaleMode === 'complete' ? (
                        <Spinner className="w-4 h-4 text-cyan-400 animate-spin" />
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                          Détaillée
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors">
                        Correction Complète
                      </p>
                      <p className="text-[11px] text-sphera-text-muted mt-0.5">
                        Résolution détaillée, méthodes, explications & pièges
                      </p>
                    </div>
                  </button>

                  {/* 3. Notes / Brouillon */}
                  <button
                    type="button"
                    onClick={handleNoteTileClick}
                    className="flex flex-col justify-between p-3.5 rounded-xl border border-sphera-border bg-sphera-surface-2/60 hover:bg-sphera-surface-2 hover:border-yellow-500/40 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full mb-2">
                      <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                        <Note weight="duotone" className="w-4 h-4 text-yellow-400" />
                      </div>
                      <Plus className="w-4 h-4 text-sphera-text-muted group-hover:text-yellow-400 transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white group-hover:text-yellow-300 transition-colors">
                        Notes & Brouillon
                      </p>
                      <p className="text-[11px] text-sphera-text-muted mt-0.5">
                        Espace personnel pour noter tes réflexions et démarches
                      </p>
                    </div>
                  </button>
                </div>
              ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Podcast */}
                <button
                  type="button"
                  onClick={() => handleOpenTool('audio')}
                  disabled={isGeneratingTool}
                  className="flex items-center justify-between p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/60 hover:bg-sphera-surface-2 hover:border-purple-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                      <Waveform weight="duotone" className="w-4 h-4 text-purple-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      Podcast
                    </span>
                  </div>
                  {generatingToolType === 'audio' ? (
                    <Spinner className="w-4 h-4 text-purple-400 animate-spin shrink-0" />
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenSettingsTab('generation')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          handleOpenSettingsTab('generation')
                        }
                      }}
                      className="p-1 rounded-lg text-sphera-text-muted hover:text-purple-400 hover:bg-sphera-surface transition-colors shrink-0"
                      title="Préférences de génération IA"
                    >
                      <FadersHorizontal className="w-4 h-4" />
                    </div>
                  )}
                </button>

                {/* 2. Résumé (Fiche) */}
                <button
                  type="button"
                  onClick={() => handleOpenTool('fiche')}
                  disabled={isGeneratingTool}
                  className="flex items-center justify-between p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/60 hover:bg-sphera-surface-2 hover:border-cyan-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                      <FileText weight="duotone" className="w-4 h-4 text-cyan-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      Résumé
                    </span>
                  </div>
                  {generatingToolType === 'fiche' ? (
                    <Spinner className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenSettingsTab('generation')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          handleOpenSettingsTab('generation')
                        }
                      }}
                      className="p-1 rounded-lg text-sphera-text-muted hover:text-cyan-400 hover:bg-sphera-surface transition-colors shrink-0"
                      title="Préférences de génération IA"
                    >
                      <FadersHorizontal className="w-4 h-4" />
                    </div>
                  )}
                </button>

                {/* 3. Flashcards */}
                <button
                  type="button"
                  onClick={() => handleOpenTool('flashcards')}
                  disabled={isGeneratingTool}
                  className="flex items-center justify-between p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/60 hover:bg-sphera-surface-2 hover:border-orange-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                      <Cards weight="duotone" className="w-4 h-4 text-orange-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      Flashcards
                    </span>
                  </div>
                  {generatingToolType === 'flashcards' ? (
                    <Spinner className="w-4 h-4 text-orange-400 animate-spin shrink-0" />
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      {sessionContent?.flashcards && (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            setScopeModal({ isOpen: true, toolType: 'flashcards' })
                          }}
                          className="p-1 rounded-lg text-sphera-text-muted hover:text-orange-400 hover:bg-sphera-surface transition-colors cursor-pointer"
                          title="Générer des flashcards par chapitre"
                        >
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenSettingsTab('tools')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                            handleOpenSettingsTab('tools')
                          }
                        }}
                        className="p-1 rounded-lg text-sphera-text-muted hover:text-orange-400 hover:bg-sphera-surface transition-colors shrink-0"
                        title="Paramètres Quiz & Flashcards"
                      >
                        <FadersHorizontal className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </button>

                {/* 4. Quiz */}
                <button
                  type="button"
                  onClick={() => handleOpenTool('quiz')}
                  disabled={isGeneratingTool}
                  className="flex items-center justify-between p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/60 hover:bg-sphera-surface-2 hover:border-rose-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <Question weight="duotone" className="w-4 h-4 text-rose-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      Quiz
                    </span>
                  </div>
                  {generatingToolType === 'quiz' ? (
                    <Spinner className="w-4 h-4 text-rose-400 animate-spin shrink-0" />
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      {sessionContent?.quiz && (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation()
                            setScopeModal({ isOpen: true, toolType: 'quiz' })
                          }}
                          className="p-1 rounded-lg text-sphera-text-muted hover:text-rose-400 hover:bg-sphera-surface transition-colors cursor-pointer"
                          title="Générer un quiz par chapitre"
                        >
                          <Plus className="w-4 h-4" />
                        </div>
                      )}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOpenSettingsTab('tools')
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation()
                            handleOpenSettingsTab('tools')
                          }
                        }}
                        className="p-1 rounded-lg text-sphera-text-muted hover:text-rose-400 hover:bg-sphera-surface transition-colors shrink-0"
                        title="Paramètres Quiz & Flashcards"
                      >
                        <FadersHorizontal className="w-4 h-4" />
                      </div>
                    </div>
                  )}
                </button>

                {/* 5. Notes */}
                <button
                  type="button"
                  onClick={handleNoteTileClick}
                  className="flex items-center justify-between p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/60 hover:bg-sphera-surface-2 hover:border-yellow-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center shrink-0">
                      <Note weight="duotone" className="w-4 h-4 text-yellow-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      Notes
                    </span>
                  </div>
                  <Plus className="w-4 h-4 text-sphera-text-muted group-hover:text-yellow-400 transition-colors shrink-0" />
                </button>

                {/* 6. Mindmap */}
                <button
                  type="button"
                  onClick={() => handleOpenTool('mindmap')}
                  disabled={isGeneratingTool}
                  className="flex items-center justify-between p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/60 hover:bg-sphera-surface-2 hover:border-emerald-500/40 transition-all text-left group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <GitFork weight="duotone" className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      Mindmap
                    </span>
                  </div>
                  {generatingToolType === 'mindmap' ? (
                    <Spinner className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />
                  ) : (
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenSettingsTab('generation')
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation()
                          handleOpenSettingsTab('generation')
                        }
                      }}
                      className="p-1 rounded-lg text-sphera-text-muted hover:text-emerald-400 hover:bg-sphera-surface transition-colors shrink-0"
                      title="Préférences de génération IA"
                    >
                      <FadersHorizontal className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>
              )}
            </div>

            {/* Section B: "Mes outils" */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Mes outils
                </span>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sphera-surface-2 text-sphera-text-muted border border-sphera-border">
                    {(activeFilter === 'all' && chatHistory.length > 0 ? 1 : 0) +
                     generatedTools.filter((t) => activeFilter === 'all' || activeFilter === t).length +
                     artefacts.filter((a) => activeFilter === 'all' || activeFilter === a.type || (activeFilter === ('annale' as any) && (a.type === 'annale_rapide' || a.type === 'annale_complete'))).length +
                     (hasDirectAnnaleCorrection && (activeFilter === 'all' || activeFilter === ('annale' as any)) ? 1 : 0) +
                     (generatingToolType && !generatedTools.includes(generatingToolType as ToolType) && (activeFilter === 'all' || activeFilter === generatingToolType) ? 1 : 0) +
                     (generatingAnnaleMode && (activeFilter === 'all' || activeFilter === ('annale' as any)) ? 1 : 0) +
                     (generatingChapterArtefact && (activeFilter === 'all' || activeFilter === generatingChapterArtefact.type) ? 1 : 0)}
                  </span>

                  {/* Filter Menu Toggle */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                      className={`p-1.5 rounded-lg border transition-colors ${
                        activeFilter !== 'all'
                          ? 'bg-sphera-green/15 text-sphera-green border-sphera-green/30'
                          : 'text-sphera-text-muted hover:text-white border-sphera-border bg-sphera-surface-2/60'
                      }`}
                      title="Filtrer mes outils"
                    >
                      <Funnel className="w-3.5 h-3.5" />
                    </button>

                    {showFilterDropdown && (
                      <div className="absolute right-0 top-full mt-1.5 w-44 p-1.5 rounded-xl border border-sphera-border bg-sphera-surface-2 shadow-2xl z-30 text-xs animate-in fade-in zoom-in-95 duration-150 space-y-0.5">
                        <div className="px-2 py-1 text-[10px] font-semibold uppercase text-sphera-text-muted tracking-wider">
                          Filtrer par type
                        </div>
                        {[
                          { id: 'all', label: 'Tous les outils' },
                          { id: 'annale', label: 'Annales & Corrigés' },
                          { id: 'fiche', label: 'Résumés de cours' },
                          { id: 'quiz', label: 'Quiz' },
                          { id: 'flashcards', label: 'Flashcards' },
                          { id: 'note', label: 'Notes personnelles' },
                          { id: 'audio', label: 'Podcasts audio' },
                          { id: 'mindmap', label: 'Mindmaps' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setActiveFilter(item.id as any)
                              setShowFilterDropdown(false)
                            }}
                            className={`flex items-center justify-between w-full px-2 py-1.5 rounded-lg text-left transition-colors ${
                              activeFilter === item.id
                                ? 'bg-sphera-surface text-sphera-green font-medium'
                                : 'text-white/80 hover:bg-sphera-surface/60 hover:text-white'
                            }`}
                          >
                            <span>{item.label}</span>
                            {activeFilter === item.id && <Check className="w-3.5 h-3.5 text-sphera-green" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Corrigé de l'annale direct item in Mes outils */}
              {hasDirectAnnaleCorrection && (activeFilter === 'all' || activeFilter === ('annale' as any)) && (
                <button
                  type="button"
                  onClick={() => setActiveView({ type: 'annale', title: "Corrigé de l'annale" })}
                  className="flex items-center gap-3 p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/60 hover:bg-sphera-surface-2 transition-all text-left w-full group mb-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0">
                    <Exam weight="duotone" className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white block truncate">Corrigé de l'annale</span>
                    <span className="text-[11px] text-sphera-text-muted">
                      Correction détaillée pas à pas & barème
                    </span>
                  </div>
                  <CaretRight className="w-4 h-4 text-sphera-text-muted group-hover:text-white transition-colors" />
                </button>
              )}

              {/* Generating Annale mode indicator */}
              {generatingAnnaleMode && (activeFilter === 'all' || activeFilter === ('annale' as any)) && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/60 w-full animate-pulse mb-2">
                  <div className="w-8 h-8 rounded-lg bg-sphera-surface flex items-center justify-center shrink-0">
                    <Spinner className="w-4 h-4 text-sphera-green animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white truncate block">
                      {generatingAnnaleMode === 'rapide' ? 'Correction Rapide' : 'Correction Complète'}
                    </span>
                    <span className="text-[11px] text-sphera-text-muted">Génération IA de l'annale en cours…</span>
                  </div>
                </div>
              )}

              {/* Discussion Q&A item in Mes outils */}
              {(activeFilter === 'all' || activeFilter === ('chat' as any)) && (
                <button
                  type="button"
                  onClick={() => setActiveView({ type: 'chat', title: 'Discussion Q&A' })}
                  className="flex items-center gap-3 p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/60 hover:bg-sphera-surface-2 hover:border-sphera-green/40 transition-all text-left w-full group mb-2 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-lg bg-sphera-green/10 border border-sphera-green/20 flex items-center justify-center shrink-0">
                    <ChatCircle weight="duotone" className="w-4 h-4 text-sphera-green" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white block truncate">Discussion Q&A</span>
                    <span className="text-[11px] text-sphera-text-muted">
                      {chatHistory.length > 0
                        ? `${chatHistory.length} message${chatHistory.length > 1 ? 's échangés' : ' échangé'}`
                        : 'Posez des questions à l\'assistant IA sur ce cours'}
                    </span>
                  </div>
                  <CaretRight className="w-4 h-4 text-sphera-text-muted group-hover:text-white transition-colors" />
                </button>
              )}

              {generatedTools
                .filter((tool) => activeFilter === 'all' || activeFilter === tool)
                .map((tool) => {
                const getToolIcon = () => {
                  switch (tool) {
                    case 'audio': return <Waveform weight="duotone" className="w-4 h-4 text-purple-400" />
                    case 'fiche': return <FileText weight="duotone" className="w-4 h-4 text-cyan-400" />
                    case 'flashcards': return <Cards weight="duotone" className="w-4 h-4 text-orange-400" />
                    case 'quiz': return <Question weight="duotone" className="w-4 h-4 text-rose-400" />
                    case 'mindmap': return <GitFork weight="duotone" className="w-4 h-4 text-emerald-400" />
                    default: return null
                  }
                }
                return (
                  <button
                    key={tool}
                    type="button"
                    onClick={() => setActiveView({ type: tool, title: TOOL_META[tool].label })}
                    className="flex items-center gap-3 p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/60 hover:bg-sphera-surface-2 transition-all text-left w-full group mb-2"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                      style={{ backgroundColor: `${TOOL_COLORS[tool]}15`, borderColor: `${TOOL_COLORS[tool]}30` }}
                    >
                      {getToolIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-white">{TOOL_META[tool].label}</span>
                    </div>
                    <CaretRight className="w-4 h-4 text-sphera-text-muted group-hover:text-white transition-colors" />
                  </button>
                )
              })}

              {generatingToolType && !generatedTools.includes(generatingToolType as ToolType) && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/60 w-full animate-pulse mb-2">
                  <div className="w-8 h-8 rounded-lg bg-sphera-surface flex items-center justify-center shrink-0">
                    <Spinner className="w-4 h-4 text-sphera-green animate-spin" />
                  </div>
                  <span className="text-sm text-sphera-text-muted">Génération en cours…</span>
                </div>
              )}

              {generatingChapterArtefact && (activeFilter === 'all' || activeFilter === generatingChapterArtefact.type) && (
                <div className="flex items-center gap-3 p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/60 w-full animate-pulse mb-2">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{
                      backgroundColor: generatingChapterArtefact.type === 'quiz' ? '#f43f5e15' : '#f9731615',
                      borderColor: generatingChapterArtefact.type === 'quiz' ? '#f43f5e30' : '#f9731630',
                    }}
                  >
                    <Spinner className="w-4 h-4 text-sphera-green animate-spin" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-white truncate block">
                      {generatingChapterArtefact.type === 'quiz' ? 'Quiz' : 'Flashcards'} - {generatingChapterArtefact.chapter}
                    </span>
                    <span className="text-[11px] text-sphera-text-muted">Création en cours…</span>
                  </div>
                </div>
              )}

              {artefacts.filter((art) => activeFilter === 'all' || activeFilter === art.type || (activeFilter === ('annale' as any) && (art.type === 'annale_rapide' || art.type === 'annale_complete'))).length === 0 && 
               generatedTools.filter((t) => activeFilter === 'all' || activeFilter === t).length === 0 && 
               (!hasDirectAnnaleCorrection || (activeFilter !== 'all' && activeFilter !== ('annale' as any))) &&
               (!generatingToolType || (activeFilter !== 'all' && activeFilter !== generatingToolType)) && 
               (!generatingAnnaleMode || (activeFilter !== 'all' && activeFilter !== ('annale' as any))) && 
               (!generatingChapterArtefact || (activeFilter !== 'all' && activeFilter !== generatingChapterArtefact.type)) &&
               (activeFilter !== 'all' || chatHistory.length === 0) ? (
                <div className="p-6 rounded-2xl border border-dashed border-sphera-border bg-sphera-surface/40 text-center">
                  <p className="text-xs text-sphera-text-muted">
                    Aucun ensemble correspondant pour l'instant.
                  </p>
                  <p className="text-[11px] text-sphera-text-muted/70 mt-1">
                    Clique sur un outil ci-dessus pour générer un corrigé d'annale, un quiz ou tes notes.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {artefacts
                    .filter((art) => activeFilter === 'all' || activeFilter === art.type || (activeFilter === ('annale' as any) && (art.type === 'annale_rapide' || art.type === 'annale_complete')))
                    .map((art) => {
                    const getIcon = () => {
                      switch (art.type) {
                        case 'quiz':
                          return <Question weight="duotone" className="w-4 h-4 text-rose-400" />
                        case 'flashcards':
                          return <Cards weight="duotone" className="w-4 h-4 text-orange-400" />
                        case 'audio':
                          return <Waveform weight="duotone" className="w-4 h-4 text-purple-400" />
                        case 'mindmap':
                          return <GitFork weight="duotone" className="w-4 h-4 text-emerald-400" />
                        case 'note':
                          return <Note weight="duotone" className="w-4 h-4 text-yellow-400" />
                        case 'annale_rapide':
                          return <Lightning weight="duotone" className="w-4 h-4 text-amber-400" />
                        case 'annale_complete':
                          return <BookOpen weight="duotone" className="w-4 h-4 text-cyan-400" />
                        default:
                          return <FileText weight="duotone" className="w-4 h-4 text-cyan-400" />
                      }
                    }

                    const getBadgeBg = () => {
                      switch (art.type) {
                        case 'quiz':
                          return 'bg-rose-500/10 border-rose-500/20'
                        case 'flashcards':
                          return 'bg-orange-500/10 border-orange-500/20'
                        case 'audio':
                          return 'bg-purple-500/10 border-purple-500/20'
                        case 'mindmap':
                          return 'bg-emerald-500/10 border-emerald-500/20'
                        case 'note':
                          return 'bg-yellow-500/10 border-yellow-500/20'
                        case 'annale_rapide':
                          return 'bg-amber-500/10 border-amber-500/20'
                        case 'annale_complete':
                          return 'bg-cyan-500/10 border-cyan-500/20'
                        default:
                          return 'bg-cyan-500/10 border-cyan-500/20'
                      }
                    }

                    return (
                      <div
                        key={art.id}
                        onClick={() => handleOpenArtefact(art)}
                        className="group relative flex items-center justify-between p-3 rounded-xl border border-sphera-border bg-sphera-surface-2/50 hover:bg-sphera-surface-2 hover:border-sphera-border/90 transition-all cursor-pointer shadow-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${getBadgeBg()}`}
                          >
                            {getIcon()}
                          </div>

                          <div className="min-w-0 flex-1">
                            {editingArtefactId === art.id ? (
                              <input
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onBlur={() => {
                                  if (editingTitle.trim() && editingTitle.trim() !== art.title) {
                                    onRenameArtefact(art.id, editingTitle.trim())
                                    showPanelFeedback('Outil renommé avec succès !', 'success')
                                  }
                                  setEditingArtefactId(null)
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    if (editingTitle.trim() && editingTitle.trim() !== art.title) {
                                      onRenameArtefact(art.id, editingTitle.trim())
                                      showPanelFeedback('Outil renommé avec succès !', 'success')
                                    }
                                    setEditingArtefactId(null)
                                  } else if (e.key === 'Escape') {
                                    setEditingArtefactId(null)
                                  }
                                }}
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                                className="w-full text-xs bg-sphera-surface border border-sphera-green rounded px-2 py-1 text-white focus:outline-none"
                              />
                            ) : (
                              <>
                                <p className="text-xs sm:text-sm font-semibold text-white truncate">
                                  {art.title}
                                </p>
                                <p className="text-[11px] text-sphera-text-muted truncate mt-0.5">
                                  {art.subtitle || (art.targetChapter ? `Chapitre: ${art.targetChapter}` : 'Généré par Sphera')}
                                </p>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Three dots menu */}
                        <div className="relative shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setMenuOpenId(menuOpenId === art.id ? null : art.id)
                            }}
                            className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors opacity-70 group-hover:opacity-100"
                          >
                            <DotsThreeVertical weight="bold" className="w-4 h-4" />
                          </button>

                          {menuOpenId === art.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-full mt-1 w-32 p-1 rounded-xl border border-sphera-border bg-sphera-surface-2 shadow-2xl z-30 text-xs animate-in fade-in zoom-in-95 duration-150"
                            >
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setMenuOpenId(null)
                                  setEditingArtefactId(art.id)
                                  setEditingTitle(art.title)
                                }}
                                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-white/90 hover:bg-sphera-surface transition-colors"
                              >
                                <PencilSimple className="w-3.5 h-3.5" />
                                <span>Renommer</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setMenuOpenId(null)
                                  onDeleteArtefact(art.id)
                                  showPanelFeedback('Outil supprimé avec succès.', 'info')
                                }}
                                className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-left text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash className="w-3.5 h-3.5" />
                                <span>Supprimer</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

          </div>
        ) : (
          /* ACTIVE ITEM VIEW: Full content of the opened tool/artefact */
          <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
            {activeView.type === 'note' && (
              <div className="space-y-4">
                {/* Note Header */}
                <div className="flex items-center justify-between pb-3 border-b border-sphera-border">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center">
                      <Note weight="duotone" className="w-4 h-4 text-yellow-400" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">{activeView.title}</h2>
                      <div className="flex items-center gap-2 text-[11px] text-sphera-text-muted mt-0.5">
                        <span>{noteText.trim() ? noteText.trim().split(/\s+/).length : 0} mots</span>
                        <span>•</span>
                        <span>{noteText.length} caractères</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Mode toggle: Aperçu (Eye) vs Markdown (MD) */}
                    <div className="flex items-center p-0.5 rounded-lg bg-sphera-surface border border-sphera-border text-xs">
                      <button
                        type="button"
                        onClick={() => setNoteViewMode('preview')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                          noteViewMode === 'preview'
                            ? 'bg-sphera-surface-2 text-white font-medium shadow-xs'
                            : 'text-sphera-text-muted hover:text-white'
                        }`}
                        title="Mode visualisation (Aperçu formaté)"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Aperçu</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNoteViewMode('edit')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-colors ${
                          noteViewMode === 'edit'
                            ? 'bg-sphera-surface-2 text-white font-medium shadow-xs'
                            : 'text-sphera-text-muted hover:text-white'
                        }`}
                        title="Mode édition Markdown"
                      >
                        <FileCode className="w-3.5 h-3.5" />
                        <span>MD</span>
                      </button>
                    </div>

                    {saveSuccessLocal && (
                      <span className="flex items-center gap-1 text-xs text-sphera-green font-medium animate-in fade-in">
                        <Check className="w-3.5 h-3.5" />
                        <span>Enregistré</span>
                      </span>
                    )}
                    <button
                      type="button"
                      disabled={isSavingNoteLocal || !activeView.artefactId}
                      onClick={handleSaveCurrentNote}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sphera-green text-black font-semibold text-xs rounded-lg hover:bg-green-400 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {isSavingNoteLocal && <Spinner className="w-3.5 h-3.5 animate-spin" />}
                      <span>{isSavingNoteLocal ? 'Enregistrement…' : 'Enregistrer'}</span>
                    </button>
                  </div>
                </div>

                {noteViewMode === 'preview' ? (
                  /* Formatted Preview Mode (Default) */
                  <div 
                    onClick={() => setNoteViewMode('edit')}
                    className="w-full min-h-[420px] p-6 rounded-xl border border-sphera-border bg-sphera-surface-2/40 text-white cursor-text hover:border-sphera-border/90 transition-all select-text"
                    title="Cliquez pour basculer en mode édition Markdown"
                  >
                    {noteText.trim() ? (
                      <MarkdownRenderer content={noteText} className="text-white/95 leading-relaxed text-sm" />
                    ) : (
                      <div className="flex flex-col items-center justify-center py-20 text-center text-sphera-text-muted">
                        <Note weight="duotone" className="w-10 h-10 opacity-30 mb-2.5 text-yellow-400" />
                        <p className="text-xs font-medium text-white/80">Cette note est vide pour le moment.</p>
                        <p className="text-[11px] text-sphera-green mt-1 font-semibold">
                          Cliquez ici ou passez en mode MD pour rédiger.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Markdown Edit Mode */
                  <>
                    {/* Editor Toolbar */}
                    <div className="flex items-center gap-1 p-1.5 rounded-xl border border-sphera-border bg-sphera-surface-2/70 overflow-x-auto">
                      <button
                        type="button"
                        onClick={() => applyFormatting('# ')}
                        className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                        title="Titre 1"
                      >
                        <TextHOne className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('## ')}
                        className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                        title="Titre 2"
                      >
                        <TextHTwo className="w-4 h-4" />
                      </button>
                      <div className="w-[1px] h-4 bg-sphera-border mx-1 shrink-0" />
                      <button
                        type="button"
                        onClick={() => applyFormatting('**', '**')}
                        className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                        title="Gras"
                      >
                        <TextB className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('*', '*')}
                        className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                        title="Italique"
                      >
                        <TextItalic className="w-4 h-4" />
                      </button>
                      <div className="w-[1px] h-4 bg-sphera-border mx-1 shrink-0" />
                      <button
                        type="button"
                        onClick={() => applyFormatting('- ')}
                        className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                        title="Liste à puces"
                      >
                        <ListBullets className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('1. ')}
                        className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                        title="Liste numérotée"
                      >
                        <ListNumbers className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('> ')}
                        className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                        title="Citation"
                      >
                        <Quotes className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => applyFormatting('`', '`')}
                        className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                        title="Code en ligne"
                      >
                        <CodeSimple className="w-4 h-4" />
                      </button>
                      <div className="w-[1px] h-4 bg-sphera-border mx-1 shrink-0" />
                      <button
                        type="button"
                        onClick={() => applyFormatting('\n---\n')}
                        className="px-2 py-1 rounded-lg text-[11px] font-mono text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                        title="Ligne horizontale"
                      >
                        ---
                      </button>
                    </div>

                    {/* Editor Textarea */}
                    <textarea
                      ref={noteTextareaRef}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Écris tes remarques, formules, questions ou résumés personnels ici..."
                      className="w-full h-[420px] p-4 rounded-xl border border-sphera-border bg-sphera-surface text-sm text-white focus:outline-none focus:border-sphera-green resize-y font-mono leading-relaxed"
                    />
                  </>
                )}
              </div>
            )}

            {activeView.type === 'fiche' && (
              (sessionContent?.fiche_content || sessionContent?.fiche) ? (
                <ChapterFicheView
                  fiche={sessionContent?.fiche_content || sessionContent?.fiche}
                  onGenerateChapterQuiz={onGenerateChapterQuiz}
                  onGenerateChapterFlashcards={onGenerateChapterFlashcards}
                  onRegenerateFiche={onRegenerateFiche}
                  isRegenerating={isRegeneratingFiche}
                  isGeneratingItem={isGeneratingArtefact}
                  generatingChapterArtefact={generatingChapterArtefact}
                />
              ) : (
                <FicheView content={sessionContent?.fiche} />
              )
            )}

            {activeView.type === 'quiz' && (
              <QuizView
                content={
                  activeArtefactObj?.content || sessionContent?.quiz
                }
                sessionId={sessionId}
                artefactId={activeView.artefactId}
                onPause={() => setActiveView(null)}
                onAskQuestion={(prompt) => {
                  onSendMessage(prompt)
                  setActiveView({ type: 'chat', title: 'Discussion Q&A' })
                }}
              />
            )}

            {activeView.type === 'flashcards' && (
              <FlashcardsView
                content={
                  activeArtefactObj?.content || sessionContent?.flashcards
                }
                sessionId={sessionId}
                artefactId={activeView.artefactId}
                onPause={() => setActiveView(null)}
                onAskQuestion={(prompt) => {
                  onSendMessage(prompt)
                  setActiveView({ type: 'chat', title: 'Discussion Q&A' })
                }}
              />
            )}

            {activeView.type === 'mindmap' && (
              <MindmapView
                content={
                  activeArtefactObj?.content || sessionContent?.mindmap || sessionContent
                }
              />
            )}

            {activeView.type === 'audio' && (
              <AudioSummaryView
                content={
                  activeArtefactObj?.content || sessionContent?.audio || sessionContent
                }
                sessionId={sessionId}
              />
            )}

            {activeView.type === 'annale' && (activeArtefactObj?.content || rawAnnale || sessionContent) && (
              <AnnaleView
                annale={
                  activeArtefactObj
                    ? {
                        ...(typeof activeArtefactObj.content === 'object' ? activeArtefactObj.content : {}),
                        mode: activeArtefactObj.type === 'annale_rapide' ? 'rapide' : (activeArtefactObj.content?.mode || (activeArtefactObj.type === 'annale_complete' ? 'complete' : undefined)),
                        type: activeArtefactObj.type,
                      }
                    : rawAnnale || sessionContent
                }
                onAskQuestion={(prompt) => {
                  setActiveView({ type: 'chat', title: 'Discussion Q&A' })
                  onSendMessage(prompt)
                }}
              />
            )}

            {activeView.type === 'chat' && (
              <div className="flex flex-col gap-3 pb-6">
                {chatHistory.length === 0 ? (
                  <div className="text-center p-12 bg-sphera-surface-2 rounded-2xl border border-sphera-border">
                    <ChatCircle className="w-10 h-10 text-sphera-text-muted mx-auto mb-4 opacity-50" />
                    <p className="text-white font-medium mb-1">Posez vos questions</p>
                    <p className="text-sm text-sphera-text-muted">L'assistant IA répondra en se basant sur votre document</p>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <AiMessageItem
                      key={i}
                      index={i}
                      question={msg.question}
                      answer={msg.answer}
                      onEdit={onEditMessage || (() => {})}
                      onRegenerate={onRegenerateResponse || (() => {})}
                      onCreateNote={handleCreateNoteFromAi}
                      disabled={isChatting}
                    />
                  ))
                )}
                {/* Floating scroll to bottom button */}
                {showScrollBottom && (
                  <div className="sticky bottom-2 flex justify-center z-20 pointer-events-none pb-1">
                    <button
                      type="button"
                      onClick={() => scrollToBottom('smooth')}
                      className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sphera-surface-2/95 border border-sphera-border text-white text-xs font-medium shadow-2xl hover:border-sphera-green/50 hover:bg-sphera-surface backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 transition-all cursor-pointer"
                      title="Revenir aux derniers messages"
                    >
                      <ArrowDown className="w-3.5 h-3.5 text-sphera-green" />
                      <span>Derniers messages</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 3. BOTTOM Q&A CHAT INPUT ─── */}
      <div className="shrink-0 w-full bg-sphera-surface-2/95 border-t border-sphera-border px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-3 z-30 backdrop-blur-md">
        {/* Question suggestions */}
        {sessionId && (
          <div className="max-w-3xl mx-auto mb-2">
            <QuestionSuggestions
              sessionId={sessionId}
              askedQuestions={chatHistory.map((m) => m.question)}
              onSelect={(q) => {
                setChatMessage(q)
                chatInputRef.current?.focus()
              }}
            />
          </div>
        )}

        {/* Persistent Podcast Mini-Widget */}
        {podcast.isActive && podcast.sessionId === sessionId && activeView?.type !== 'audio' && (
          <div className="max-w-3xl mx-auto mb-2.5">
            <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-sphera-surface/90 border border-sphera-border shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Left: Animated Icon + Title (clickable to return to podcast view) */}
              <button
                type="button"
                onClick={() => setActiveView({ type: 'audio', title: podcast.title || 'Podcast' })}
                className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity group cursor-pointer"
                title="Ouvrir le podcast"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                  {podcast.isPlaying ? (
                    <div className="flex items-center gap-0.5 h-3.5">
                      <span className="w-0.5 h-full bg-purple-400 rounded-full animate-pulse" />
                      <span className="w-0.5 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <span className="w-0.5 h-3 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </div>
                  ) : (
                    <Waveform className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">Podcast en cours</span>
                    <span className="text-[10px] text-sphera-text-muted">•</span>
                    <span className="text-[10px] text-sphera-text-muted font-mono">
                      {podcast.audioUrl
                        ? `${formatPodcastTime(podcast.currentTime)} / ${formatPodcastTime(podcast.duration)}`
                        : `${podcast.currentTime} / ${podcast.duration || 0} répliques`}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-white truncate max-w-[200px] sm:max-w-md group-hover:text-purple-300 transition-colors">
                    {podcast.title}
                  </p>
                </div>
              </button>

              {/* Right: Controls (Play/Pause & Close) */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => podcastStore.togglePlay()}
                  className="w-7 h-7 rounded-full bg-purple-500 text-black flex items-center justify-center shadow-md hover:brightness-110 active:scale-95 transition-all cursor-pointer"
                  title={podcast.isPlaying ? 'Mettre en pause' : 'Reprendre'}
                >
                  {podcast.isPlaying ? <Pause weight="fill" className="w-3.5 h-3.5" /> : <Play weight="fill" className="w-3.5 h-3.5 ml-0.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => podcastStore.close()}
                  className="p-1 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors cursor-pointer"
                  title="Fermer le lecteur"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Input box */}
        <div className="max-w-3xl mx-auto relative">
          <CommandMenu
            isVisible={showCommandMenu}
            filter={commandFilter}
            activeIndex={commandActiveIdx}
            isEnglish={isTextEnglish(sessionContent?.extracted_text || documentTitle)}
            onSelect={handleCommandSelect}
            onClose={() => setShowCommandMenu(false)}
          />

          <div className="flex items-center gap-2 bg-sphera-surface border border-sphera-border rounded-full p-1.5 pl-3 sm:pl-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] focus-within:border-sphera-green/50 transition-colors">
            <button
              type="button"
              onClick={() => {
                if (showCommandMenu) {
                  setShowCommandMenu(false)
                } else {
                  setShowCommandMenu(true)
                  setCommandFilter('')
                  setCommandActiveIdx(0)
                  chatInputRef.current?.focus()
                }
              }}
              title="Commandes rapides (@)"
              className={`p-1.5 rounded-full transition-colors shrink-0 ${
                showCommandMenu
                  ? 'bg-sphera-green text-black'
                  : 'text-sphera-text-muted hover:text-sphera-green hover:bg-sphera-surface-2'
              }`}
            >
              <AtSign className="w-4 h-4" />
            </button>
            <input
              ref={chatInputRef}
              type="text"
              placeholder="Demandez n'importe quoi..."
              value={chatMessage}
              onChange={(e) => handleChatInputChange(e.target.value)}
              onKeyDown={handleChatKeyDown}
              disabled={isChatting}
              className="flex-1 min-w-0 bg-transparent border-none text-sm text-white placeholder-sphera-text-muted outline-none focus:ring-0"
            />
            {isChatting ? (
              <button
                type="button"
                onClick={onStopChat}
                title="Arrêter la réponse"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center transition-all flex-shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-in fade-in"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendChat()}
                disabled={!chatMessage.trim()}
                title="Envoyer la question"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sphera-green text-black flex items-center justify-center hover:bg-green-400 disabled:opacity-50 disabled:hover:bg-sphera-green transition-colors flex-shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                <Send weight="fill" className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* New thread modal */}
      {showNewThreadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-sphera-border bg-sphera-surface-2 p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <ChatCircle weight="duotone" className="w-5 h-5 text-sphera-green" />
              <h3 className="text-sm font-semibold text-white">Nouveau sujet de discussion</h3>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (newThreadTitle.trim()) {
                  onCreateThread(newThreadTitle.trim())
                  setNewThreadTitle('')
                  setShowNewThreadModal(false)
                }
              }}
              className="space-y-3"
            >
              <input
                type="text"
                value={newThreadTitle}
                onChange={(e) => setNewThreadTitle(e.target.value)}
                placeholder="Ex: Questions Chapitre 1, Formules..."
                autoFocus
                className="w-full px-3 py-2 text-xs rounded-xl border border-sphera-border bg-sphera-surface text-white placeholder:text-sphera-text-muted focus:outline-none focus:border-sphera-green"
              />
              <div className="flex items-center justify-end gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setShowNewThreadModal(false)}
                  className="px-3 py-1.5 rounded-lg text-sphera-text-muted hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={!newThreadTitle.trim()}
                  className="px-3 py-1.5 rounded-lg bg-sphera-green text-black font-semibold hover:bg-green-400 disabled:opacity-50 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sphera Settings Modal directly reachable from tile settings icons */}
      <SpheraSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialTab={settingsTab}
      />

      {/* Scope Modal for Quiz & Flashcards */}
      <GenerateScopeModal
        isOpen={scopeModal.isOpen}
        onClose={() => setScopeModal((prev) => ({ ...prev, isOpen: false }))}
        toolType={scopeModal.toolType}
        chapters={detectedChapters}
        onGenerateFull={() => {
          onGenerateTool(scopeModal.toolType)
          showPanelFeedback(
            scopeModal.toolType === 'quiz'
              ? 'Génération du Quiz complet lancée !'
              : 'Génération des Flashcards complètes lancée !',
            'info'
          )
        }}
        onGenerateChapter={(chapterTitle, chapterSummary) => {
          if (scopeModal.toolType === 'quiz') {
            onGenerateChapterQuiz(chapterTitle, chapterSummary)
          } else {
            onGenerateChapterFlashcards(chapterTitle, chapterSummary)
          }
        }}
        isGenerating={isGeneratingTool || isGeneratingArtefact}
      />
    </div>
  )
}

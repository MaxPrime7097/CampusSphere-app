import { parseSlugId, encodeHashId } from "../lib/hashids";
import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSession, getAnnale, askQuestion, deleteSession, deleteAnnale, shareSession, shareAnnale, updateSessionText, addToolToSession, createFromSelection, createArtefact, updateArtefact, deleteArtefact, regenerateFiche, getChatThreads, createChatThread, sendThreadMessage, deleteChatThread, type ArtefactItem, type ChatThreadItem, API_BASE, type ToolType } from '../services/spheraApi'
import { StudyWorkspacePanel } from '../components/app/StudyWorkspacePanel'
import { QuotaIndicator } from '../components/app/QuotaIndicator'
import { normalizeAiResponse } from '../utils/normalizeAiResponse'
import { FileText, ArrowLeft, ArrowsOut as Maximize2, ArrowsIn as Minimize2, PaperPlaneTilt as Send, Square, ChatCircle as MessageSquare, Robot as Bot, User, Columns, ShareNetwork as Share2, Trash as Trash2, Check, At as AtSign, Plus, Spinner as Loader2, WarningCircle as AlertCircle, Sparkle as Sparkles, GitFork, BookOpen } from "@phosphor-icons/react";
import { FicheView, QuizView, FlashcardsView, AnnaleView, MindmapView, AudioSummaryView } from '../components/app/ResultViews'
import { ShareModal } from '../components/app/ShareModal'
import { DeleteConfirmModal } from '../components/app/DeleteConfirmModal'
import { CourseTextReader } from '../components/app/CourseTextReader'
import { DocumentImageViewer } from '../components/app/DocumentImageViewer'
import { CommandMenu, COMMANDS, type Command } from '../components/app/CommandMenu'
import { QuestionSuggestions } from '../components/app/QuestionSuggestions'
import { AiMessageItem } from '../components/app/AiMessageItem'
import { TextSelectionToolbar, type SelectionActionType } from '../components/app/TextSelectionToolbar'
import { isTextEnglish } from '../utils/detectLanguage'
import { getCached, setCached, getOngoingGenerations, addOngoingGeneration, removeOngoingGeneration } from '../utils/sessionCache'
import { useSessionDetailQuery, invalidateSessionDetail, updateSessionDetailCache } from '../hooks/useSpheraQueries'

export default function SessionDetail({ type = 'session' }: { type?: 'session' | 'annale' }) {
  const { t } = useTranslation('study')
  const { id: rawId } = useParams<{ id: string }>();
  const parsedId = parseSlugId(rawId);
  const id = parsedId ? String(parsedId) : rawId;
  const navigate = useNavigate()

  const { data: sessionData, isLoading: queryLoading } = useSessionDetailQuery(id, type)
  const [session, setSession] = useState<any>(() => sessionData || (id ? getCached(`session_detail_${id}`) : null))
  const loading = queryLoading && !session

  // Pré-remplacement immédiat de l'URL si elle contient un ID numérique brut (ex: /sessions/123)
  // pour éviter tout flash d'ID numérique dans la barre d'adresse avant le chargement des données
  React.useLayoutEffect(() => {
    if (rawId && /^\d+$/.test(rawId)) {
      const hash = encodeHashId(Number(rawId));
      if (hash && typeof window !== "undefined" && window.history.replaceState) {
        const canonicalBase = `/${type === "annale" ? "annales" : "sessions"}/${hash}`;
        if (window.location.pathname !== canonicalBase) {
          window.history.replaceState(null, "", canonicalBase);
        }
      }
    }
  }, [rawId, type]);

  const [activeTab, setActiveTab] = useState<string>('')

  const [isGeneratingTool, setIsGeneratingTool] = useState(false)
  const [generatingToolType, setGeneratingToolType] = useState<string | null>(null)
  const [toolError, setToolError] = useState<string | null>(null)

  // Workspace State
  const [isPdfExpanded, setIsPdfExpanded] = useState(true)
  const [docViewMode, setDocViewMode] = useState<'doc' | 'text'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 'text'
    }
    return 'doc'
  })
  const [mobileActiveView, setMobileActiveView] = useState<'doc' | 'workspace'>('workspace')
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>(() => {
    const s = sessionData || (id ? getCached(`session_detail_${id}`) : null)
    return Array.isArray(s?.qa_history) ? s.qa_history : []
  })
  const [isChatting, setIsChatting] = useState(false)

  // Artefacts & Threads
  const [artefacts, setArtefacts] = useState<ArtefactItem[]>(() => {
    const s = sessionData || (id ? getCached(`session_detail_${id}`) : null)
    return Array.isArray(s?.artefacts) ? s.artefacts : []
  })
  const [threads, setThreads] = useState<ChatThreadItem[]>(() => {
    const s = sessionData || (id ? getCached(`session_detail_${id}`) : null)
    return Array.isArray(s?.chat_threads) ? s.chat_threads : []
  })
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null)
  const [isRegeneratingFiche, setIsRegeneratingFiche] = useState(false)
  const [isGeneratingArtefact, setIsGeneratingArtefact] = useState(false)

  // Command Menu State
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [commandFilter, setCommandFilter] = useState('')
  const [commandActiveIdx, setCommandActiveIdx] = useState(0)
  const chatInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
  const [showCopied, setShowCopied] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectionToolbar, setSelectionToolbar] = useState<{ coords: { x: number; y: number }; text: string } | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'loading' | 'success' | 'error' } | null>(null)
  const [generatingChapterArtefact, setGeneratingChapterArtefact] = useState<{ type: 'quiz' | 'flashcards'; chapter: string } | null>(null)

  const showFeedback = (message: string, type: 'loading' | 'success' | 'error', duration = 3500) => {
    setActionFeedback({ message, type })
    if (type !== 'loading') {
      setTimeout(() => {
        setActionFeedback((prev) => (prev?.message === message ? null : prev))
      }, duration)
    }
  }

  const handleWorkspaceSelection = () => {
    setTimeout(() => {
      const selection = window.getSelection()
      const selected = selection?.toString().trim()
      if (selected && selected.length >= 3) {
        try {
          const range = selection?.getRangeAt(0)
          const rect = range?.getBoundingClientRect()
          if (rect && (rect.width > 0 || rect.height > 0)) {
            setSelectionToolbar({
              coords: { x: rect.left + rect.width / 2, y: rect.top },
              text: selected,
            })
            return
          }
        } catch {
          // ignore
        }
      }
      setSelectionToolbar(null)
    }, 10)
  }

  const handleToolbarAction = (action: SelectionActionType, selectedText: string) => {
    setSelectionToolbar(null)
    window.getSelection()?.removeAllRanges()
    handleSelectionAction(action, selectedText)
  }

  const handleAddTool = async (tool: ToolType) => {
    if (!session?.id) return
    setIsGeneratingTool(true)
    setGeneratingToolType(tool)
    setToolError(null)
    addOngoingGeneration(session.id, tool)
    try {
      const res = await addToolToSession(session.id, tool)
      const payload = res.data
      setSession(payload)
      setCached(`session_detail_${session.id}`, payload)
      invalidateSessionDetail(session.id, type)
      setActiveTab(tool)
      removeOngoingGeneration(session.id, tool)
      showFeedback(`✨ Outil généré avec succès !`, 'success')
    } catch (e: any) {
      removeOngoingGeneration(session.id, tool)
      setToolError(e.message || t('sessionDetail.generateToolError', { tool: TOOL_LABELS[tool] || tool }))
    } finally {
      setIsGeneratingTool(false)
      setGeneratingToolType(null)
    }
  }

  // Artefact & Thread handlers for StudyWorkspacePanel
  const handleDeleteArtefact = async (artId: number) => {
    const backup = artefacts
    setArtefacts(prev => prev.filter(a => a.id !== artId))
    showFeedback('Outil supprimé avec succès.', 'success')
    try {
      await deleteArtefact(artId)
    } catch (e: any) {
      setArtefacts(backup)
      showFeedback(e?.message || "Erreur lors de la suppression de l'outil.", 'error')
    }
  }

  const handleRenameArtefact = async (artId: number, newTitle: string) => {
    const backup = artefacts
    setArtefacts(prev => prev.map(a => a.id === artId ? { ...a, title: newTitle } : a))
    showFeedback('Outil renommé avec succès.', 'success')
    try {
      await updateArtefact(artId, { title: newTitle })
    } catch (e: any) {
      setArtefacts(backup)
      showFeedback(e?.message || 'Erreur lors du renommage.', 'error')
    }
  }

  const handleNewNote = async () => {
    if (!id) return
    try {
      const res = await createArtefact(id, {
        type: 'note',
        title: `Note #${artefacts.filter(a => a.type === 'note').length + 1}`,
        subtitle: 'Note personnelle',
        content: { text: '' },
      })
      setArtefacts(prev => [res.data, ...prev])
      showFeedback('Nouvelle note créée.', 'success')
      return res.data
    } catch (e: any) {
      showFeedback(e?.message || 'Erreur lors de la création de la note.', 'error')
    }
  }

  const handleSaveNote = async (artId: number, text: string) => {
    try {
      await updateArtefact(artId, { content: { text } })
      setArtefacts(prev => prev.map(a => a.id === artId ? { ...a, content: { text } } : a))
      showFeedback('Note enregistrée.', 'success')
    } catch (e: any) {
      showFeedback(e?.message || "Erreur lors de l'enregistrement de la note.", 'error')
    }
  }

  const handleGenerateChapterQuiz = async (chapterTitle: string, chapterSummary: string) => {
    if (!id) return
    setIsGeneratingArtefact(true)
    setGeneratingChapterArtefact({ type: 'quiz', chapter: chapterTitle })
    showFeedback(`Création du quiz pour "${chapterTitle}" en cours (0.5 gén)...`, 'loading')
    try {
      const res = await createArtefact(id, {
        type: 'quiz',
        title: `Quiz - ${chapterTitle}`,
        subtitle: `Quiz ciblé • ${chapterTitle}`,
        target_chapter: chapterTitle,
        selection_text: chapterSummary,
      })
      setArtefacts(prev => [res.data, ...prev])
      showFeedback(`Le quiz pour "${chapterTitle}" est disponible dans Mes outils !`, 'success', 4000)
    } catch (e: any) {
      showFeedback(e?.message || 'Erreur lors de la génération du quiz par chapitre.', 'error')
    } finally {
      setIsGeneratingArtefact(false)
      setGeneratingChapterArtefact(null)
    }
  }

  const handleGenerateChapterFlashcards = async (chapterTitle: string, chapterSummary: string) => {
    if (!id) return
    setIsGeneratingArtefact(true)
    setGeneratingChapterArtefact({ type: 'flashcards', chapter: chapterTitle })
    showFeedback(`Création des flashcards pour "${chapterTitle}" en cours (0.5 gén)...`, 'loading')
    try {
      const res = await createArtefact(id, {
        type: 'flashcards',
        title: `Flashcards - ${chapterTitle}`,
        subtitle: `Flashcards • ${chapterTitle}`,
        target_chapter: chapterTitle,
        selection_text: chapterSummary,
      })
      setArtefacts(prev => [res.data, ...prev])
      showFeedback(`Les flashcards pour "${chapterTitle}" sont disponibles dans Mes outils !`, 'success', 4000)
    } catch (e: any) {
      showFeedback(e?.message || 'Erreur lors de la génération des flashcards par chapitre.', 'error')
    } finally {
      setIsGeneratingArtefact(false)
      setGeneratingChapterArtefact(null)
    }
  }

  const handleRegenerateFiche = async () => {
    if (!id) return
    setIsRegeneratingFiche(true)
    showFeedback('Régénération de la fiche en cours (0.5 gén)...', 'loading')
    try {
      const res = await regenerateFiche(id)
      if (res.data?.fiche) {
        setSession((prev: any) => ({ ...prev, content: { ...prev.content, fiche: res.data.fiche } }))
        showFeedback('Fiche de révision régénérée avec succès !', 'success')
      }
    } catch (e: any) {
      showFeedback(e?.message || 'Erreur lors de la régénération de la fiche.', 'error')
    } finally {
      setIsRegeneratingFiche(false)
    }
  }

  const handleCreateThread = async (title: string) => {
    if (!id) return
    try {
      const res = await createChatThread(id, title)
      setThreads(prev => [...prev, res.data])
      setActiveThreadId(res.data.id)
      showFeedback('Nouveau fil de discussion créé.', 'success')
    } catch (e: any) {
      showFeedback(e?.message || 'Erreur lors de la création du fil.', 'error')
    }
  }

  const handleSelectThread = (threadId: number) => setActiveThreadId(threadId)

  const handleDeleteThread = async (threadId: number) => {
    try {
      await deleteChatThread(threadId)
      setThreads(prev => prev.filter(t => t.id !== threadId))
      if (activeThreadId === threadId) {
        const remaining = threads.filter(t => t.id !== threadId)
        setActiveThreadId(remaining.length ? remaining[0].id : null)
      }
      showFeedback('Fil de discussion supprimé.', 'success')
    } catch (e: any) {
      showFeedback(e?.message || 'Erreur lors de la suppression du fil.', 'error')
    }
  }

  const handleSendChatMessage = (msg: string) => {
    handleSendChat(msg)
  }

  const handleDelete = async () => {
    try {
      if (type === 'annale') await deleteAnnale(id as string)
      else await deleteSession(id as string)
      navigate('/dashboard')
    } catch (e: any) {
      showFeedback(e?.message || t('sessionDetail.deleteError'), 'error')
    }
  }

  const handleOpenShare = async () => {
    try {
      if (!session.is_shared) {
        const shareFn = type === 'annale' ? shareAnnale : shareSession
        await shareFn(id as string)
        setSession({ ...session, is_shared: true })
      }
      setIsShareModalOpen(true)
    } catch (e: any) {
      showFeedback(e?.message || t('sessionDetail.shareError'), 'error')
    }
  }

  // Synchronisation des données reçues via TanStack Query (initial, rafraîchissement ou polling d'arrière-plan)
  useEffect(() => {
    if (!sessionData) return

    setSession(sessionData)
    const payload = sessionData
    const hash = encodeHashId(payload.id)
    const titleText = payload.title || payload.name || payload.resource_title || payload.source_filename || type
    const slug = titleText
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50)

    if (hash && typeof window !== "undefined" && window.history.replaceState) {
      const canonicalUrl = `/${type === "annale" ? "annales" : "sessions"}/${slug ? `${slug}-${hash}` : hash}`
      if (window.location.pathname !== canonicalUrl) {
        window.history.replaceState(null, "", canonicalUrl)
      }
    }

    const isAnnaleSession = type === 'annale' || payload.mode !== undefined || payload.sections !== undefined
    const types = payload.tool_types || (isAnnaleSession ? ['annale'] : ['fiche'])
    if (types.length && !activeTab) setActiveTab(types[0])
    else if (!activeTab) setActiveTab(isAnnaleSession ? 'annale' : 'fiche')

    if (payload.qa_history) {
      setChatHistory(prev => {
        if (prev.length === 0) return payload.qa_history
        if (payload.qa_history.length >= prev.length) return payload.qa_history
        return prev
      })
    }
    if (payload.artefacts) {
      setArtefacts(prev => {
        if (prev.length === 0) return payload.artefacts
        if (payload.artefacts.length >= prev.length) return payload.artefacts
        return prev
      })
    }
    if (payload.chat_threads) {
      setThreads(prev => {
        if (prev.length === 0) {
          if (payload.chat_threads.length > 0 && activeThreadId === null) {
            setActiveThreadId(payload.chat_threads[0].id)
          }
          return payload.chat_threads
        }
        if (payload.chat_threads.length >= prev.length) return payload.chat_threads
        return prev
      })
    }

    // Détection automatique de la fin d'une génération en arrière-plan
    if (id) {
      const ongoing = getOngoingGenerations(id)
      if (ongoing.length > 0) {
        const currentContent = payload.content || {}
        const finished = ongoing.filter(t => currentContent[t] !== undefined)
        if (finished.length > 0) {
          finished.forEach(t => removeOngoingGeneration(id, t))
          showFeedback(`✨ Outil généré avec succès !`, 'success', 5000)
          const remaining = getOngoingGenerations(id)
          if (remaining.length === 0) {
            setIsGeneratingTool(false)
            setGeneratingToolType(null)
          } else {
            setGeneratingToolType(remaining[0])
          }
        }
      }
    }
  }, [sessionData, id, type, activeTab, chatHistory.length, artefacts.length, threads.length, activeThreadId])

  // Détection initiale des générations en cours au montage
  useEffect(() => {
    if (!id) return
    const ongoing = getOngoingGenerations(id)
    if (ongoing.length > 0) {
      setIsGeneratingTool(true)
      setGeneratingToolType(ongoing[0])
    }
  }, [id])

  if (loading && !session) return (
    <div className="flex h-full overflow-hidden flex-col md:flex-row bg-sphera-bg">
      {/* Left Column Skeleton: Document Preview */}
      <div className="hidden md:flex md:w-1/2 border-r border-sphera-border flex-col bg-sphera-surface-2 animate-pulse">
        <div className="h-14 border-b border-sphera-border flex items-center justify-between px-4 bg-sphera-bg">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sphera-surface" />
            <div className="h-4 bg-sphera-surface rounded w-48" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-16 h-7 rounded-lg bg-sphera-surface" />
            <div className="w-8 h-7 rounded-lg bg-sphera-surface" />
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col items-center justify-start space-y-4 overflow-hidden">
          <div className="w-full max-w-lg h-[600px] rounded-xl bg-sphera-surface/50 border border-sphera-border/50 p-8 space-y-4">
            <div className="h-6 bg-sphera-surface rounded w-3/4 mb-6" />
            <div className="space-y-2.5">
              <div className="h-3.5 bg-sphera-surface/80 rounded w-full" />
              <div className="h-3.5 bg-sphera-surface/80 rounded w-11/12" />
              <div className="h-3.5 bg-sphera-surface/80 rounded w-4/5" />
            </div>
            <div className="h-32 bg-sphera-surface/40 rounded-lg w-full my-6" />
            <div className="space-y-2.5">
              <div className="h-3.5 bg-sphera-surface/80 rounded w-full" />
              <div className="h-3.5 bg-sphera-surface/80 rounded w-5/6" />
            </div>
          </div>
        </div>
      </div>

      {/* Right Column Skeleton: Study Workspace */}
      <div className="flex flex-1 flex-col h-full bg-sphera-bg animate-pulse">
        <div className="h-14 border-b border-sphera-border flex items-center justify-between px-4 bg-sphera-surface-2/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sphera-surface" />
            <div className="w-7 h-7 rounded-lg bg-sphera-surface" />
          </div>
          <div className="w-7 h-7 rounded-lg bg-sphera-surface" />
        </div>
        <div className="flex-1 p-6 space-y-6 max-w-xl mx-auto w-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-16 rounded-xl bg-sphera-surface-2 border border-sphera-border/60" />
            ))}
          </div>
          <div className="space-y-3 pt-2">
            <div className="h-4 bg-sphera-surface-2 rounded w-28 mb-3" />
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 rounded-xl bg-sphera-surface-2/70 border border-sphera-border/40" />
            ))}
          </div>
        </div>
        <div className="p-4 border-t border-sphera-border bg-sphera-surface-2 shrink-0">
          <div className="h-11 rounded-full bg-sphera-surface border border-sphera-border/60 max-w-xl mx-auto" />
        </div>
      </div>
    </div>
  )

  if (!session) return null

  const isAnnale = type === 'annale' || session.mode !== undefined || session.sections !== undefined
  const STUDY_TOOLS: ToolType[] = ['fiche', 'quiz', 'flashcards', 'mindmap', 'audio']
  const TOOL_LABELS: Record<string, string> = {
    fiche: t('sessionDetail.tools.fiche'),
    quiz: t('sessionDetail.tools.quiz'),
    flashcards: t('sessionDetail.tools.flashcards'),
    mindmap: t('sessionDetail.tools.mindmap'),
    audio: t('sessionDetail.tools.audio'),
    annale: t('sessionDetail.tools.annale'),
  }
  const tabList = isAnnale ? ['annale'] : STUDY_TOOLS
  const content = session.content || {}

  const isToolGenerated = (t: string) => {
    if (t === 'annale') {
      return Boolean(content && (content.sections || content.corrections || Object.keys(content).length > 0))
    }
    return content && content[t] !== undefined
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

  const handleToggleCommandMenu = () => {
    if (showCommandMenu) {
      setShowCommandMenu(false)
    } else {
      setShowCommandMenu(true)
      setCommandFilter('')
      setCommandActiveIdx(0)
      chatInputRef.current?.focus()
    }
  }

  const handleCommandSelect = (cmd: Command) => {
    setShowCommandMenu(false)

    if (cmd.category === 'tool' && cmd.toolType) {
      setChatMessage('')
      setActiveTab(cmd.toolType)
      if (type === 'session' && (!content || content[cmd.toolType] === undefined)) {
        handleAddTool(cmd.toolType as any)
      }
      return
    }

    const isDocEn = isTextEnglish(session?.extracted_text || '')
    const templateToUse = isDocEn ? (cmd.templateEn || cmd.template) : cmd.template
    if (templateToUse) {
      setChatMessage(prev => {
        if (prev.match(/@([a-zA-Z0-9_-]*)$/)) {
          return prev.replace(/@([a-zA-Z0-9_-]*)$/, templateToUse || '')
        }
        return prev ? `${prev} ${templateToUse}` : (templateToUse || '')
      })
      setTimeout(() => chatInputRef.current?.focus(), 50)
    }
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCommandMenu) {
      const search = commandFilter.replace(/^@/, '').toLowerCase().trim()
      const filtered = COMMANDS.filter(c => {
        if (!search) return true
        return (
          c.trigger.toLowerCase().includes(search) ||
          (c.aliases && c.aliases.some(a => a.toLowerCase().includes(search))) ||
          c.label.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search)
        )
      })

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setCommandActiveIdx(i => Math.min(i + 1, filtered.length - 1))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setCommandActiveIdx(i => Math.max(i - 1, 0))
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

  const handleStopChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsChatting(false);
    setChatHistory(prev => {
      if (prev.length === 0) return prev;
      const newHist = [...prev];
      for (let i = newHist.length - 1; i >= 0; i--) {
        if (newHist[i].answer === '...') {
          newHist[i].answer = t('sessionDetail.interrupted');
          break;
        }
      }
      return newHist;
    });
  };

  const handleEditMessage = async (index: number, newQuestion: string) => {
    if (!newQuestion.trim() || !id) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsChatting(true);
    setActiveTab('chat');

    setChatHistory(prev => {
      const newHist = [...prev];
      if (newHist[index]) {
        newHist[index] = { question: newQuestion, answer: '...' };
      }
      return newHist;
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await askQuestion(id, newQuestion, type, controller.signal);
      const normalized = normalizeAiResponse(res?.data?.answer);
      setChatHistory(prev => {
        const newHist = [...prev];
        if (newHist[index] && newHist[index].answer === '...') {
          newHist[index] = { question: newQuestion, answer: normalized, created_at: new Date().toISOString() };
        }
        return newHist;
      });

      if (id) {
        const editedEntry = { question: newQuestion, answer: normalized, created_at: new Date().toISOString() };
        updateSessionDetailCache(id, type, (old: any) => {
          const prevQa = Array.isArray(old?.qa_history) ? [...old.qa_history] : [];
          if (prevQa[index]) prevQa[index] = editedEntry;
          return { ...old, qa_history: prevQa };
        });
        setSession((prev: any) => {
          if (!prev) return prev;
          const prevQa = Array.isArray(prev?.qa_history) ? [...prev.qa_history] : [];
          if (prevQa[index]) prevQa[index] = editedEntry;
          return { ...prev, qa_history: prevQa };
        });
      }
    } catch (e: any) {
      if (e?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      setChatHistory(prev => {
        const newHist = [...prev];
        if (newHist[index] && newHist[index].answer === '...') {
          newHist[index].answer = t('sessionDetail.connectionError');
        }
        return newHist;
      });
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsChatting(false);
      }
    }
  };

  const handleRegenerateResponse = async (index: number) => {
    const item = chatHistory[index];
    if (!item || !item.question || !id) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsChatting(true);
    setActiveTab('chat');

    setChatHistory(prev => {
      const newHist = [...prev];
      if (newHist[index]) {
        newHist[index] = { ...newHist[index], answer: '...' };
      }
      return newHist;
    });

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await askQuestion(id, item.question, type, controller.signal);
      const normalized = normalizeAiResponse(res?.data?.answer);
      setChatHistory(prev => {
        const newHist = [...prev];
        if (newHist[index] && newHist[index].answer === '...') {
          newHist[index] = { ...newHist[index], answer: normalized };
        }
        return newHist;
      });

      if (id) {
        const regeneratedEntry = { ...item, answer: normalized };
        updateSessionDetailCache(id, type, (old: any) => {
          const prevQa = Array.isArray(old?.qa_history) ? [...old.qa_history] : [];
          if (prevQa[index]) prevQa[index] = regeneratedEntry;
          return { ...old, qa_history: prevQa };
        });
        setSession((prev: any) => {
          if (!prev) return prev;
          const prevQa = Array.isArray(prev?.qa_history) ? [...prev.qa_history] : [];
          if (prevQa[index]) prevQa[index] = regeneratedEntry;
          return { ...prev, qa_history: prevQa };
        });
      }
    } catch (e: any) {
      if (e?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      setChatHistory(prev => {
        const newHist = [...prev];
        if (newHist[index] && newHist[index].answer === '...') {
          newHist[index].answer = t('sessionDetail.connectionError');
        }
        return newHist;
      });
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsChatting(false);
      }
    }
  };

  const handleSendChat = async (customMessage?: string) => {
    const raw = (customMessage !== undefined ? customMessage : chatMessage).trim();
    if (!raw || !id) return;

    // Bare tool command -> switch tab
    const lower = raw.toLowerCase();
    if (['@fiche', '@quiz', '@flashcards', '@mindmap', '@audio', '@summary', '@notes', '@qcm', '@cards'].includes(lower)) {
      let tool = lower.replace('@', '');
      if (tool === 'notes' || tool === 'summary') tool = 'fiche';
      if (tool === 'qcm') tool = 'quiz';
      if (tool === 'cards') tool = 'flashcards';
      const availableTools = (session?.tool_types as string[]) || (session?.content ? Object.keys(session.content) : []);
      if (availableTools.includes(tool)) {
        setActiveTab(tool);
        setChatMessage('');
        return;
      }
    }

    let displayQuestion = raw;
    let queryForAi = raw;

    const match = raw.match(/^@(\w+)\s*(.*)$/);
    if (match) {
      const cmdTrigger = `@${match[1].toLowerCase()}`;
      const rest = match[2].trim();
      const foundCmd = COMMANDS.find(c =>
        c.trigger.toLowerCase() === cmdTrigger ||
        (c.aliases && c.aliases.some(a => a.toLowerCase() === cmdTrigger))
      );
      const isDocEn = isTextEnglish(session?.extracted_text || raw);
      if (foundCmd && (foundCmd.prefix || foundCmd.prefixEn)) {
        const prefix = isDocEn ? (foundCmd.prefixEn || foundCmd.prefix) : (foundCmd.prefix || foundCmd.prefixEn);
        const defaultTopic = isDocEn ? 'the key concepts.' : t('sessionDetail.promptDefaultEssential');
        queryForAi = prefix + (rest || defaultTopic);
        displayQuestion = rest || (isDocEn ? (foundCmd.trigger === '@expliquer' ? 'Explain concept' : foundCmd.trigger === '@résumer' ? 'Summarize topic' : 'Concrete example') : foundCmd.label);
      } else if (foundCmd && foundCmd.toolType) {
        queryForAi = rest 
          ? (isDocEn ? `Regarding the course, explain the essential elements of "${rest}".` : t('sessionDetail.promptRelatedToCourse', { text: rest })) 
          : (isDocEn ? 'Summarize the essential points of the course.' : t('sessionDetail.promptSummarizePoints'));
      } else {
        queryForAi = rest || raw;
      }
    }

    setChatMessage('');
    setIsChatting(true);
    setActiveTab('chat');

    setChatHistory(prev => [...prev, { question: displayQuestion, answer: '...' }]);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await askQuestion(id, queryForAi, type, controller.signal);
      const normalized = normalizeAiResponse(res?.data?.answer);
      const newEntry = {
        question: displayQuestion,
        answer: normalized,
        created_at: res?.data?.created_at || new Date().toISOString(),
      };
      setChatHistory(prev => {
        const newHist = [...prev];
        if (newHist.length > 0 && newHist[newHist.length - 1].answer === '...') {
          newHist[newHist.length - 1] = newEntry;
        } else {
          newHist.push(newEntry);
        }
        return newHist;
      });

      if (id) {
        updateSessionDetailCache(id, type, (old: any) => {
          const prevQa = Array.isArray(old?.qa_history) ? old.qa_history : [];
          return { ...old, qa_history: [...prevQa, newEntry] };
        });
        setSession((prev: any) => {
          if (!prev) return prev;
          const prevQa = Array.isArray(prev?.qa_history) ? prev.qa_history : [];
          return { ...prev, qa_history: [...prevQa, newEntry] };
        });
      }
    } catch (e: any) {
      if (e?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      setChatHistory(prev => {
        const newHist = [...prev];
        if (newHist.length > 0 && newHist[newHist.length - 1].answer === '...') {
          newHist[newHist.length - 1].answer = t('sessionDetail.connectionError');
        }
        return newHist;
      });
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
        setIsChatting(false);
      }
    }
  }

  const handleSelectionAction = async (action: SelectionActionType, selectedText: string) => {
    if ((action === 'quiz' || action === 'flashcards') && type === 'session' && id) {
      setMobileActiveView('workspace');
      setActionFeedback({
        message: action === 'quiz' ? t('sessionDetail.selectionGeneratingQuiz') : t('sessionDetail.selectionGeneratingFlashcards'),
        type: 'loading',
      });
      try {
        const res = await createFromSelection(id, action, selectedText);
        const updatedSession = res?.data?.session;
        if (updatedSession) {
          setSession(updatedSession);
        }
        setActiveTab(action);
        const count = res?.data?.count || (res?.data?.created_items?.length) || 1;
        setActionFeedback({
          message: action === 'quiz' 
            ? t('sessionDetail.selectionAddedQuiz', { count }) 
            : t('sessionDetail.selectionAddedFlashcards', { count }),
          type: 'success',
        });
        setTimeout(() => setActionFeedback(null), 4000);
        return;
      } catch (err: any) {
        setActionFeedback({
          message: err?.message || t('sessionDetail.selectionError'),
          type: 'error',
        });
        setTimeout(() => setActionFeedback(null), 4000);
        return;
      }
    }

    const isDocEn = isTextEnglish(session?.extracted_text || selectedText)
    const targetLng = isDocEn ? 'en' : 'fr'

    let prompt = ''
    let display = ''

    if (action === 'expliquer') {
      display = t('sessionDetail.explainAction', { lng: targetLng, text: selectedText })
      prompt = t('sessionDetail.explainPrompt', { lng: targetLng, text: selectedText })
    } else if (action === 'resumer') {
      display = t('sessionDetail.summarizeAction', { lng: targetLng, text: selectedText })
      prompt = t('sessionDetail.summarizePrompt', { lng: targetLng, text: selectedText })
    } else if (action === 'exemple') {
      display = t('sessionDetail.exampleAction', { lng: targetLng, text: selectedText })
      prompt = t('sessionDetail.examplePrompt', { lng: targetLng, text: selectedText })
    } else if (action === 'quiz') {
      display = t('sessionDetail.quizAction', { lng: targetLng, text: selectedText })
      prompt = t('sessionDetail.quizPrompt', { lng: targetLng, text: selectedText })
    } else if (action === 'flashcards') {
      display = t('sessionDetail.flashcardAction', { lng: targetLng, text: selectedText })
      prompt = t('sessionDetail.flashcardPrompt', { lng: targetLng, text: selectedText })
    }

    setMobileActiveView('workspace')
    setActiveTab('chat')
    setIsChatting(true)

    setChatHistory(prev => [...prev, { question: display, answer: '...' }])

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await askQuestion(id!, prompt, type, controller.signal)
      const normalized = normalizeAiResponse(res?.data?.answer)
      const newEntry = {
        question: display,
        answer: normalized,
        created_at: res?.data?.created_at || new Date().toISOString(),
      };
      setChatHistory(prev => {
        const newHist = [...prev];
        if (newHist.length > 0 && newHist[newHist.length - 1].answer === '...') {
          newHist[newHist.length - 1] = newEntry;
        } else {
          newHist.push(newEntry);
        }
        return newHist;
      });

      if (id) {
        updateSessionDetailCache(id, type, (old: any) => {
          const prevQa = Array.isArray(old?.qa_history) ? old.qa_history : [];
          return { ...old, qa_history: [...prevQa, newEntry] };
        });
        setSession((prev: any) => {
          if (!prev) return prev;
          const prevQa = Array.isArray(prev?.qa_history) ? prev.qa_history : [];
          return { ...prev, qa_history: [...prevQa, newEntry] };
        });
      }
    } catch (e: any) {
      if (e?.name === 'AbortError' || controller.signal.aborted) {
        return
      }
      setChatHistory(prev => {
        const newHist = [...prev]
        if (newHist.length > 0 && newHist[newHist.length - 1].answer === '...') {
          newHist[newHist.length - 1].answer = t('sessionDetail.connectionError')
        }
        return newHist
      })
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
        setIsChatting(false)
      }
    }
  }

  const rawFileUrl = session?.resource_file_url;
  const fileUrl = rawFileUrl
    ? (rawFileUrl.startsWith('/') ? `${API_BASE.replace(/\/$/, '')}${rawFileUrl}` : rawFileUrl)
    : null;

  const filename = (session?.source_filename || session?.resource_title || '').toLowerCase();
  const isPdf = Boolean(fileUrl?.toLowerCase().endsWith('.pdf') || filename.endsWith('.pdf'));
  const isImage = Boolean(/\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(fileUrl || '') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(filename));

  return (
    <div className="flex flex-1 h-full min-h-0 overflow-hidden flex-col md:flex-row bg-sphera-bg">
      {/* Mobile Top Bar with Segmented View Switcher */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 bg-sphera-surface-2 border-b border-sphera-border shrink-0 z-30">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-1.5 text-sphera-text-muted hover:bg-sphera-surface hover:text-white rounded-md transition-colors shrink-0"
          title={t('sessionDetail.backToDashboard')}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center bg-sphera-surface p-1 rounded-lg border border-sphera-border gap-1">
          <button
            type="button"
            onClick={() => setMobileActiveView('doc')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              mobileActiveView === 'doc'
                ? 'bg-sphera-green text-black shadow-sm'
                : 'text-sphera-text-muted hover:text-white'
            }`}
          >
            {isImage ? t('sessionDetail.image') : isPdf ? t('sessionDetail.pdf') : t('sessionDetail.document')}
          </button>
          <button
            type="button"
            onClick={() => setMobileActiveView('workspace')}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
              mobileActiveView === 'workspace'
                ? 'bg-sphera-green text-black shadow-sm'
                : 'text-sphera-text-muted hover:text-white'
            }`}
          >
            {t('sessionDetail.studySpace')}
          </button>
        </div>
      </div>

      {/* Left Column: Source Document */}
      <div className={`${mobileActiveView === 'doc' ? 'flex flex-1 w-full min-h-0' : 'hidden'} ${isPdfExpanded ? 'md:flex md:w-1/2' : 'md:hidden'} border-r border-sphera-border flex-col bg-sphera-surface-2 overflow-hidden transition-all duration-300`}>
        <div className="h-14 border-b border-sphera-border flex items-center justify-between px-4 bg-sphera-bg">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="hidden md:inline-flex p-1.5 text-sphera-text-muted hover:bg-sphera-surface hover:text-white rounded-md transition-colors shrink-0"
              title={t('sessionDetail.backToDashboard')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-white truncate">
              {session.resource_title || session.source_filename || t('sessionDetail.defaultSessionTitle', { id: session.id })}
            </span>
          </div>

          {/* Toggle between Document and Text if both are available */}
          {(isImage || isPdf) && session.extracted_text && (
            <div className="flex items-center gap-1 bg-sphera-surface p-1 rounded-lg border border-sphera-border shrink-0 ml-2">
              <button
                type="button"
                onClick={() => setDocViewMode('doc')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  docViewMode === 'doc' ? 'bg-sphera-green text-black shadow-sm' : 'text-sphera-text-muted hover:text-white'
                }`}
              >
                {isImage ? t('sessionDetail.image') : t('sessionDetail.pdf')}
              </button>
              <button
                type="button"
                onClick={() => setDocViewMode('text')}
                title={t('sessionDetail.interactiveTextTooltip')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  docViewMode === 'text' ? 'bg-sphera-green text-black shadow-sm' : 'text-sphera-text-muted hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>{t('sessionDetail.interactiveText')}</span>
              </button>
            </div>
          )}
        </div>

        {/* Document Viewer */}
        <div className="flex-1 overflow-hidden relative bg-[#1E1E1E]">
          {docViewMode === 'doc' && isImage && fileUrl ? (
            <DocumentImageViewer
              src={fileUrl}
              alt={session.resource_title || t('sessionDetail.document')}
              title={session.resource_title || session.source_filename}
            />
          ) : docViewMode === 'doc' && isPdf && fileUrl ? (
            <iframe 
              src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
              className="w-full h-full border-none custom-scrollbar" 
              title={t('sessionDetail.documentPreview')}
            />
          ) : session.extracted_text ? (
            <CourseTextReader
              initialText={session.extracted_text}
              title={session.resource_title || session.source_filename}
              isEditable={type === 'session'}
              onSelectionAction={handleSelectionAction}
              onSave={async (newText) => {
                if (id) {
                  await updateSessionText(id, newText);
                  setSession((prev: any) => ({ ...prev, extracted_text: newText }));
                }
              }}
            />
          ) : fileUrl ? (
            <iframe 
              src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
              className="w-full h-full border-none custom-scrollbar" 
              title={t('sessionDetail.documentPreview')}
            />
          ) : (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center opacity-60 h-full">
              <FileText className="w-16 h-16 text-sphera-text-muted mb-4" />
              <p className="text-white font-medium mb-1">{t('sessionDetail.previewUnavailable')}</p>
              <p className="text-sm text-sphera-text-muted max-w-sm">
                {t('sessionDetail.originalDocNotFound')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Study Workspace */}
      <div className={`${mobileActiveView === 'workspace' ? 'flex flex-1 w-full min-h-0' : 'hidden'} ${isPdfExpanded ? 'md:flex md:w-1/2' : 'md:flex md:w-full'} flex-col bg-sphera-bg relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300`}>
        <StudyWorkspacePanel
          sessionId={id}
          documentTitle={session.resource_title || session.source_filename || 'Espace d\'étude'}
          sessionContent={content}
          artefacts={artefacts}
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
          onCreateThread={handleCreateThread}
          onDeleteThread={handleDeleteThread}
          chatHistory={chatHistory}
          isChatting={isChatting}
          onSendMessage={handleSendChatMessage}
          onStopChat={handleStopChat}
          onEditMessage={handleEditMessage}
          onRegenerateResponse={handleRegenerateResponse}
          isGeneratingTool={isGeneratingTool}
          generatingToolType={generatingToolType}
          onGenerateTool={handleAddTool}
          onDeleteArtefact={handleDeleteArtefact}
          onRenameArtefact={handleRenameArtefact}
          onNewNote={handleNewNote}
          onSaveNote={handleSaveNote}
          onGenerateChapterQuiz={handleGenerateChapterQuiz}
          onGenerateChapterFlashcards={handleGenerateChapterFlashcards}
          onRegenerateFiche={handleRegenerateFiche}
          isRegeneratingFiche={isRegeneratingFiche}
          isGeneratingArtefact={isGeneratingArtefact}
          generatingChapterArtefact={generatingChapterArtefact}
          isPdfExpanded={isPdfExpanded}
          onTogglePdfExpanded={() => setIsPdfExpanded(!isPdfExpanded)}
          rawAnnale={isAnnale ? session : undefined}
          onOpenShare={handleOpenShare}
          onOpenDelete={() => setIsDeleteModalOpen(true)}
          onArtefactCreated={(newArt) => setArtefacts(prev => [newArt, ...prev])}
          onCreateNoteWithContent={async (title, text) => {
            if (!id) return
            try {
              const res = await createArtefact(id, {
                type: 'note',
                title,
                subtitle: 'Créée depuis le Q&A',
                content: { text },
              })
              setArtefacts(prev => [res.data, ...prev])
              showFeedback('Note enregistrée !', 'success')
            } catch (err: any) {
              showFeedback(err?.message || "Erreur lors de l'enregistrement de la note", 'error')
            }
          }}
          extractedText={session.extracted_text}
        />
      </div>
      {selectionToolbar && (
        <TextSelectionToolbar
          coords={selectionToolbar.coords}
          selectedText={selectionToolbar.text}
          onAction={handleToolbarAction}
          onClose={() => setSelectionToolbar(null)}
        />
      )}

      {actionFeedback && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-sphera-surface-2/95 border border-sphera-border shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3">
          {actionFeedback.type === 'loading' && <Loader2 className="w-4 h-4 text-sphera-green animate-spin shrink-0" />}
          {actionFeedback.type === 'success' && <Check className="w-4 h-4 text-sphera-green shrink-0" />}
          {actionFeedback.type === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
          <span className="text-xs font-medium text-white">{actionFeedback.message}</span>
        </div>
      )}

      <ShareModal 
        isOpen={isShareModalOpen} 
        setIsOpen={setIsShareModalOpen} 
        url={window.location.href}
      />
      
      <DeleteConfirmModal 
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        onConfirm={handleDelete}
      />
    </div>
  )
}

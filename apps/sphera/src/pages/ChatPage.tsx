import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import {
  ChatCircle,
  Plus,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  Trash,
  PencilSimple,
  Check,
  X,
  Sparkle,
  BookOpen,
  Lightbulb,
  GraduationCap,
  List as Menu,
  Spinner as Loader2,
  Square,
  Lightning,
  Compass,
  Exam,
  Paperclip,
  MagnifyingGlass,
  Globe,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import {
  getStandaloneChatThread,
  createStandaloneChatThread,
  getChatCapabilities,
  streamThreadMessage,
  deleteChatThread,
  renameChatThread,
  createArtefact,
  type ChatThreadItem,
  type ChatMode,
  type WebSource,
} from '../services/spheraApi'
import { AiMessageItem } from '../components/app/AiMessageItem'
import { DeleteConfirmModal } from '../components/app/DeleteConfirmModal'
import { encodeHashId, parseSlugId } from '../lib/hashids'
import {
  invalidateSpheraSessions,
  useSessionsQuery,
  usePlannerSubjectsQuery,
} from '../hooks/useSpheraQueries'

type ChatContextSelection =
  | { type: 'session'; id: number; label: string }
  | { type: 'subject'; id: number; label: string; color: string }
  | null

const CHAT_MODES: Array<{
  id: ChatMode
  label: string
  description: string
  icon: typeof Sparkle
}> = [
  { id: 'tutor', label: 'Tuteur', description: 'Explications claires avec exemples et analogies', icon: Sparkle },
  { id: 'socratic', label: 'Socrate', description: 'Te guide étape par étape par questions sans donner la réponse directe', icon: Compass },
  { id: 'exam', label: 'Examen', description: 'Te pose des questions pièges type partiel et note tes réponses', icon: Exam },
  { id: 'express', label: 'Express', description: 'Réponses ultra-concises en points clés essentiels', icon: Lightning },
]

const STARTER_SUGGESTIONS = [
  {
    icon: Lightbulb,
    title: "Explication de concept",
    prompt: "Explique-moi le fonctionnement des réseaux de neurones artificiels simplement avec une analogie."
  },
  {
    icon: GraduationCap,
    title: "Méthodologie d'examen",
    prompt: "Comment structurer une dissertation ou une étude de cas pour obtenir la note maximale ?"
  },
  {
    icon: BookOpen,
    title: "Aide aux devoirs",
    prompt: "Aide-moi à comprendre la différence entre microéconomie et macroéconomie avec des exemples concrets."
  },
  {
    icon: Sparkle,
    title: "Technique de mémorisation",
    prompt: "Donne-moi 5 techniques scientifiquement prouvées pour mémoriser mes cours plus rapidement."
  }
]

export default function ChatPage() {
  const { t } = useTranslation('study')
  const { threadId: paramThreadId } = useParams<{ threadId?: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useSpheraAuth()

  // Active thread state
  const [activeThreadId, setActiveThreadId] = useState<number | null>(() => {
    return paramThreadId ? parseSlugId(paramThreadId) : null
  })
  const [activeThread, setActiveThread] = useState<ChatThreadItem | null>(null)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Messages in current thread
  const [messages, setMessages] = useState<
    Array<{
      question: string
      answer: string
      id?: number
      sources?: WebSource[]
      status?: string | null
      searchQuery?: string | null
    }>
  >([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Pedagogical chat mode, Web Search toggle & optional course/subject context (defaults to free general chat!)
  const [chatMode, setChatMode] = useState<ChatMode>('tutor')
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [webSearchAvailable, setWebSearchAvailable] = useState<boolean | null>(null)
  const [attachedContext, setAttachedContext] = useState<ChatContextSelection>(null)

  useEffect(() => {
    let mounted = true
    getChatCapabilities()
      .then((res) => {
        if (mounted && typeof res?.data?.webSearch === 'boolean') {
          setWebSearchAvailable(res.data.webSearch)
        }
      })
      .catch(() => {})
    return () => {
      mounted = false
    }
  }, [])
  const [contextMenuOpen, setContextMenuOpen] = useState(false)
  const [contextSearch, setContextSearch] = useState('')
  const contextMenuRef = useRef<HTMLDivElement>(null)

  const { data: rawSessions = [] } = useSessionsQuery()
  const { data: plannerSubjects = [] } = usePlannerSubjectsQuery()

  const availableCourses = useMemo(() => {
    return (rawSessions || [])
      .filter(
        (s: any) =>
          s.source_filename !== 'Discussion libre' &&
          s.source_filename !== '__sphera_standalone_chat__' &&
          s.sourceFilename !== '__sphera_standalone_chat__',
      )
      .map((s: any) => ({
        id: Number(s.id),
        title: s.resource_title || s.source_filename || `Cours #${s.id}`,
      }))
  }, [rawSessions])

  useEffect(() => {
    if (!contextMenuOpen) return
    const handleOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [contextMenuOpen])

  // Rename, Delete Modal & Toast feedback state
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState('')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type })
    toastTimerRef.current = setTimeout(() => setToast(null), 2800)
  }

  const chatBottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesScrollRef = useRef<HTMLDivElement>(null)
  const [showScrollBottom, setShowScrollBottom] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isInitialThreadLoadRef = useRef(true)
  // Prevents the newly-created thread's useEffect GET from overwriting the live 1st-message SSE stream
  const skipNextLoadThreadIdRef = useRef<number | null>(null)

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTo({
        top: messagesScrollRef.current.scrollHeight,
        behavior,
      })
    } else {
      chatBottomRef.current?.scrollIntoView({ behavior })
    }
  }

  const handleMessagesScroll = () => {
    if (!messagesScrollRef.current) {
      if (showScrollBottom) setShowScrollBottom(false)
      return
    }
    const { scrollTop, scrollHeight, clientHeight } = messagesScrollRef.current
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    setShowScrollBottom(distanceFromBottom > 120)
  }

  const formatThreadMessages = (rawMsgs: any[] = []) => {
    const formatted: Array<{ question: string; answer: string; id?: number; sources?: WebSource[] }> = []
    for (let i = 0; i < rawMsgs.length; i++) {
      const m = rawMsgs[i]
      if (m.role === 'user') {
        const next = rawMsgs[i + 1]
        formatted.push({
          question: m.content,
          answer: next && next.role === 'assistant' ? next.content : '',
          id: m.id,
          sources:
            next && next.role === 'assistant' && Array.isArray(next.sources)
              ? (next.sources as WebSource[])
              : undefined,
        })
        if (next && next.role === 'assistant') i++
      }
    }
    return formatted
  }

  // ─── 1. Handle paramThreadId changes ─────────────────────────
  useEffect(() => {
    if (paramThreadId) {
      const idNum = parseSlugId(paramThreadId)
      setActiveThreadId(idNum)
    } else {
      setActiveThreadId(null)
      setActiveThread(null)
      setMessages([])
    }
  }, [paramThreadId])

  // Track initial load for newly opened threads
  useEffect(() => {
    isInitialThreadLoadRef.current = true
  }, [activeThreadId])

  // Scroll to bottom on initial thread load once messages are rendered
  useEffect(() => {
    if (!isLoadingMessages && messages.length > 0 && isInitialThreadLoadRef.current) {
      isInitialThreadLoadRef.current = false
      setTimeout(() => {
        scrollToBottom('auto')
      }, 60)
    }
  }, [isLoadingMessages, messages.length])

  // ─── 2. Handle initialQuestion from Dashboard ────────────────
  useEffect(() => {
    const initialQ = (location.state as any)?.initialQuestion
    if (initialQ && typeof initialQ === 'string' && initialQ.trim()) {
      navigate(location.pathname, { replace: true, state: {} })
      handleStartNewChatWithQuestion(initialQ.trim())
    }
  }, [location.state])

  // ─── 3. Load Active Thread Details ───────────────────────────
  useEffect(() => {
    if (!activeThreadId) {
      setActiveThread(null)
      setMessages([])
      return
    }

    if (skipNextLoadThreadIdRef.current === activeThreadId) {
      skipNextLoadThreadIdRef.current = null
      return
    }

    let isMounted = true
    setIsLoadingMessages(true)

    getStandaloneChatThread(activeThreadId)
      .then((res) => {
        if (!isMounted) return
        const thread = res?.data
        if (thread) {
          setActiveThread(thread)
          setMessages(formatThreadMessages(thread.messages || []))
        }
      })
      .catch((err) => {
        console.error('Erreur chargement de la discussion:', err)
      })
      .finally(() => {
        if (isMounted) setIsLoadingMessages(false)
      })

    return () => {
      isMounted = false
    }
  }, [activeThreadId])

  // ─── Stop chat response ──────────────────────────────────────
  const handleStopChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsSending(false)
    setMessages((prev) => {
      if (prev.length === 0) return prev
      const updated = [...prev]
      for (let i = updated.length - 1; i >= 0; i--) {
        if (updated[i].answer === '...') {
          updated[i] = { ...updated[i], answer: '*(Génération interrompue)*', status: null }
          break
        }
      }
      return updated
    })
  }

  // ─── 4. Send Message / Create Thread ─────────────────────────
  const buildStreamOptions = (extra?: {
    replaceFromTurnIndex?: number
    onStatus?: (status: string, query?: string) => void
    onSources?: (sources: WebSource[]) => void
  }) => ({
    ...extra,
    mode: chatMode,
    contextSessionId: attachedContext?.type === 'session' ? attachedContext.id : null,
    contextSubjectId: attachedContext?.type === 'subject' ? attachedContext.id : null,
    webSearch: webSearchEnabled,
  })

  const handleStartNewChatWithQuestion = async (questionText: string) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    isInitialThreadLoadRef.current = false
    setIsSending(true)
    const tempQuestion = questionText
    setMessages([
      {
        question: tempQuestion,
        answer: '...',
        status: webSearchEnabled ? 'searching_web' : null,
      },
    ])

    try {
      // 1. Create the thread shell instantly (backend computes clean word-boundary title)
      const res = await createStandaloneChatThread({ title: tempQuestion.slice(0, 80) }, controller.signal)
      const newThread = res?.data
      if (newThread) {
        skipNextLoadThreadIdRef.current = newThread.id
        setActiveThreadId(newThread.id)
        setActiveThread(newThread)
        const hash = encodeHashId(newThread.id) || newThread.id
        navigate(`/chat/${hash}`, { replace: true })
        invalidateSpheraSessions()

        // 2. Stream the first message in real time
        let streamedText = ''
        let streamedSources: WebSource[] | undefined
        await streamThreadMessage(
          newThread.id,
          tempQuestion,
          (token) => {
            streamedText += token
            setMessages([
              {
                question: tempQuestion,
                answer: streamedText,
                sources: streamedSources,
                status: null,
              },
            ])
          },
          controller.signal,
          buildStreamOptions({
            onStatus: (status, query) => {
              setMessages((prev) => {
                if (!prev[0]) return prev
                return [{ ...prev[0], status, ...(query ? { searchQuery: query } : {}) }]
              })
            },
            onSources: (sources) => {
              streamedSources = sources
              setMessages((prev) => {
                if (!prev[0]) return prev
                return [{ ...prev[0], sources }]
              })
            },
          })
        )
        invalidateSpheraSessions()
      }
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return
      }
      console.error('Erreur initialisation chat:', err)
      setMessages([])
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
      setIsSending(false)
    }
  }

  const handleSendMessageWithText = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || isSending) return

    setInputMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // If no active thread, create one with first message
    if (!activeThreadId) {
      await handleStartNewChatWithQuestion(trimmed)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    // Append to current thread with loading indicator
    const newMsgIndex = messages.length
    setMessages((prev) => [
      ...prev,
      {
        question: trimmed,
        answer: '...',
        status: webSearchEnabled ? 'searching_web' : null,
      },
    ])
    setIsSending(true)

    // Smooth scroll down to bring the new question into view
    setTimeout(() => {
      scrollToBottom('smooth')
    }, 60)

    let streamedText = ''
    try {
      await streamThreadMessage(
        activeThreadId,
        trimmed,
        (token) => {
          streamedText += token
          setMessages((prev) => {
            const updated = [...prev]
            if (updated[newMsgIndex]) {
              updated[newMsgIndex] = {
                ...updated[newMsgIndex],
                answer: streamedText,
                status: null,
              }
            }
            return updated
          })
        },
        controller.signal,
        buildStreamOptions({
          onStatus: (status, query) => {
            setMessages((prev) => {
              const updated = [...prev]
              if (updated[newMsgIndex]) {
                updated[newMsgIndex] = {
                  ...updated[newMsgIndex],
                  status,
                  ...(query ? { searchQuery: query } : {}),
                }
              }
              return updated
            })
          },
          onSources: (sources) => {
            setMessages((prev) => {
              const updated = [...prev]
              if (updated[newMsgIndex]) {
                updated[newMsgIndex] = { ...updated[newMsgIndex], sources }
              }
              return updated
            })
          },
        })
      )
      invalidateSpheraSessions()
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return
      }
      console.error('Erreur envoi message:', err)
      setMessages((prev) => {
        const updated = [...prev]
        if (updated[newMsgIndex]) {
          updated[newMsgIndex] = {
            ...updated[newMsgIndex],
            answer: streamedText || "Une erreur est survenue lors de la réponse. Veuillez réessayer.",
            status: null,
          }
        }
        return updated
      })
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
      setIsSending(false)
    }
  }

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    handleSendMessageWithText(inputMessage)
  }

  // Handle Edit & Regenerate (rewinds thread cleanly from `index` in both UI and DB — zero duplicates!)
  const handleEditMessage = async (index: number, newQuestion: string) => {
    if (!activeThreadId || isSending) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsSending(true)
    setMessages((prev) => [
      ...prev.slice(0, index),
      {
        question: newQuestion,
        answer: '...',
        status: webSearchEnabled ? 'searching_web' : null,
      },
    ])

    let streamedText = ''
    try {
      await streamThreadMessage(
        activeThreadId,
        newQuestion,
        (token) => {
          streamedText += token
          setMessages((prev) => {
            const updated = [...prev]
            if (updated[index]) {
              updated[index] = { ...updated[index], answer: streamedText, status: null }
            }
            return updated
          })
        },
        controller.signal,
        buildStreamOptions({
          replaceFromTurnIndex: index,
          onStatus: (status, query) => {
            setMessages((prev) => {
              const updated = [...prev]
              if (updated[index]) {
                updated[index] = {
                  ...updated[index],
                  status,
                  ...(query ? { searchQuery: query } : {}),
                }
              }
              return updated
            })
          },
          onSources: (sources) => {
            setMessages((prev) => {
              const updated = [...prev]
              if (updated[index]) {
                updated[index] = { ...updated[index], sources }
              }
              return updated
            })
          },
        })
      )
      invalidateSpheraSessions()
    } catch (err: any) {
      if (err?.name === 'AbortError' || controller.signal.aborted) {
        return
      }
      console.error('Erreur modification message:', err)
      setMessages((prev) => {
        const updated = [...prev]
        if (updated[index]) {
          updated[index] = {
            ...updated[index],
            answer: streamedText || "Une erreur est survenue lors de la réponse. Veuillez réessayer.",
            status: null,
          }
        }
        return updated
      })
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null
      }
      setIsSending(false)
    }
  }

  const handleRegenerate = async (index: number) => {
    const target = messages[index]
    if (!target || !activeThreadId || isSending) return
    handleEditMessage(index, target.question)
  }

  // Save answer as Note directly into the attached course session (when a real course is linked)
  const handleSaveNoteToAttachedCourse = async (question: string, answer: string) => {
    if (attachedContext?.type !== 'session') return
    try {
      await createArtefact(attachedContext.id, {
        type: 'note',
        title: question.length > 42 ? question.slice(0, 42) + '…' : question,
        subtitle: 'Enregistrée depuis le Chat',
        content: { text: `# ${question}\n\n${answer}` },
      })
      showToast(`Note ajoutée au cours « ${attachedContext.label} » !`, 'success')
    } catch (err) {
      console.error('Erreur création note:', err)
      showToast("Erreur lors de l'enregistrement de la note.", 'error')
    }
  }

  // ─── 5. Thread Management (New, Rename, Delete) ──────────────
  const handleCreateNewThread = () => {
    setActiveThreadId(null)
    setActiveThread(null)
    setMessages([])
    setInputMessage('')
    navigate('/chat')
    textareaRef.current?.focus()
  }

  const handleDeleteCurrentThread = () => {
    if (!activeThreadId) return
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteCurrentThread = async () => {
    if (!activeThreadId) return
    try {
      await deleteChatThread(activeThreadId)
      invalidateSpheraSessions()
      handleCreateNewThread()
    } catch (err) {
      console.error('Erreur suppression discussion:', err)
      showToast('Erreur lors de la suppression.', 'error')
    }
  }

  const handleStartRename = () => {
    if (!activeThread) return
    setEditTitleValue(activeThread.title)
    setIsEditingTitle(true)
  }

  const handleSaveRename = async () => {
    if (!activeThreadId) return
    const trimmed = editTitleValue.trim()
    if (!trimmed || trimmed === activeThread?.title) {
      setIsEditingTitle(false)
      return
    }

    try {
      await renameChatThread(activeThreadId, trimmed)
      setActiveThread((prev) => (prev ? { ...prev, title: trimmed } : prev))
      invalidateSpheraSessions()
    } catch (err) {
      console.error('Erreur renommage discussion:', err)
    } finally {
      setIsEditingTitle(false)
    }
  }

  // Auto-resize textarea
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isSending) {
        handleSendMessage()
      }
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-sphera-bg overflow-hidden relative font-sans">

      {/* ─── TOP HEADER ────────────────────────────────────────── */}
      <header className="h-14 border-b border-sphera-border px-3 sm:px-6 flex items-center justify-between bg-sphera-surface-2/80 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent('sphera:open-mobile-sidebar'))}
            className="md:hidden p-1.5 -ml-1 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors shrink-0"
            title="Ouvrir le menu"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-4 h-4" />
          </button>

          <Link
            to="/app"
            className="flex items-center gap-1.5 text-xs font-medium text-sphera-text-muted hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">Accueil</span>
          </Link>

          <span className="text-sphera-border text-sm">/</span>

          <Link
            to="/chat"
            className="text-xs font-medium text-sphera-text-muted hover:text-white transition-colors shrink-0"
          >
            Chat
          </Link>

          {activeThread && (
            <>
              <span className="text-sphera-border text-sm">/</span>
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={editTitleValue}
                    onChange={(e) => setEditTitleValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename()
                      if (e.key === 'Escape') setIsEditingTitle(false)
                    }}
                    autoFocus
                    className="bg-sphera-bg border border-sphera-green/50 rounded-lg px-2.5 py-1 text-xs text-white outline-none max-w-[200px] sm:max-w-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSaveRename}
                    className="p-1 text-sphera-green hover:text-white rounded transition-colors cursor-pointer"
                    title="Enregistrer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(false)}
                    className="p-1 text-sphera-text-muted hover:text-white rounded transition-colors cursor-pointer"
                    title="Annuler"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0">
                  <h1 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[140px] xs:max-w-[200px] sm:max-w-sm md:max-w-md">
                    {activeThread.title}
                  </h1>
                  <button
                    type="button"
                    onClick={handleStartRename}
                    className="p-1 rounded text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors shrink-0 cursor-pointer"
                    title="Renommer la discussion"
                  >
                    <PencilSimple className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCurrentThread}
                    className="p-1 rounded text-sphera-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 cursor-pointer"
                    title="Supprimer la discussion"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCreateNewThread}
            className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-sphera-surface hover:bg-sphera-surface-2 text-white border border-sphera-border transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-sphera-green" />
            <span className="hidden sm:inline">Nouveau chat</span>
          </button>
        </div>
      </header>

      {/* ─── MESSAGES SCROLL AREA ────────────────────────────── */}
      <main
        ref={messagesScrollRef}
        onScroll={handleMessagesScroll}
        className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 custom-scrollbar min-h-0 relative select-text"
      >
        <div className="max-w-3xl mx-auto w-full">
          {isLoadingMessages ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-sphera-text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-sphera-green" />
              <p className="text-xs">Chargement de la discussion…</p>
            </div>
          ) : messages.length === 0 ? (
            /* Empty Hero State */
            <div className="flex flex-col items-center justify-center py-10 sm:py-16 text-center animate-in fade-in duration-500">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-sphera-surface-2 border border-sphera-border/70 flex items-center justify-center mb-5 shadow-xl relative group">
                <div className="absolute inset-0 bg-sphera-green/10 rounded-2xl blur-xl group-hover:bg-sphera-green/20 transition-all" />
                <img src="/sphera_logo.svg" alt="Sphera" className="w-8 h-8 sm:w-10 sm:h-10 relative z-10" />
              </div>

              <h2 className="text-xl sm:text-3xl font-bold font-display text-white mb-2 px-2">
                Que souhaites-tu explorer ?
              </h2>
              <p className="text-xs sm:text-sm text-sphera-text-muted max-w-md mb-8 px-4">
                Apprends librement sur n’importe quel sujet, résous un problème, ou relie optionnellement un de tes cours ci-dessous.
              </p>

              {/* Starter Suggestions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 w-full max-w-2xl text-left px-2 sm:px-0">
                {STARTER_SUGGESTIONS.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendMessageWithText(item.prompt)}
                      className="p-3.5 sm:p-4 rounded-xl border border-sphera-border bg-sphera-surface/60 hover:bg-sphera-surface-2 hover:border-sphera-green/40 transition-all text-left flex flex-col gap-1.5 group cursor-pointer shadow-sm hover:shadow-md"
                    >
                      <div className="flex items-center gap-2 text-sphera-green">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-xs font-semibold text-white group-hover:text-sphera-green transition-colors">
                          {item.title}
                        </span>
                      </div>
                      <p className="text-xs text-sphera-text-muted line-clamp-2 leading-relaxed">
                        {item.prompt}
                      </p>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="flex flex-col gap-4 pb-6">
              {messages.map((msg, i) => (
                <AiMessageItem
                  key={i}
                  index={i}
                  question={msg.question}
                  answer={msg.answer}
                  sources={msg.sources}
                  status={msg.status}
                  searchQuery={msg.searchQuery}
                  hasCourseContext={Boolean(attachedContext)}
                  onEdit={handleEditMessage}
                  onRegenerate={handleRegenerate}
                  onCreateNote={attachedContext?.type === 'session' ? handleSaveNoteToAttachedCourse : undefined}
                  onSelectSuggestion={(sug) => handleSendMessageWithText(sug)}
                  disabled={isSending}
                />
              ))}
              <div ref={chatBottomRef} />
            </div>
          )}
        </div>
      </main>

      {/* ─── PINNED BOTTOM INPUT BAR (Rounded Pill) ─── */}
      <footer className="shrink-0 w-full px-3 sm:px-4 pb-3 sm:pb-4 pt-2 bg-sphera-bg relative z-20">
        <div className="max-w-2xl mx-auto w-full relative">
          {/* Floating scroll to bottom button */}
          {showScrollBottom && (
            <div className="absolute -top-11 inset-x-0 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                type="button"
                onClick={() => scrollToBottom('smooth')}
                className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sphera-surface-2/95 border border-sphera-border text-white text-xs font-medium shadow-2xl hover:border-sphera-green/50 hover:bg-sphera-surface backdrop-blur-md transition-all cursor-pointer"
                title="Revenir aux derniers messages"
              >
                <ArrowDown className="w-3.5 h-3.5 text-sphera-green" />
                <span>Derniers messages</span>
              </button>
            </div>
          )}

          {/* Compact Mode, Web Search & Optional Course/Subject Context Bar */}
          <div className="flex items-center justify-between gap-2 mb-2 px-1">
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Optional Context Picker (Free Chat by default!) */}
              <div ref={contextMenuRef} className="relative shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setContextMenuOpen((prev) => !prev)
                      setContextSearch('')
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer ${
                      attachedContext
                        ? 'bg-sphera-green/12 border-sphera-green/40 text-white'
                        : 'bg-sphera-surface/80 border-sphera-border/70 text-sphera-text-muted hover:text-white hover:border-sphera-border'
                    }`}
                    title={
                      attachedContext
                        ? `Contexte actif : ${attachedContext.label}`
                        : 'Optionnel : relier un cours ou une matière à cette discussion'
                    }
                  >
                    {attachedContext?.type === 'subject' ? (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: attachedContext.color || '#22c55e' }}
                      />
                    ) : attachedContext?.type === 'session' ? (
                      <BookOpen weight="duotone" className="w-3.5 h-3.5 text-sphera-green shrink-0" />
                    ) : (
                      <Paperclip className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span className="truncate max-w-[115px] sm:max-w-[165px]">
                      {attachedContext ? attachedContext.label : 'Discussion libre'}
                    </span>
                  </button>
                  {attachedContext && (
                    <button
                      type="button"
                      onClick={() => setAttachedContext(null)}
                      className="p-1 rounded-full text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors cursor-pointer"
                      title="Revenir en discussion libre (sans cours)"
                      aria-label="Retirer le contexte"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {contextMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-72 rounded-2xl border border-sphera-border bg-sphera-surface-2 shadow-2xl p-2.5 space-y-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sphera-text-muted">
                      Contexte de la discussion
                    </span>
                    <button
                      type="button"
                      onClick={() => setContextMenuOpen(false)}
                      className="text-sphera-text-muted hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {(availableCourses.length + plannerSubjects.length > 5) && (
                    <div className="relative">
                      <MagnifyingGlass className="w-3.5 h-3.5 text-sphera-text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={contextSearch}
                        onChange={(e) => setContextSearch(e.target.value)}
                        placeholder="Rechercher un cours ou une matière..."
                        className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-sphera-surface border border-sphera-border text-xs text-white placeholder-sphera-text-muted focus:outline-none focus:border-sphera-green"
                      />
                    </div>
                  )}

                  <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar">
                    <button
                      type="button"
                      onClick={() => {
                        setAttachedContext(null)
                        setContextMenuOpen(false)
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                        !attachedContext
                          ? 'bg-sphera-green/15 text-white font-semibold'
                          : 'text-white/80 hover:bg-sphera-surface'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <ChatCircle weight="duotone" className="w-3.5 h-3.5 text-sphera-green shrink-0" />
                        <span>Discussion libre (hors cours)</span>
                      </span>
                      {!attachedContext && <Check className="w-3.5 h-3.5 text-sphera-green shrink-0" />}
                    </button>

                    {plannerSubjects.length > 0 && (
                      <>
                        <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-sphera-text-muted">
                          Mes matières
                        </div>
                        {plannerSubjects
                          .filter((s) => !contextSearch.trim() || s.name.toLowerCase().includes(contextSearch.toLowerCase()))
                          .map((s) => {
                            const isSelected = attachedContext?.type === 'subject' && attachedContext.id === s.id
                            return (
                              <button
                                key={`subj-${s.id}`}
                                type="button"
                                onClick={() => {
                                  setAttachedContext({ type: 'subject', id: s.id, label: s.name, color: s.color })
                                  setContextMenuOpen(false)
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-sphera-green/15 text-white font-semibold'
                                    : 'text-white/85 hover:bg-sphera-surface'
                                }`}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: s.color || '#22c55e' }}
                                  />
                                  <span className="truncate">{s.name}</span>
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-sphera-green shrink-0" />}
                              </button>
                            )
                          })}
                      </>
                    )}

                    {availableCourses.length > 0 && (
                      <>
                        <div className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-sphera-text-muted">
                          Mes cours
                        </div>
                        {availableCourses
                          .filter((c) => !contextSearch.trim() || c.title.toLowerCase().includes(contextSearch.toLowerCase()))
                          .slice(0, 15)
                          .map((c) => {
                            const isSelected = attachedContext?.type === 'session' && attachedContext.id === c.id
                            return (
                              <button
                                key={`sess-${c.id}`}
                                type="button"
                                onClick={() => {
                                  setAttachedContext({ type: 'session', id: c.id, label: c.title })
                                  setContextMenuOpen(false)
                                }}
                                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-sphera-green/15 text-white font-semibold'
                                    : 'text-white/85 hover:bg-sphera-surface'
                                }`}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <BookOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  <span className="truncate">{c.title}</span>
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-sphera-green shrink-0" />}
                              </button>
                            )
                          })}
                      </>
                    )}
                  </div>
                </div>
              )}
              </div>

              {/* Web Search Toggle Pill (Tavily Grounding) */}
              <button
                type="button"
                onClick={() => {
                  if (webSearchAvailable === false && !webSearchEnabled) {
                    showToast('Recherche Web indisponible : configure TAVILY_API_KEY côté serveur.', 'error')
                    return
                  }
                  setWebSearchEnabled((prev) => !prev)
                }}
                title={
                  webSearchAvailable === false
                    ? 'Recherche Web non configurée sur le serveur (TAVILY_API_KEY manquante)'
                    : webSearchEnabled
                      ? 'Recherche Web forcée sur chaque message (clique pour repasser en mode Auto)'
                      : 'Recherche Web automatique active — clique pour forcer la recherche Web'
                }
                aria-pressed={webSearchEnabled}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer shrink-0 ${
                  webSearchEnabled
                    ? 'bg-sky-500/15 border-sky-400/50 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.18)]'
                    : webSearchAvailable === false
                      ? 'bg-sphera-surface/40 border-sphera-border/40 text-sphera-text-muted/60 hover:text-sphera-text-muted'
                      : 'bg-sphera-surface/80 border-sphera-border/70 text-sphera-text-muted hover:text-white hover:border-sphera-border'
                }`}
              >
                <Globe weight={webSearchEnabled ? 'duotone' : 'regular'} className="w-3.5 h-3.5 shrink-0" />
                <span>Web</span>
              </button>
            </div>

            {/* Pedagogical Mode Pills */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {CHAT_MODES.map((m) => {
                const Icon = m.icon
                const isActive = chatMode === m.id
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setChatMode(m.id)}
                    title={m.description}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-sphera-surface border-sphera-green/50 text-sphera-green font-semibold'
                        : 'bg-transparent border-transparent text-sphera-text-muted hover:text-white hover:bg-sphera-surface/60'
                    }`}
                  >
                    <Icon weight={isActive ? 'fill' : 'regular'} className="w-3 h-3 shrink-0" />
                    <span>{m.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <form
            onSubmit={handleSendMessage}
            className="relative flex items-center gap-2 bg-sphera-surface-2/95 hover:bg-sphera-surface-2 border border-sphera-border hover:border-sphera-border/90 focus-within:border-sphera-green/60 rounded-full p-1.5 pl-4 sm:pl-5 shadow-2xl backdrop-blur-xl transition-all"
          >
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Demande n'importe quoi..."
              className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white placeholder-sphera-text-muted outline-none focus:ring-0 resize-none max-h-32 py-1.5 leading-relaxed"
            />

            {isSending ? (
              <button
                type="button"
                onClick={handleStopChat}
                title="Arrêter la réponse"
                aria-label="Arrêter la réponse"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sphera-green hover:bg-green-400 text-black flex items-center justify-center shrink-0 transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] animate-in fade-in cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sphera-green hover:bg-green-400 disabled:opacity-40 text-black flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md shadow-sphera-green/20 cursor-pointer"
                title="Envoyer la question"
                aria-label="Envoyer la question"
              >
                <ArrowUp className="w-4 h-4 font-bold" />
              </button>
            )}
          </form>

          <p className="text-center text-[11px] text-sphera-text-muted/80 mt-1.5 block">
            Sphera peut faire des erreurs. Vérifie les informations avec tes cours.
          </p>
        </div>
      </footer>

      {toast && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-3.5 py-2 rounded-full bg-sphera-surface-2/95 border border-sphera-border shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 text-xs">
          {toast.type === 'success' ? (
            <Check className="w-3.5 h-3.5 text-sphera-green shrink-0" />
          ) : (
            <X className="w-3.5 h-3.5 text-red-400 shrink-0" />
          )}
          <span className="font-medium text-white">{toast.message}</span>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        setIsOpen={setIsDeleteModalOpen}
        onConfirm={confirmDeleteCurrentThread}
        title="Supprimer cette discussion ?"
        description="Tous les messages de cette conversation seront définitivement supprimés."
      />
    </div>
  )
}

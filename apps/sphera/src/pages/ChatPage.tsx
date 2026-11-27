import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import {
  Plus,
  ArrowLeft,
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
  Image as ImageIcon,
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import {
  getStandaloneChatThread,
  createStandaloneChatThread,
  uploadChatAttachment,
  streamThreadMessage,
  deleteChatThread,
  renameChatThread,
  createArtefact,
  type ChatThreadItem,
  type ChatMode,
  type ChatAttachment,
  type WebSource,
} from '../services/spheraApi'
import { AiMessageItem } from '../components/app/AiMessageItem'
import { DeleteConfirmModal } from '../components/app/DeleteConfirmModal'
import { LearningMemoryPopover } from '../components/app/LearningMemoryPopover'
import {
  ChatComposer,
  compressImageIfNeeded,
  MAX_ATTACHMENT_BYTES,
  MAX_CHAT_ATTACHMENTS,
  type ChatContextSelection,
  type PendingChatAttachment,
} from '../components/app/ChatComposer'
import { encodeHashId, parseSlugId } from '../lib/hashids'
import { invalidateSpheraSessions } from '../hooks/useSpheraQueries'

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
      attachments?: ChatAttachment[]
      status?: string | null
      searchQuery?: string | null
    }>
  >([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Pending image / PDF attachments (file picker, Ctrl+V paste, drag & drop)
  const [pendingAttachments, setPendingAttachments] = useState<PendingChatAttachment[]>([])
  const [isDraggingFiles, setIsDraggingFiles] = useState(false)
  const dragDepthRef = useRef(0)

  // Pedagogical chat mode, Web Search toggle & optional course/subject context (defaults to free general chat!)
  const [chatMode, setChatMode] = useState<ChatMode>('tutor')
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [attachedContext, setAttachedContext] = useState<ChatContextSelection>(null)

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
    const formatted: Array<{
      question: string
      answer: string
      id?: number
      sources?: WebSource[]
      attachments?: ChatAttachment[]
    }> = []
    for (let i = 0; i < rawMsgs.length; i++) {
      const m = rawMsgs[i]
      if (m.role === 'user') {
        const next = rawMsgs[i + 1]
        formatted.push({
          question: m.content,
          answer: next && next.role === 'assistant' ? next.content : '',
          id: m.id,
          attachments: Array.isArray(m.attachments) ? (m.attachments as ChatAttachment[]) : undefined,
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

  // ─── 2. Handle initial launch from Dashboard unified composer ─
  useEffect(() => {
    const state = (location.state as {
      initialQuestion?: string
      initialMode?: ChatMode
      initialContext?: ChatContextSelection
      initialWebSearch?: boolean
      initialAttachments?: ChatAttachment[]
    } | null)
    const initialQ = typeof state?.initialQuestion === 'string' ? state.initialQuestion.trim() : ''
    const initialAtts = Array.isArray(state?.initialAttachments) ? state.initialAttachments : []

    if (initialQ || initialAtts.length > 0) {
      if (state?.initialMode) setChatMode(state.initialMode)
      if (state?.initialContext !== undefined) setAttachedContext(state.initialContext)
      if (typeof state?.initialWebSearch === 'boolean') setWebSearchEnabled(state.initialWebSearch)
      navigate(location.pathname, { replace: true, state: {} })
      handleStartNewChatWithQuestion(initialQ, initialAtts, {
        mode: state?.initialMode,
        context: state?.initialContext,
        webSearch: state?.initialWebSearch,
      })
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

  // ─── Attachments (picker, Ctrl+V paste, drag & drop) ─────────
  const handleAddFiles = async (fileList: FileList | File[]) => {
    const files = Array.from(fileList)
    if (files.length === 0) return

    const remainingSlots = MAX_CHAT_ATTACHMENTS - pendingAttachments.length
    if (remainingSlots <= 0) {
      showToast(`Maximum ${MAX_CHAT_ATTACHMENTS} pièces jointes par message.`, 'error')
      return
    }

    const accepted = files.slice(0, remainingSlots)
    for (const rawFile of accepted) {
      const isImage = rawFile.type.startsWith('image/')
      const isPdf = rawFile.type === 'application/pdf' || /\.pdf$/i.test(rawFile.name)
      if (!isImage && !isPdf) {
        showToast(`Format non supporté : ${rawFile.name} (images ou PDF uniquement).`, 'error')
        continue
      }
      if (rawFile.size > MAX_ATTACHMENT_BYTES) {
        showToast(`${rawFile.name} dépasse la limite de 12 Mo.`, 'error')
        continue
      }

      const tempId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const previewUrl = isImage ? URL.createObjectURL(rawFile) : undefined

      setPendingAttachments((prev) => [
        ...prev,
        {
          tempId,
          name: rawFile.name || (isImage ? 'capture.png' : 'document.pdf'),
          type: isPdf ? 'pdf' : 'image',
          previewUrl,
          uploading: true,
        },
      ])

      try {
        const prepared = isImage ? await compressImageIfNeeded(rawFile) : rawFile
        const res = await uploadChatAttachment(prepared)
        const uploaded = res?.data
        if (!uploaded) throw new Error('Upload invalide')
        setPendingAttachments((prev) =>
          prev.map((item) =>
            item.tempId === tempId
              ? { ...item, uploading: false, uploaded, name: uploaded.name }
              : item,
          ),
        )
        if (uploaded.type === 'pdf' && uploaded.hasText === false) {
          showToast('PDF scanné détecté (peu de texte extractible) — une capture d’écran donnera un meilleur résultat.', 'error')
        }
      } catch (err: any) {
        console.error('Erreur upload pièce jointe:', err)
        setPendingAttachments((prev) => prev.filter((item) => item.tempId !== tempId))
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        showToast(err?.message || "Impossible d'envoyer la pièce jointe.", 'error')
      }
    }
  }

  const isUploadingAttachments = pendingAttachments.some((a) => a.uploading)

  // ─── 4. Send Message / Create Thread ─────────────────────────
  const buildStreamOptions = (extra?: {
    replaceFromTurnIndex?: number
    attachments?: ChatAttachment[]
    modeOverride?: ChatMode
    contextOverride?: ChatContextSelection
    webSearchOverride?: boolean
    onStatus?: (status: string, query?: string) => void
    onSources?: (sources: WebSource[]) => void
  }) => {
    const effectiveMode = extra?.modeOverride ?? chatMode
    const effectiveContext =
      extra?.contextOverride !== undefined ? extra.contextOverride : attachedContext
    const effectiveWebSearch =
      extra?.webSearchOverride !== undefined ? extra.webSearchOverride : webSearchEnabled
    return {
      replaceFromTurnIndex: extra?.replaceFromTurnIndex,
      attachments: extra?.attachments,
      onStatus: extra?.onStatus,
      onSources: extra?.onSources,
      mode: effectiveMode,
      contextSessionId: effectiveContext?.type === 'session' ? effectiveContext.id : null,
      contextSubjectId: effectiveContext?.type === 'subject' ? effectiveContext.id : null,
      webSearch: effectiveWebSearch,
    }
  }

  const handleStartNewChatWithQuestion = async (
    questionText: string,
    attachmentsToSend: ChatAttachment[] = [],
    overrides?: {
      mode?: ChatMode
      context?: ChatContextSelection
      webSearch?: boolean
    },
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    isInitialThreadLoadRef.current = false
    setIsSending(true)
    const effectiveWebSearch =
      overrides?.webSearch !== undefined ? overrides.webSearch : webSearchEnabled
    const effectiveContext =
      overrides?.context !== undefined ? overrides.context : attachedContext
    const hasImages = attachmentsToSend.some((a) => a.type === 'image')
    const displayQuestion =
      questionText ||
      (hasImages
        ? 'Analyse cette image et explique-la moi étape par étape.'
        : 'Analyse ce document PDF et résume les points essentiels.')
    const initialStatus = hasImages
      ? 'analyzing_image'
      : effectiveWebSearch
        ? 'searching_web'
        : effectiveContext
          ? 'reading_course'
          : 'thinking'

    setMessages([
      {
        question: displayQuestion,
        answer: '...',
        attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
        status: initialStatus,
      },
    ])

    try {
      // 1. Create the thread shell instantly (backend computes clean word-boundary title)
      const res = await createStandaloneChatThread({ title: displayQuestion.slice(0, 80) }, controller.signal)
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
          displayQuestion,
          (token) => {
            streamedText += token
            setMessages([
              {
                question: displayQuestion,
                answer: streamedText,
                attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
                sources: streamedSources,
                status: null,
              },
            ])
          },
          controller.signal,
          buildStreamOptions({
            attachments: attachmentsToSend,
            modeOverride: overrides?.mode,
            contextOverride: overrides?.context,
            webSearchOverride: overrides?.webSearch,
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

  const handleSendMessageWithText = async (text: string, attachmentsToSend: ChatAttachment[] = []) => {
    const trimmed = text.trim()
    if ((!trimmed && attachmentsToSend.length === 0) || isSending || isUploadingAttachments) return

    setInputMessage('')
    if (attachmentsToSend.length > 0) {
      pendingAttachments.forEach((p) => {
        if (p.previewUrl) URL.revokeObjectURL(p.previewUrl)
      })
      setPendingAttachments([])
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // If no active thread, create one with first message
    if (!activeThreadId) {
      await handleStartNewChatWithQuestion(trimmed, attachmentsToSend)
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    const hasImages = attachmentsToSend.some((a) => a.type === 'image')
    const displayQuestion =
      trimmed ||
      (hasImages
        ? 'Analyse cette image et explique-la moi étape par étape.'
        : 'Analyse ce document PDF et résume les points essentiels.')
    const initialStatus = hasImages
      ? 'analyzing_image'
      : webSearchEnabled
        ? 'searching_web'
        : attachedContext
          ? 'reading_course'
          : 'thinking'

    // Append to current thread with loading indicator
    const newMsgIndex = messages.length
    setMessages((prev) => [
      ...prev,
      {
        question: displayQuestion,
        answer: '...',
        attachments: attachmentsToSend.length > 0 ? attachmentsToSend : undefined,
        status: initialStatus,
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
        displayQuestion,
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
          attachments: attachmentsToSend,
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

  const handleComposerSubmit = ({
    text,
    attachments,
  }: {
    text: string
    attachments: ChatAttachment[]
  }) => {
    handleSendMessageWithText(text, attachments)
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

    const existingAttachments = messages[index]?.attachments
    const hasImages = Boolean(existingAttachments?.some((a) => a.type === 'image'))
    setIsSending(true)
    setMessages((prev) => [
      ...prev.slice(0, index),
      {
        question: newQuestion,
        answer: '...',
        attachments: existingAttachments,
        status: hasImages ? 'analyzing_image' : webSearchEnabled ? 'searching_web' : 'thinking',
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
          attachments: existingAttachments,
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

  return (
    <div
      className="flex flex-col h-full w-full bg-sphera-bg overflow-hidden relative font-sans"
      onDragEnter={(e) => {
        if (e.dataTransfer?.types?.includes('Files')) {
          e.preventDefault()
          dragDepthRef.current += 1
          setIsDraggingFiles(true)
        }
      }}
      onDragOver={(e) => {
        if (e.dataTransfer?.types?.includes('Files')) {
          e.preventDefault()
        }
      }}
      onDragLeave={(e) => {
        if (e.dataTransfer?.types?.includes('Files')) {
          e.preventDefault()
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
          if (dragDepthRef.current === 0) setIsDraggingFiles(false)
        }
      }}
      onDrop={(e) => {
        if (e.dataTransfer?.files?.length) {
          e.preventDefault()
          dragDepthRef.current = 0
          setIsDraggingFiles(false)
          void handleAddFiles(e.dataTransfer.files)
        }
      }}
    >
      {/* Drag & Drop Full-Workspace Overlay */}
      {isDraggingFiles && (
        <div className="fixed inset-0 z-50 bg-sphera-bg/80 backdrop-blur-sm flex items-center justify-center p-6 pointer-events-none animate-in fade-in duration-150">
          <div className="flex flex-col items-center gap-3 px-8 py-7 rounded-3xl border-2 border-dashed border-sphera-green/70 bg-sphera-surface-2/95 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-sphera-green/15 border border-sphera-green/35 flex items-center justify-center text-sphera-green">
              <ImageIcon weight="duotone" className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-white">Dépose ton image ou ton PDF ici</p>
            <p className="text-xs text-sphera-text-muted">Photo d&apos;exercice, schéma, capture d&apos;écran ou document PDF</p>
          </div>
        </div>
      )}

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
          <LearningMemoryPopover
            onAskCoaching={(prompt) => handleSendMessageWithText(prompt)}
            onFeedback={showToast}
          />
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
                  attachments={msg.attachments}
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

          {/* Unified Option B Composer (+ Menu: Files, @ Context, Web + Single Mode Pill) */}
          <ChatComposer
            value={inputMessage}
            onChange={setInputMessage}
            onSubmit={handleComposerSubmit}
            onStop={handleStopChat}
            isSending={isSending}
            mode={chatMode}
            onModeChange={setChatMode}
            context={attachedContext}
            onContextChange={setAttachedContext}
            webSearch={webSearchEnabled}
            onWebSearchChange={setWebSearchEnabled}
            pendingAttachments={pendingAttachments}
            onPendingAttachmentsChange={setPendingAttachments}
            onNotify={showToast}
            menuPlacement="top"
            textareaRef={textareaRef}
          />

          <p className="text-center text-[11px] text-sphera-text-muted/80 mt-1.5 block">
            Sphera peut faire des erreurs. Pense à vérifier les informations importantes.
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

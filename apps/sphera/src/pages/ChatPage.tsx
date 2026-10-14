import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom'
import {
  ChatCircle,
  Plus,
  ArrowLeft,
  ArrowUp,
  Trash,
  PencilSimple,
  Check,
  X,
  Sparkle,
  BookOpen,
  Lightbulb,
  GraduationCap,
  Spinner as Loader2
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import {
  getStandaloneChatThread,
  createStandaloneChatThread,
  sendThreadMessage,
  deleteChatThread,
  renameChatThread,
  type ChatThreadItem,
  createArtefact
} from '../services/spheraApi'
import { AiMessageItem } from '../components/app/AiMessageItem'
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
  const [messages, setMessages] = useState<Array<{ question: string; answer: string; id?: number }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Rename thread state
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitleValue, setEditTitleValue] = useState('')

  const chatBottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const formatThreadMessages = (rawMsgs: any[] = []) => {
    const formatted: Array<{ question: string; answer: string; id?: number }> = []
    for (let i = 0; i < rawMsgs.length; i++) {
      const m = rawMsgs[i]
      if (m.role === 'user') {
        const next = rawMsgs[i + 1]
        formatted.push({
          question: m.content,
          answer: next && next.role === 'assistant' ? next.content : '',
          id: m.id
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

  // Scroll to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isSending])

  // ─── 4. Send Message / Create Thread ─────────────────────────
  const handleStartNewChatWithQuestion = async (questionText: string) => {
    setIsSending(true)
    const tempQuestion = questionText
    setMessages([{ question: tempQuestion, answer: '...' }])

    try {
      const res = await createStandaloneChatThread({ question: tempQuestion })
      const newThread = res?.data
      if (newThread) {
        setActiveThreadId(newThread.id)
        setActiveThread(newThread)
        if (newThread.messages && newThread.messages.length > 0) {
          setMessages(formatThreadMessages(newThread.messages))
        }
        const hash = encodeHashId(newThread.id) || newThread.id
        navigate(`/chat/${hash}`, { replace: true })
        invalidateSpheraSessions()
      }
    } catch (err) {
      console.error('Erreur initialisation chat:', err)
      setMessages([])
    } finally {
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

    // Append to current thread
    const newMsgIndex = messages.length
    setMessages((prev) => [...prev, { question: trimmed, answer: '...' }])
    setIsSending(true)

    try {
      const res = await sendThreadMessage(activeThreadId, trimmed)
      const assistantMsg = res?.data
      if (assistantMsg) {
        setMessages((prev) => {
          const updated = [...prev]
          if (updated[newMsgIndex]) {
            updated[newMsgIndex] = {
              ...updated[newMsgIndex],
              answer: assistantMsg.content
            }
          }
          return updated
        })
      }
      invalidateSpheraSessions()
    } catch (err: any) {
      console.error('Erreur envoi message:', err)
      setMessages((prev) => {
        const updated = [...prev]
        if (updated[newMsgIndex]) {
          updated[newMsgIndex] = {
            ...updated[newMsgIndex],
            answer: "Une erreur est survenue lors de la réponse. Veuillez réessayer."
          }
        }
        return updated
      })
    } finally {
      setIsSending(false)
    }
  }

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    handleSendMessageWithText(inputMessage)
  }

  // Handle Edit & Regenerate
  const handleEditMessage = async (index: number, newQuestion: string) => {
    if (!activeThreadId || isSending) return
    setIsSending(true)
    setMessages((prev) => {
      const updated = [...prev]
      if (updated[index]) {
        updated[index] = { question: newQuestion, answer: '...' }
      }
      return updated
    })

    try {
      const res = await sendThreadMessage(activeThreadId, newQuestion)
      const assistantMsg = res?.data
      if (assistantMsg) {
        setMessages((prev) => {
          const updated = [...prev]
          if (updated[index]) {
            updated[index] = { ...updated[index], answer: assistantMsg.content }
          }
          return updated
        })
      }
    } catch (err) {
      console.error('Erreur modification message:', err)
    } finally {
      setIsSending(false)
    }
  }

  const handleRegenerate = async (index: number) => {
    const target = messages[index]
    if (!target || !activeThreadId || isSending) return
    handleEditMessage(index, target.question)
  }

  // Create Note from answer
  const handleCreateNote = async (question: string, answer: string) => {
    if (!activeThread?.sessionId) return
    try {
      await createArtefact(activeThread.sessionId, {
        type: 'note',
        title: question.length > 40 ? question.slice(0, 40) + '…' : question,
        content: `# ${question}\n\n${answer}`
      })
    } catch (err) {
      console.error('Erreur création note:', err)
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

  const handleDeleteCurrentThread = async () => {
    if (!activeThreadId) return
    const confirmDelete = window.confirm("Supprimer cette discussion ?")
    if (!confirmDelete) return

    try {
      await deleteChatThread(activeThreadId)
      invalidateSpheraSessions()
      handleCreateNewThread()
    } catch (err) {
      console.error('Erreur suppression discussion:', err)
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
      handleSendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-sphera-bg overflow-hidden relative font-sans">

      {/* ─── TOP HEADER ────────────────────────────────────────── */}
      <header className="h-14 border-b border-sphera-border px-3 sm:px-6 flex items-center justify-between bg-sphera-surface-2/80 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            to="/app"
            className="flex items-center gap-1.5 text-xs font-medium text-sphera-text-muted hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Accueil</span>
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

      {/* ─── MAIN CONVERSATION AREA ────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-sphera-bg relative">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 pb-28 sm:pb-32 custom-scrollbar min-h-0">
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
                  Sphera est ton tuteur académique universel. Pose une question libre, résous un problème ou approfondis un sujet de cours.
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
                    onEdit={handleEditMessage}
                    onRegenerate={handleRegenerate}
                    onCreateNote={handleCreateNote}
                    onSelectSuggestion={(sug) => handleSendMessageWithText(sug)}
                    disabled={isSending}
                  />
                ))}
                <div ref={chatBottomRef} />
              </div>
            )}
          </div>
        </div>

        {/* ─── FLOATING ROUNDED INPUT PILL (Matches Accueil/Dashboard) ─── */}
        <div className="absolute bottom-0 inset-x-0 pb-3 sm:pb-4 pt-10 px-3 sm:px-4 bg-gradient-to-t from-sphera-bg via-sphera-bg/95 to-transparent pointer-events-none z-20">
          <div className="max-w-2xl mx-auto w-full pointer-events-auto">
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
                disabled={isSending}
                className="flex-1 bg-transparent border-0 text-xs sm:text-sm text-white placeholder-sphera-text-muted outline-none focus:ring-0 resize-none max-h-32 py-1.5 leading-relaxed"
              />

              <button
                type="submit"
                disabled={!inputMessage.trim() || isSending}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sphera-green hover:bg-sphera-green-hover disabled:opacity-40 text-black flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md shadow-sphera-green/20 cursor-pointer"
                title="Envoyer la question"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                ) : (
                  <ArrowUp className="w-4 h-4 font-bold" />
                )}
              </button>
            </form>

            <p className="text-center text-[10px] text-sphera-text-muted/60 mt-1.5 block">
              Sphera peut faire des erreurs. Vérifie les informations avec tes cours.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

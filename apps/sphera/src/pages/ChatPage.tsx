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
  List as Menu,
  CaretLeft,
  Spinner as Loader2
} from '@phosphor-icons/react'
import { useTranslation } from 'react-i18next'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import {
  getStandaloneChatThreads,
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

  // Threads list & active thread
  const [threads, setThreads] = useState<ChatThreadItem[]>([])
  const [activeThreadId, setActiveThreadId] = useState<number | null>(() => {
    return paramThreadId ? parseSlugId(paramThreadId) : null
  })
  const [activeThread, setActiveThread] = useState<ChatThreadItem | null>(null)
  const [isLoadingThreads, setIsLoadingThreads] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  // Messages in current thread
  const [messages, setMessages] = useState<Array<{ question: string; answer: string; id?: number }>>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)

  // Responsive Sidebar (closed by default on mobile < 768px)
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  })

  // Rename thread state
  const [editingThreadId, setEditingThreadId] = useState<number | null>(null)
  const [editThreadTitle, setEditThreadTitle] = useState('')

  const chatBottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // ─── 1. Load Standalone Chat Threads ─────────────────────────
  const fetchThreads = async () => {
    try {
      const res = await getStandaloneChatThreads()
      const list = res?.data || []
      setThreads(list)
      return list
    } catch (err) {
      console.error('Erreur chargement des discussions:', err)
      return []
    } finally {
      setIsLoadingThreads(false)
    }
  }

  useEffect(() => {
    fetchThreads().then(() => {
      if (paramThreadId) {
        const idNum = parseSlugId(paramThreadId)
        setActiveThreadId(idNum)
      } else {
        // Staying on /chat means a clean slate for a new conversation
        setActiveThreadId(null)
        setActiveThread(null)
        setMessages([])
      }
    })
  }, [paramThreadId])

  // ─── 2. Handle initialQuestion from Dashboard ────────────────
  useEffect(() => {
    const initialQ = (location.state as any)?.initialQuestion
    if (initialQ && typeof initialQ === 'string' && initialQ.trim()) {
      // Clear location state so it doesn't trigger again
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
          // Format messages for AiMessageItem
          const formatted: Array<{ question: string; answer: string; id?: number }> = []
          const rawMsgs = thread.messages || []
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
          setMessages(formatted)
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
        setThreads((prev) => [newThread, ...prev])
        setActiveThreadId(newThread.id)
        setActiveThread(newThread)
        const hash = encodeHashId(newThread.id) || newThread.id
        navigate(`/chat/${hash}`, { replace: true })
      }
    } catch (err) {
      console.error('Erreur initialisation chat:', err)
      setMessages([])
    } finally {
      setIsSending(false)
    }
  }

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = inputMessage.trim()
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
      fetchThreads()
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
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
    textareaRef.current?.focus()
  }

  const handleDeleteThread = async (e: React.MouseEvent, threadId: number) => {
    e.stopPropagation()
    try {
      await deleteChatThread(threadId)
      setThreads((prev) => prev.filter((t) => t.id !== threadId))
      if (activeThreadId === threadId) {
        handleCreateNewThread()
      }
    } catch (err) {
      console.error('Erreur suppression discussion:', err)
    }
  }

  const handleStartRename = (e: React.MouseEvent, tItem: ChatThreadItem) => {
    e.stopPropagation()
    setEditingThreadId(tItem.id)
    setEditThreadTitle(tItem.title)
  }

  const handleSaveRename = async (e: React.MouseEvent | React.KeyboardEvent, threadId: number) => {
    e.stopPropagation()
    const trimmed = editThreadTitle.trim()
    if (!trimmed) {
      setEditingThreadId(null)
      return
    }

    try {
      await renameChatThread(threadId, trimmed)
      setThreads((prev) =>
        prev.map((t) => (t.id === threadId ? { ...t, title: trimmed } : t))
      )
      if (activeThread?.id === threadId) {
        setActiveThread((prev) => (prev ? { ...prev, title: trimmed } : prev))
      }
    } catch (err) {
      console.error('Erreur renommage discussion:', err)
    } finally {
      setEditingThreadId(null)
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
    <div className="flex h-full w-full bg-sphera-bg overflow-hidden relative font-sans">
      
      {/* ─── MOBILE BACKDROP (When drawer is open) ─────────────── */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-30 transition-opacity animate-in fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ─── LEFT SUB-PANEL: Discussion History ───────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 md:static bg-sphera-surface-2 border-r border-sphera-border flex flex-col transition-all duration-300 shadow-2xl md:shadow-none ${
          isSidebarOpen ? 'w-72 translate-x-0' : 'w-0 -translate-x-full md:w-0 md:translate-x-0 overflow-hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-14 border-b border-sphera-border px-4 flex items-center justify-between shrink-0 bg-sphera-surface-2">
          <div className="flex items-center gap-2">
            <ChatCircle className="w-5 h-5 text-sphera-green" />
            <span className="font-semibold text-sm text-white">Discussions</span>
          </div>
          <button
            type="button"
            onClick={handleCreateNewThread}
            className="p-1.5 rounded-lg bg-sphera-surface hover:bg-sphera-surface-2 text-sphera-text-muted hover:text-white border border-sphera-border transition-colors flex items-center gap-1.5 text-xs font-medium cursor-pointer"
            title="Nouvelle discussion"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau</span>
          </button>
        </div>

        {/* Sidebar Threads List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar min-h-0">
          {isLoadingThreads ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-9 bg-sphera-surface/50 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : threads.length === 0 ? (
            <div className="p-6 text-center text-xs text-sphera-text-muted">
              <ChatCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-sphera-text-muted" />
              <p>Aucune discussion enregistrée.</p>
              <p className="mt-1 text-[11px] opacity-75">Posez votre première question pour commencer !</p>
            </div>
          ) : (
            threads.map((tItem) => {
              const isActive = activeThreadId === tItem.id
              const isEditing = editingThreadId === tItem.id
              const hash = encodeHashId(tItem.id) || tItem.id

              return (
                <div
                  key={tItem.id}
                  onClick={() => {
                    setActiveThreadId(tItem.id)
                    navigate(`/chat/${hash}`)
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      setIsSidebarOpen(false)
                    }
                  }}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-sphera-surface text-white border border-sphera-border shadow-sm'
                      : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface/60'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editThreadTitle}
                        onChange={(e) => setEditThreadTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(e, tItem.id)
                          if (e.key === 'Escape') setEditingThreadId(null)
                        }}
                        autoFocus
                        className="flex-1 bg-sphera-bg border border-sphera-green/50 rounded-lg px-2 py-1 text-xs text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveRename(e, tItem.id)}
                        className="p-1 text-sphera-green hover:text-white rounded transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingThreadId(null)}
                        className="p-1 text-sphera-text-muted hover:text-white rounded transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                        <ChatCircle className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sphera-green' : 'text-sphera-text-muted'}`} />
                        <span className="truncate">{tItem.title}</span>
                      </div>

                      {/* Action buttons (Rename, Delete) */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => handleStartRename(e, tItem)}
                          className="p-1 rounded text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2 transition-colors"
                          title="Renommer"
                        >
                          <PencilSimple className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteThread(e, tItem.id)}
                          className="p-1 rounded text-sphera-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Supprimer"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </aside>

      {/* ─── RIGHT MAIN PANEL: Chat Conversation ──────────────── */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-sphera-bg relative">
        
        {/* Top Header */}
        <header className="h-14 border-b border-sphera-border px-3 sm:px-4 flex items-center justify-between bg-sphera-surface-2/80 backdrop-blur-md shrink-0 z-10">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors cursor-pointer"
              title={isSidebarOpen ? "Masquer l'historique" : "Afficher l'historique"}
            >
              {isSidebarOpen ? <CaretLeft className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <Link
              to="/app"
              className="flex items-center gap-1 text-xs font-medium text-sphera-text-muted hover:text-white transition-colors shrink-0"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Accueil</span>
            </Link>

            <div className="h-4 w-px bg-sphera-border mx-0.5 sm:mx-1" />

            <h1 className="text-xs sm:text-sm font-semibold text-white truncate max-w-[150px] xs:max-w-[200px] sm:max-w-md">
              {activeThread?.title || 'Nouvelle discussion'}
            </h1>
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
                        onClick={() => {
                          setInputMessage(item.prompt)
                          textareaRef.current?.focus()
                        }}
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
                placeholder="Pose ta question académique libre..."
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

            <p className="text-center text-[10px] text-sphera-text-muted/60 mt-1.5 hidden sm:block">
              Sphera peut faire des erreurs. Vérifie les informations avec tes cours.
            </p>
          </div>
        </div>

      </main>
    </div>
  )
}

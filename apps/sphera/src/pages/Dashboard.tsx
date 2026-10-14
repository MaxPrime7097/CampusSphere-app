import React, { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FileText,
  Calendar,
  ArrowRight,
  NotePencil as FilePenLine,
  ShareNetwork as Share2,
  Trash as Trash2,
  BookOpen,
  Exam,
  UploadSimple,
  ClipboardText,
  ArrowUp,
  Sparkle,
  ChatCircle,
  Spinner as Loader2
} from "@phosphor-icons/react";
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import {
  getSessions,
  getAnnales,
  deleteSession,
  deleteAnnale,
  deleteChatThread,
  shareSession,
  shareAnnale,
  createStandaloneChatThread
} from '../services/spheraApi'
import { setPendingUploadFile } from '../store/fileStore'
import { QuotaIndicator } from '../components/app/QuotaIndicator'
import { PasteTextModal } from '../components/app/PasteTextModal'
import { DeleteConfirmModal } from '../components/app/DeleteConfirmModal'
import { ShareModal } from '../components/app/ShareModal'
import { useSessionsQuery, useAnnalesQuery, useChatThreadsQuery, invalidateSpheraSessions } from '../hooks/useSpheraQueries'
import { encodeHashId } from '../lib/hashids'

// Force Vite HMR reload
export default function Dashboard() {
  const { t } = useTranslation('study')
  const { user } = useSpheraAuth()
  const navigate = useNavigate()
  
  // Upload & Chat State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false)
  const [chatPrompt, setChatPrompt] = useState('')
  const [isStartingChat, setIsStartingChat] = useState(false)
  const [isDraggingFile, setIsDraggingFile] = useState(false)

  // Quick Action Modals State
  const [itemToDelete, setItemToDelete] = useState<{ id: string | number; type: 'session' | 'annale' | 'chat'; title: string } | null>(null)
  const [shareModalData, setShareModalData] = useState<{ url: string; title: string } | null>(null)

  // Pagination for Récents (6 per page + view all toggle)
  const [displayLimit, setDisplayLimit] = useState(6)
  const [showAll, setShowAll] = useState(false)

  // TanStack Query Sessions, Annales & Chats
  const { data: sessions = [], isLoading: isLoadingSessions } = useSessionsQuery()
  const { data: annales = [], isLoading: isLoadingAnnales } = useAnnalesQuery()
  const { data: chatThreads = [], isLoading: isLoadingChats } = useChatThreadsQuery()

  const allItems = React.useMemo(() => {
    const sess = (sessions || [])
      .filter((s: any) => s.source_filename !== 'Discussion libre' && s.sourceFilename !== 'Discussion libre' && s.source_filename !== '__sphera_standalone_chat__' && s.sourceFilename !== '__sphera_standalone_chat__')
      .map((s: any) => ({ ...s, _type: 'session' }))
    const ann = (annales || []).map((a: any) => ({ ...a, _type: 'annale' }))
    const chats = (chatThreads || []).map((c: any) => ({ ...c, _type: 'chat' }))

    return [...sess, ...ann, ...chats].sort((a, b) => {
      const da = new Date(a.updatedAt || a.updated_at || a.created_at || a.createdAt || 0).getTime()
      const db = new Date(b.updatedAt || b.updated_at || b.created_at || b.createdAt || 0).getTime()
      return db - da
    })
  }, [sessions, annales, chatThreads])

  const isLoadingAll = (isLoadingSessions || isLoadingAnnales || isLoadingChats)
  const showSkeleton = isLoadingAll && allItems.length === 0
  const displayedItems = showAll ? allItems : allItems.slice(0, displayLimit)

  const getItemIcon = (type: string) => {
    if (type === 'chat') {
      return <ChatCircle className="w-5 h-5 text-sky-400" />
    }
    if (type === 'annale') {
      return <Exam className="w-5 h-5 text-orange-400" />
    }
    return <BookOpen className="w-5 h-5 text-sphera-green" />
  }

  const getItemPath = (item: any) => {
    const hashId = encodeHashId(item.id) || item.id
    if (item._type === 'chat') return `/chat/${hashId}`
    if (item._type === 'annale') return `/annales/${hashId}`
    return `/sessions/${hashId}`
  }

  const handleFileSelect = (f: File | null) => {
    if (!f) return
    setPendingUploadFile(f)
    navigate('/create')
  }

  const handlePasteConfirm = (text: string, title: string) => {
    setIsPasteModalOpen(false)
    const safeTitle = title.replace(/[/\\?%*:|"<>]/g, '-').trim() || 'Notes-de-cours'
    const virtualFile = new File([text], `${safeTitle}.md`, {
      type: 'text/markdown',
      lastModified: Date.now(),
    })
    setPendingUploadFile(virtualFile)
    navigate('/create')
  }

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return
    try {
      if (itemToDelete.type === 'annale') {
        await deleteAnnale(itemToDelete.id)
      } else if (itemToDelete.type === 'chat') {
        await deleteChatThread(itemToDelete.id)
      } else {
        await deleteSession(itemToDelete.id)
      }
      invalidateSpheraSessions()
      window.dispatchEvent(new CustomEvent('sphera:session-deleted', { detail: { id: itemToDelete.id } }))
    } catch (e) {
      console.error("Erreur lors de la suppression:", e)
    } finally {
      setItemToDelete(null)
    }
  }

  const handleShareClick = async (e: React.MouseEvent, item: any) => {
    e.preventDefault()
    e.stopPropagation()
    const isChat = item._type === 'chat'
    const isAnnale = item._type === 'annale'
    try {
      if (!isChat && !item.is_shared) {
        if (isAnnale) await shareAnnale(item.id)
        else await shareSession(item.id)
      }
      const hashId = encodeHashId(item.id) || item.id
      const sharePath = isChat ? `/chat/${hashId}` : isAnnale ? `/annales/${hashId}` : `/sessions/${hashId}`
      const url = `${window.location.origin}${sharePath}`
      setShareModalData({
        url,
        title: item.title || item.resource_title || (isChat ? 'Discussion partagée' : isAnnale ? 'Annale partagée' : 'Session partagée')
      })
    } catch (e) {
      console.error("Erreur partage:", e)
    }
  }

  const handleChatSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = chatPrompt.trim()
    if (!trimmed || isStartingChat) return
    setIsStartingChat(true)
    try {
      const res = await createStandaloneChatThread({ question: trimmed })
      const threadId = res?.data?.id
      if (threadId) {
        navigate(`/chat/${encodeHashId(threadId) || threadId}`)
      } else {
        navigate('/chat', { state: { initialQuestion: trimmed } })
      }
    } catch (err) {
      console.error('Erreur création discussion:', err)
      navigate('/chat', { state: { initialQuestion: trimmed } })
    } finally {
      setIsStartingChat(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-12">
      <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-0 sm:px-4">
        
        {/* Welcome Area */}
        <div className="text-center mb-8 mt-6 px-4 sm:px-0">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
            Salut {user?.first_name || user?.username || 'Spherian'}, prêt à apprendre ?
          </h1>
          <p className="text-sphera-text-muted text-sm sm:text-base max-w-xl mx-auto">
            Génère des fiches & quiz à partir de tes cours, ou échange directement avec ton tuteur IA.
          </p>
          <div className="flex justify-center mt-3">
            <QuotaIndicator />
          </div>
        </div>

        {/* ─── Action Cards (Télécharger / Coller) ─────────────── */}
        <div className="max-w-2xl mx-auto mb-4 px-4 sm:px-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            {/* Card 1: Télécharger */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setIsDraggingFile(true)
              }}
              onDragLeave={() => setIsDraggingFile(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDraggingFile(false)
                const f = e.dataTransfer.files?.[0]
                if (f) handleFileSelect(f)
              }}
              className={`relative bg-sphera-surface-2 border rounded-2xl p-5 transition-all cursor-pointer group flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-lg ${
                isDraggingFile
                  ? 'border-sphera-green bg-sphera-green/5 ring-2 ring-sphera-green/20'
                  : 'border-sphera-border hover:border-sphera-green/40 hover:bg-sphera-surface'
              }`}
            >
              {/* Upload Card */}
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-sphera-surface border border-sphera-border group-hover:border-sphera-green/40 flex items-center justify-center text-sphera-green transition-all shadow-sm">
                  <UploadSimple className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-sphera-green transition-colors mb-0.5">
                  Télécharger
                </h3>
                <p className="text-xs text-sphera-text-muted">
                  PDF, DOCX, TXT, MD ou Images
                </p>
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.docx,.txt,.md,.markdown,text/markdown,.png,.jpg,.jpeg,.webp"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              />
            </div>

            {/* Card 2: Coller */}
            <div
              onClick={() => setIsPasteModalOpen(true)}
              className="relative bg-sphera-surface-2 border border-sphera-border hover:border-sphera-green/40 hover:bg-sphera-surface rounded-2xl p-5 transition-all cursor-pointer group flex flex-col justify-between shadow-sm hover:shadow-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-sphera-surface border border-sphera-border group-hover:border-sphera-green/40 flex items-center justify-center text-sphera-green transition-all shadow-sm">
                  <ClipboardText className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white group-hover:text-sphera-green transition-colors mb-0.5">
                  Coller
                </h3>
                <p className="text-xs text-sphera-text-muted">
                  Texte copié ou rédigé directement
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Universal Chat Input Bar ────────────────────────── */}
        <div className="max-w-2xl mx-auto mb-14 px-4 sm:px-0">
          <form
            onSubmit={handleChatSubmit}
            className="relative flex items-center gap-2 bg-sphera-surface-2 border border-sphera-border hover:border-sphera-border/90 focus-within:border-sphera-green/60 rounded-full p-2 pl-5 shadow-lg transition-all"
          >
            <input
              type="text"
              value={chatPrompt}
              onChange={(e) => setChatPrompt(e.target.value)}
              placeholder="Demande n'importe quoi..."
              disabled={isStartingChat}
              className="flex-1 bg-transparent border-none text-sm text-white placeholder-sphera-text-muted outline-none focus:ring-0 pr-2"
            />
            <button
              type="submit"
              disabled={!chatPrompt.trim() || isStartingChat}
              className="w-9 h-9 rounded-full bg-sphera-green hover:bg-sphera-green-hover disabled:opacity-40 disabled:hover:bg-sphera-green text-black flex items-center justify-center shrink-0 shadow-md active:scale-95 transition-all cursor-pointer"
              title="Poser la question à Sphera"
            >
              {isStartingChat ? (
                <Loader2 className="w-4 h-4 animate-spin text-black" />
              ) : (
                <ArrowUp className="w-4 h-4 font-bold" />
              )}
            </button>
          </form>
        </div>

        {/* Paste Text Modal */}
        <PasteTextModal
          isOpen={isPasteModalOpen}
          onClose={() => setIsPasteModalOpen(false)}
          onConfirm={handlePasteConfirm}
        />

        {/* Section Header: Récents + Voir tout */}
        <div className="flex items-center justify-between mb-6 px-4 sm:px-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">Récents</h2>
            {allItems.length > 0 && (
              <span className="text-xs text-sphera-text-muted">({allItems.length})</span>
            )}
          </div>
          {allItems.length > 8 && (
            <button
              type="button"
              onClick={() => setShowAll(prev => !prev)}
              className="text-xs font-semibold text-sphera-green hover:underline cursor-pointer transition-colors"
            >
              {showAll ? 'Réduire' : 'Voir tout'}
            </button>
          )}
        </div>

        {/* Unified Récents Grid */}
        <>
          {showSkeleton ? (
            <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map(idx => (
                <div key={idx} className="sphera-card p-5 block rounded-none sm:rounded-2xl border-x-0 sm:border-x animate-pulse">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-sphera-surface-2" />
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sphera-surface-2" />
                      <div className="w-7 h-7 rounded-lg bg-sphera-surface-2" />
                    </div>
                  </div>
                  <div className="h-4 bg-sphera-surface-2 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-sphera-surface-2/60 rounded w-1/2 mb-4" />
                  <div className="flex items-center justify-between pt-2 border-t border-sphera-border/40">
                    <div className="h-3 bg-sphera-surface-2 rounded w-20" />
                    <div className="h-4 bg-sphera-surface-2 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="text-center p-12 bg-sphera-surface-2 rounded-2xl border border-sphera-border mx-4 sm:mx-0">
              <BookOpen className="w-12 h-12 text-sphera-green/50 mx-auto mb-4" />
              <p className="text-white font-medium mb-1">Aucune activité récente</p>
              <p className="text-sm text-sphera-text-muted">Importez un cours, une annale ou posez une question pour commencer vos révisions !</p>
            </div>
          ) : (
            <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-4">
              {displayedItems.map(item => {
                const itemTitle = item.title || item.resource_title || (item._type === 'chat' ? 'Discussion' : `Session #${item.id}`)
                const itemSubtitle = item._type === 'chat'
                  ? (item.messages?.length ? `${item.messages.length} message(s)` : 'Discussion libre')
                  : `Extrait de ${item.source_filename || 'document'}`
                const itemBadge = item._type === 'chat'
                  ? 'Chat'
                  : item._type === 'annale'
                    ? 'Annale'
                    : (item.tool_types?.join(', ') || 'Cours')

                return (
                  <Link 
                    key={`${item._type}-${item.id}`} 
                    to={getItemPath(item)}
                    className="sphera-card p-5 group hover:-translate-y-1 hover:border-sphera-border/80 hover:bg-sphera-surface-2 transition-all block rounded-none sm:rounded-2xl border-x-0 sm:border-x"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-sphera-bg border border-sphera-border flex items-center justify-center">
                        {getItemIcon(item._type)}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => handleShareClick(e, item)}
                          className="p-1.5 rounded-lg text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                          title="Partager"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setItemToDelete({
                              id: item.id,
                              type: item._type,
                              title: itemTitle
                            });
                          }}
                          className="p-1.5 rounded-lg text-sphera-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ArrowRight className="w-4 h-4 text-sphera-text-muted opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
                      </div>
                    </div>
                    <h3 className="text-white font-medium mb-1 line-clamp-1">{itemTitle}</h3>
                    <p className="text-xs text-sphera-text-muted mb-4 line-clamp-1">{itemSubtitle}</p>
                    
                    <div className="flex items-center justify-between text-xs text-sphera-text-muted">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.updatedAt || item.updated_at || item.created_at || item.createdAt || Date.now()).toLocaleDateString('fr-FR')}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider border ${
                        item._type === 'chat'
                          ? 'bg-sky-500/10 border-sky-500/30 text-sky-400'
                          : item._type === 'annale'
                            ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                            : 'bg-sphera-surface border-sphera-border text-sphera-text-muted'
                      }`}>
                        {itemBadge}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* Button Voir plus (+6) */}
          {!showAll && allItems.length > displayLimit && (
            <div className="flex justify-center mt-8 px-4 sm:px-0">
              <button
                type="button"
                onClick={() => setDisplayLimit(prev => prev + 6)}
                className="px-6 py-2.5 rounded-full border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 text-white text-xs font-semibold transition-all shadow-sm hover:border-sphera-green/40 cursor-pointer"
              >
                Voir plus (+{Math.min(6, allItems.length - displayLimit)})
              </button>
            </div>
          )}
        </>
      </main>

      <DeleteConfirmModal
        isOpen={Boolean(itemToDelete)}
        setIsOpen={(open) => {
          if (!open) setItemToDelete(null)
        }}
        onConfirm={handleDeleteConfirm}
        title={itemToDelete?.type === 'annale' ? "Supprimer l'annale ?" : itemToDelete?.type === 'chat' ? "Supprimer la discussion ?" : "Supprimer la session ?"}
        description="Cette action est irréversible. Toutes les données associées seront définitivement supprimées."
      />

      <ShareModal
        isOpen={Boolean(shareModalData)}
        setIsOpen={(open) => {
          if (!open) setShareModalData(null)
        }}
        url={shareModalData?.url || ''}
        title={shareModalData?.title || 'Lien public'}
      />
    </div>
  )
}

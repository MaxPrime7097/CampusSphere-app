import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FileText, Calendar, ArrowRight, NotePencil as FilePenLine, ShareNetwork as Share2, Trash as Trash2, BookOpen, Exam } from "@phosphor-icons/react";
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import { getSessions, getAnnales, deleteSession, deleteAnnale, shareSession, shareAnnale } from '../services/spheraApi'
import { UploadZone } from '../components/app/UploadZone'
import { setPendingUploadFile } from '../store/fileStore'
import { QuotaIndicator } from '../components/app/QuotaIndicator'
import { PasteTextModal } from '../components/app/PasteTextModal'
import { DeleteConfirmModal } from '../components/app/DeleteConfirmModal'
import { ShareModal } from '../components/app/ShareModal'
import { useSessionsQuery, useAnnalesQuery, invalidateSpheraSessions } from '../hooks/useSpheraQueries'

// Force Vite HMR reload
export default function Dashboard() {
  const { t } = useTranslation('study')
  const { user } = useSpheraAuth()
  const navigate = useNavigate()
  
  // Upload State
  const [error, setError] = useState<string | null>(null)
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false)

  // Quick Action Modals State
  const [itemToDelete, setItemToDelete] = useState<{ id: string | number; type: 'session' | 'annale'; title: string } | null>(null)
  const [shareModalData, setShareModalData] = useState<{ url: string; title: string } | null>(null)

  // Tabs State
  const [activeTab, setActiveTab] = useState<'sessions' | 'annales' | 'live'>('sessions')

  // TanStack Query Sessions & Annales
  const { data: sessions = [], isLoading: isLoadingSessions } = useSessionsQuery()
  const { data: annales = [], isLoading: isLoadingAnnales } = useAnnalesQuery()
  const loadingSessions = activeTab === 'annales' ? isLoadingAnnales : isLoadingSessions
  const displayedItems = activeTab === 'annales' ? annales : sessions;
  const showSkeleton = loadingSessions && displayedItems.length === 0;

  const getItemIcon = (isAnnale: boolean) => {
    if (isAnnale) {
      return <Exam className="w-5 h-5 text-orange-400" />
    }
    return <BookOpen className="w-5 h-5 text-sphera-green" />
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
    const isAnnale = activeTab === 'annales'
    try {
      if (!item.is_shared) {
        if (isAnnale) await shareAnnale(item.id)
        else await shareSession(item.id)
      }
      const sharePath = isAnnale ? `/annales/${item.id}` : `/sessions/${item.id}`
      const url = `${window.location.origin}${sharePath}`
      setShareModalData({
        url,
        title: item.resource_title || (isAnnale ? 'Annale partagée' : 'Session partagée')
      })
    } catch (e) {
      console.error("Erreur partage:", e)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-12">
      <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-0 sm:px-4">
        
        {/* Welcome Area */}
        <div className="text-center mb-10 mt-10 px-4 sm:px-0">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-white mb-2">
            {t('dashboard.welcome', { name: user?.first_name || user?.username || 'Spherian' })}
          </h1>
          <p className="text-sphera-text-muted">{t('dashboard.subtitle1')}</p>
          <div className="flex justify-center mt-4">
            <QuotaIndicator />
          </div>
        </div>

        {/* Upload Area (Simplified) */}
        <div className="max-w-2xl mx-auto mb-16 px-4 sm:px-0">
          <div className="bg-sphera-surface-2 border border-sphera-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sphera-green to-transparent opacity-50" />
            <UploadZone 
              onFileSelect={handleFileSelect} 
              selectedFile={null} 
            />

            {/* Divider with "OU" */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="border-t border-sphera-border w-full" />
              <span className="bg-sphera-surface-2 px-3 text-xs text-sphera-text-muted uppercase tracking-wider font-semibold">
                {t('dashboard.or')}
              </span>
              <div className="border-t border-sphera-border w-full" />

            </div>

            {/* Paste Text Button */}
            <button
              type="button"
              onClick={() => setIsPasteModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-sphera-surface hover:bg-sphera-bg border border-sphera-border hover:border-sphera-green/50 text-white transition-all flex items-center justify-center gap-2.5 text-sm font-semibold group shadow-sm"
            >
              <FileText className="w-4 h-4 text-sphera-green group-hover:scale-110 transition-transform" />
              <span>{t('dashboard.pasteOrWrite')}</span>
            </button>
          </div>
        </div>

        {/* Paste Text Modal */}
        <PasteTextModal
          isOpen={isPasteModalOpen}
          onClose={() => setIsPasteModalOpen(false)}
          onConfirm={handlePasteConfirm}
        />

        {/* Tabs */}
        <div className="flex items-center w-full mb-8 border-b border-sphera-border px-4 sm:px-0">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`w-1/2 pb-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'sessions' 
                ? 'border-sphera-green text-sphera-green' 
                : 'border-transparent text-sphera-text-muted hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4" /> {t('dashboard.tabs.sessions')}
          </button>
          <button
            onClick={() => setActiveTab('annales')}
            className={`w-1/2 pb-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'annales' 
                ? 'border-sphera-green text-sphera-green' 
                : 'border-transparent text-sphera-text-muted hover:text-white'
            }`}
          >
            <Exam className="w-4 h-4" /> {t('dashboard.tabs.annales')}
          </button>
        </div>

        {/* Grid content */}
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
                {activeTab === 'annales' ? (
                  <Exam className="w-12 h-12 text-orange-400/50 mx-auto mb-4" />
                ) : (
                  <BookOpen className="w-12 h-12 text-sphera-green/50 mx-auto mb-4" />
                )}
                <p className="text-white font-medium mb-1">
                  {t('dashboard.empty.title', { type: activeTab === 'annales' ? t('dashboard.annaleType') : t('dashboard.sessionType') })}
                </p>
                <p className="text-sm text-sphera-text-muted">{t('dashboard.empty.desc')}</p>
              </div>
            ) : (
              <div className="flex flex-col sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-1 sm:gap-4">
                {displayedItems.map(item => (
                  <Link 
                    key={item.id} 
                    to={`/${activeTab === 'annales' ? 'annales' : 'sessions'}/${item.id}`}
                    className="sphera-card p-5 group hover:-translate-y-1 hover:border-sphera-border/80 hover:bg-sphera-surface-2 transition-all block rounded-none sm:rounded-2xl border-x-0 sm:border-x"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg bg-sphera-bg border border-sphera-border flex items-center justify-center">
                        {getItemIcon(activeTab === 'annales')}
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
                              type: activeTab === 'annales' ? 'annale' : 'session',
                              title: item.resource_title || `Session #${item.id}`
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
                    <h3 className="text-white font-medium mb-1 line-clamp-1">{item.resource_title || `Session #${item.id}`}</h3>
                    <p className="text-xs text-sphera-text-muted mb-4 line-clamp-1">Extrait de {item.source_filename || 'document inconnu'}</p>
                    
                    <div className="flex items-center justify-between text-xs text-sphera-text-muted">
                      <span className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-sphera-surface border border-sphera-border text-[10px] uppercase tracking-wider">
                        {item.tool_types?.join(', ') || 'Document'}
                      </span>
                    </div>
                  </Link>
                ))}
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
        title={itemToDelete?.type === 'annale' ? "Supprimer l'annale ?" : "Supprimer la session ?"}
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

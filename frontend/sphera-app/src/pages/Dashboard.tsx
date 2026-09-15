import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, BrainCircuit, Columns, PenTool, Calendar, ArrowRight, LayoutDashboard, FilePenLine, Loader2, Share2, Trash2, GitFork, Headphones } from 'lucide-react'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import { getSessions, getAnnales, deleteSession, deleteAnnale, shareSession, shareAnnale } from '../services/spheraApi'
import { UploadZone } from '../components/app/UploadZone'
import { setPendingUploadFile } from '../store/fileStore'
import { QuotaIndicator } from '../components/app/QuotaIndicator'
import { PasteTextModal } from '../components/app/PasteTextModal'
import { DeleteConfirmModal } from '../components/app/DeleteConfirmModal'
import { ShareModal } from '../components/app/ShareModal'

// Force Vite HMR reload
export default function Dashboard() {
  const { user } = useSpheraAuth()
  const navigate = useNavigate()
  
  // Upload State
  const [error, setError] = useState<string | null>(null)
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false)

  // Quick Action Modals State
  const [itemToDelete, setItemToDelete] = useState<{ id: string | number; type: 'session' | 'annale'; title: string } | null>(null)
  const [shareModalData, setShareModalData] = useState<{ url: string; title: string } | null>(null)

  // Sessions State
  const [sessions, setSessions] = useState<any[]>([])
  const [annales, setAnnales] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  React.useEffect(() => {
    Promise.all([
      getSessions().then(res => { const d = (res as any)?.data; setSessions(Array.isArray(d) ? d : []) }).catch(err => console.error("Erreur chargement sessions:", err)),
      getAnnales().then(res => { const d = (res as any)?.data; setAnnales(Array.isArray(d) ? d : []) }).catch(err => console.error("Erreur chargement annales:", err))
    ]).finally(() => setLoadingSessions(false))
  }, [])

  // Tabs State
  const [activeTab, setActiveTab] = useState<'sessions' | 'annales' | 'live'>('sessions')

  const getIcon = (type: string) => {
    switch(type) {
      case 'fiche': return <FileText className="w-5 h-5 text-blue-400" />
      case 'quiz': return <BrainCircuit className="w-5 h-5 text-purple-400" />
      case 'flashcards': return <Columns className="w-5 h-5 text-sphera-green" />
      case 'annale': return <PenTool className="w-5 h-5 text-orange-400" />
      case 'mindmap': return <GitFork className="w-5 h-5 text-emerald-400" />
      case 'audio': return <Headphones className="w-5 h-5 text-teal-400" />
      default: return <FileText className="w-5 h-5 text-sphera-text-muted" />
    }
  }

  const displayedItems = activeTab === 'annales' ? annales : sessions;

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
        setAnnales(prev => prev.filter(a => a.id !== itemToDelete.id))
      } else {
        await deleteSession(itemToDelete.id)
        setSessions(prev => prev.filter(s => s.id !== itemToDelete.id))
      }
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
            Salut {user?.first_name || user?.username || 'Spherian'}, prêt à réviser ?
          </h1>
          <p className="text-sphera-text-muted">Je suis Sphera, ton assistante de révision académique.</p>
          <p className="text-sphera-text-muted">Charge un document pour générer instantanément ton matériel de révision ou corrige tes annales.</p>
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
                ou
              </span>
            </div>

            {/* Paste Text Button */}
            <button
              type="button"
              onClick={() => setIsPasteModalOpen(true)}
              className="w-full py-3 px-4 rounded-xl bg-sphera-surface hover:bg-sphera-bg border border-sphera-border hover:border-sphera-green/50 text-white transition-all flex items-center justify-center gap-2.5 text-sm font-semibold group shadow-sm"
            >
              <FileText className="w-4 h-4 text-sphera-green group-hover:scale-110 transition-transform" />
              <span>Coller ou rédiger un cours / des notes</span>
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
            <LayoutDashboard className="w-4 h-4" /> Mes sessions
          </button>
          <button
            onClick={() => setActiveTab('annales')}
            className={`w-1/2 pb-3 text-sm font-medium transition-colors border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'annales' 
                ? 'border-sphera-green text-sphera-green' 
                : 'border-transparent text-sphera-text-muted hover:text-white'
            }`}
          >
            <FilePenLine className="w-4 h-4" /> Mes annales
          </button>
        </div>

        {/* Grid content */}
        <>
            {loadingSessions ? (
              <div className="flex justify-center p-8 text-sphera-text-muted">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : displayedItems.length === 0 ? (
              <div className="text-center p-12 bg-sphera-surface-2 rounded-2xl border border-sphera-border mx-4 sm:mx-0">
                <FileText className="w-12 h-12 text-sphera-text-muted mx-auto mb-4 opacity-50" />
                <p className="text-white font-medium mb-1">Aucune {activeTab === 'annales' ? 'annale' : 'session'} trouvée</p>
                <p className="text-sm text-sphera-text-muted">Upload un document pour commencer à réviser.</p>
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
                        {getIcon(item.tool_types?.[0] || (activeTab === 'annales' ? 'annale' : 'fiche'))}
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

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, BrainCircuit, Columns, PenTool, Calendar, ArrowRight, LayoutDashboard, FilePenLine, Loader2, Zap, Plus, LogIn } from 'lucide-react'
import { useSpheraAuth } from '../contexts/SpheraAuthContext'
import { getSessions, getAnnales, getMyQuizSessions } from '../services/spheraApi'
import { UploadZone } from '../components/app/UploadZone'
import { setPendingUploadFile } from '../store/fileStore'

// Force Vite HMR reload
export default function Dashboard() {
  const { user } = useSpheraAuth()
  const navigate = useNavigate()
  
  // Upload State
  const [error, setError] = useState<string | null>(null)

  // Sessions State
  const [sessions, setSessions] = useState<any[]>([])
  const [annales, setAnnales] = useState<any[]>([])
  const [liveSessions, setLiveSessions] = useState<any[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)

  React.useEffect(() => {
    Promise.all([
      getSessions().then(res => { const d = (res as any)?.data; setSessions(Array.isArray(d) ? d : []) }).catch(err => console.error("Erreur chargement sessions:", err)),
      getAnnales().then(res => { const d = (res as any)?.data; setAnnales(Array.isArray(d) ? d : []) }).catch(err => console.error("Erreur chargement annales:", err)),
      getMyQuizSessions().then(res => { const d = (res as any)?.data; setLiveSessions(Array.isArray(d) ? d : []) }).catch(err => console.error("Erreur chargement live:", err))
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
      default: return <FileText className="w-5 h-5 text-sphera-text-muted" />
    }
  }

  const displayedItems = activeTab === 'annales' ? annales : sessions;

  const handleFileSelect = (f: File | null) => {
    if (!f) return
    setPendingUploadFile(f)
    navigate('/create')
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
        </div>

        {/* Upload Area (Simplified) */}
        <div className="max-w-2xl mx-auto mb-16 px-4 sm:px-0">
          <div className="bg-sphera-surface-2 border border-sphera-border rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-sphera-green to-transparent opacity-50" />
            <UploadZone 
              onFileSelect={handleFileSelect} 
              selectedFile={null} 
            />
          </div>
        </div>



        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 border-b border-sphera-border pb-px px-4 sm:px-0">
          <button
            onClick={() => setActiveTab('sessions')}
            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'sessions' 
                ? 'border-sphera-green text-sphera-green' 
                : 'border-transparent text-sphera-text-muted hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" /> Mes sessions
          </button>
          <button
            onClick={() => setActiveTab('annales')}
            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'annales' 
                ? 'border-sphera-green text-sphera-green' 
                : 'border-transparent text-sphera-text-muted hover:text-white'
            }`}
          >
            <FilePenLine className="w-4 h-4" /> Mes annales
          </button>
          <button
            onClick={() => setActiveTab('live')}
            className={`pb-3 px-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-2 ${
              activeTab === 'live' 
                ? 'border-sphera-green text-sphera-green' 
                : 'border-transparent text-sphera-text-muted hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" /> Sphera Live
          </button>
        </div>

        {/* Grid or Live content */}
        {activeTab === 'live' ? (
          <div className="px-4 sm:px-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <Link to="/live/host" className="sphera-card p-6 flex flex-col items-center justify-center text-center hover:bg-sphera-surface-2 transition-colors border border-sphera-border rounded-xl">
                <div className="w-12 h-12 rounded-full bg-sphera-green/10 flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-sphera-green" />
                </div>
                <h3 className="text-white font-medium mb-2">Créer une session</h3>
                <p className="text-sm text-sphera-text-muted">Générez un quiz avec Sphera ou créez-le manuellement pour vos amis.</p>
              </Link>
              <Link to="/live/join" className="sphera-card p-6 flex flex-col items-center justify-center text-center hover:bg-sphera-surface-2 transition-colors border border-sphera-border rounded-xl">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                  <LogIn className="w-6 h-6 text-blue-500" />
                </div>
                <h3 className="text-white font-medium mb-2">Rejoindre avec un code</h3>
                <p className="text-sm text-sphera-text-muted">Entrez un code pour participer à un quiz en direct.</p>
              </Link>
            </div>
            
            <h3 className="text-lg font-bold text-white mb-4">Mes sessions hébergées</h3>
            {loadingSessions ? (
              <div className="flex justify-center p-8 text-sphera-text-muted">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : liveSessions.length === 0 ? (
              <div className="text-center p-8 bg-sphera-surface-2 rounded-xl border border-sphera-border">
                <p className="text-sphera-text-muted text-sm">Vous n'avez pas encore hébergé de session Sphera Live.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveSessions.map(session => (
                  <div key={session.id} className="sphera-card p-5 border border-sphera-border rounded-xl">
                    <h4 className="text-white font-medium mb-2">{session.title}</h4>
                    <div className="flex justify-between items-center text-xs text-sphera-text-muted">
                      <span>Code: <strong className="text-white font-mono">{session.room_code}</strong></span>
                      <span>{new Date(session.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
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
                        {getIcon(item.tool_types?.[0] || 'fiche')}
                      </div>
                      <ArrowRight className="w-4 h-4 text-sphera-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
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
        )}
      </main>
    </div>
  )
}

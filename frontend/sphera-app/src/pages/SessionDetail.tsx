import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSession, getAnnale, askQuestion, deleteSession, deleteAnnale, shareSession, shareAnnale, updateSessionText, API_BASE } from '../services/spheraApi'
import { normalizeAiResponse } from '../utils/normalizeAiResponse'
import { FileText, ArrowLeft, Maximize2, Minimize2, Send, MessageSquare, Bot, User, BrainCircuit, Columns, PenTool, Share2, Trash2, Check, AtSign } from 'lucide-react'
import { FicheView, QuizView, FlashcardsView, AnnaleView } from '../components/app/ResultViews'
import { ShareModal } from '../components/app/ShareModal'
import { DeleteConfirmModal } from '../components/app/DeleteConfirmModal'
import { CourseTextReader } from '../components/app/CourseTextReader'
import { DocumentImageViewer } from '../components/app/DocumentImageViewer'

export default function SessionDetail({ type = 'session' }: { type?: 'session' | 'annale' }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('')

  // Workspace State
  const [isPdfExpanded, setIsPdfExpanded] = useState(true)
  const [docViewMode, setDocViewMode] = useState<'doc' | 'text'>('doc')
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [isChatting, setIsChatting] = useState(false)

  // Command Menu State
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [commandFilter, setCommandFilter] = useState('')
  const [commandActiveIdx, setCommandActiveIdx] = useState(0)
  const chatInputRef = React.useRef<HTMLInputElement>(null)
  
  const [showCopied, setShowCopied] = useState(false)
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const handleDelete = async () => {
    try {
      if (type === 'annale') await deleteAnnale(id as string);
      else await deleteSession(id as string);
      navigate('/dashboard');
    } catch (e) {
      alert("Erreur lors de la suppression.");
    }
  }

  const handleOpenShare = async () => {
    try {
      if (!session.is_shared) {
        const shareFn = type === 'annale' ? shareAnnale : shareSession;
        await shareFn(id as string);
        setSession({ ...session, is_shared: true });
      }
      setIsShareModalOpen(true);
    } catch (e) {
      alert("Impossible d'ouvrir le partage.");
    }
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
      if (toolTypes.includes(cmd.toolType)) {
        setActiveTab(cmd.toolType)
      }
      return
    }

    if (cmd.template) {
      setChatMessage(prev => {
        if (prev.match(/@([a-zA-Z0-9_-]*)$/)) {
          return prev.replace(/@([a-zA-Z0-9_-]*)$/, cmd.template || '')
        }
        return prev ? `${prev} ${cmd.template}` : (cmd.template || '')
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

  const handleSendChat = async () => {
    const raw = chatMessage.trim();
    if (!raw || !id) return;

    // Bare tool command -> switch tab
    const lower = raw.toLowerCase();
    if (lower === '@fiche' || lower === '@quiz' || lower === '@flashcards') {
      const tool = lower.replace('@', '');
      if (toolTypes.includes(tool)) {
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
      const foundCmd = COMMANDS.find(c => c.trigger.toLowerCase() === cmdTrigger);
      if (foundCmd && foundCmd.prefix) {
        queryForAi = foundCmd.prefix + (rest || 'les points essentiels.');
        displayQuestion = rest || foundCmd.label;
      } else if (foundCmd && foundCmd.toolType) {
        queryForAi = rest 
          ? `En lien avec le cours, donne-moi les éléments nécessaires sur "${rest}".` 
          : `Résume les points essentiels du cours.`;
      } else {
        queryForAi = rest || raw;
      }
    }

    setChatMessage('');
    setIsChatting(true);
    setActiveTab('chat');

    setChatHistory(prev => [...prev, { question: displayQuestion, answer: '...' }]);

    try {
      const res = await askQuestion(id, queryForAi, type);
      const normalized = normalizeAiResponse(res?.data?.answer);
      setChatHistory(prev => {
        const newHist = [...prev];
        newHist[newHist.length - 1].answer = normalized;
        return newHist;
      });
    } catch (e) {
      setChatHistory(prev => {
        const newHist = [...prev];
        newHist[newHist.length - 1].answer = "Erreur de connexion avec l'assistant.";
        return newHist;
      });
    } finally {
      setIsChatting(false);
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
    <div className="flex h-full overflow-hidden flex-col md:flex-row bg-sphera-bg">

      {/* Left Column: Source Document */}
      <div className={`${isPdfExpanded ? 'w-full md:w-1/2 flex' : 'hidden'} border-r border-sphera-border flex-col bg-sphera-surface-2 overflow-hidden transition-all duration-300`}>
        <div className="h-14 border-b border-sphera-border flex items-center justify-between px-4 bg-sphera-bg">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-1.5 text-sphera-text-muted hover:bg-sphera-surface hover:text-white rounded-md transition-colors shrink-0"
              title="Retour au tableau de bord"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-white truncate">
              {session.resource_title || session.source_filename || `Session #${session.id}`}
            </span>
          </div>

          {/* Toggle between Image and OCR Text if both are available */}
          {isImage && session.extracted_text && (
            <div className="flex items-center gap-1 bg-sphera-surface p-1 rounded-lg border border-sphera-border shrink-0 ml-2">
              <button
                type="button"
                onClick={() => setDocViewMode('doc')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  docViewMode === 'doc' ? 'bg-sphera-green text-black shadow-sm' : 'text-sphera-text-muted hover:text-white'
                }`}
              >
                Image
              </button>
              <button
                type="button"
                onClick={() => setDocViewMode('text')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                  docViewMode === 'text' ? 'bg-sphera-green text-black shadow-sm' : 'text-sphera-text-muted hover:text-white'
                }`}
              >
                Texte OCR
              </button>
            </div>
          )}
        </div>

        {/* Document Viewer */}
        <div className="flex-1 overflow-hidden relative bg-[#1E1E1E]">
          {isImage && fileUrl && docViewMode === 'doc' ? (
            <DocumentImageViewer
              src={fileUrl}
              alt={session.resource_title || 'Document'}
              title={session.resource_title || session.source_filename}
            />
          ) : isPdf && fileUrl ? (
            <iframe 
              src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
              className="w-full h-full border-none custom-scrollbar" 
              title="Aperçu du document"
            />
          ) : session.extracted_text ? (
            <CourseTextReader
              initialText={session.extracted_text}
              title={session.resource_title || session.source_filename}
              isEditable={type === 'session'}
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
              title="Aperçu du document"
            />
          ) : (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center opacity-60 h-full">
              <FileText className="w-16 h-16 text-sphera-text-muted mb-4" />
              <p className="text-white font-medium mb-1">Aperçu non disponible</p>
              <p className="text-sm text-sphera-text-muted max-w-sm">
                Le document original n'a pas été trouvé.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Generated Tools & Workspace */}
      <div className={`${isPdfExpanded ? 'w-full md:w-1/2' : 'w-full'} flex flex-col h-full bg-sphera-bg relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300`}>

        {/* Workspace Toolbar */}
        <div className="h-14 border-b border-sphera-border flex items-center justify-between px-4 bg-sphera-surface-2/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPdfExpanded(!isPdfExpanded)}
              className="p-1.5 rounded-md text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
              title={isPdfExpanded ? "Plein écran" : "Afficher l'aperçu"}
            >
              {isPdfExpanded ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            {!isPdfExpanded && (
              <span className="text-sm font-semibold text-white truncate max-w-[200px] border-l border-sphera-border pl-3">
                {session.resource_title || session.source_filename}
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-1 bg-sphera-bg p-1 rounded-md">
              {toolTypes.map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${activeTab === t
                      ? 'bg-sphera-surface text-white'
                      : 'text-sphera-text-muted hover:text-white'
                    }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
              <button
                onClick={() => setActiveTab('chat')}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'chat' ? 'bg-sphera-surface text-white' : 'text-sphera-text-muted hover:text-white'
                  }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Q&A
              </button>
            </div>
            
            <div className="flex items-center gap-2 border-l border-sphera-border pl-4">
              <button
                onClick={handleOpenShare}
                className={`p-1.5 rounded transition-colors text-sphera-text-muted hover:text-white hover:bg-sphera-surface`}
                title="Partager le lien public"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="p-1.5 rounded text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Supprimer la session"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Generated Content Area */}
        <div className="flex-1 overflow-y-auto relative pb-24">
          <div className="p-6 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === 'fiche' ? (
              <FicheView content={content.fiche} />
            ) : activeTab === 'quiz' ? (
              <QuizView content={content.quiz} />
            ) : activeTab === 'flashcards' ? (
              <FlashcardsView content={content.flashcards} />
            ) : activeTab === 'annale' ? (
              <AnnaleView annale={session} />
            ) : null}
            {activeTab === 'chat' && (
              <div className="flex flex-col gap-6 pb-8">
                {chatHistory.length === 0 ? (
                  <div className="text-center p-12 bg-sphera-surface-2 rounded-2xl border border-sphera-border">
                    <MessageSquare className="w-10 h-10 text-sphera-text-muted mx-auto mb-4 opacity-50" />
                    <p className="text-white font-medium mb-1">Posez vos questions</p>
                    <p className="text-sm text-sphera-text-muted">Demandez des éclaircissements sur ce document.</p>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div key={i} className="flex flex-col gap-4">
                      {/* User Message */}
                      <div className="flex items-start justify-end gap-3">
                        <div className="bg-sphera-green/10 border border-sphera-green/20 text-white p-4 rounded-2xl rounded-tr-sm max-w-[85%]">
                          <p className="text-sm leading-relaxed">{msg.question}</p>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-sphera-surface-2 border border-sphera-border flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-sphera-text-muted" />
                        </div>
                      </div>
                      {/* AI Response */}
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-sphera-surface-2 border border-sphera-border flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-sphera-green" />
                        </div>
                        <div className="bg-sphera-surface-2 border border-sphera-border text-sphera-text-muted p-4 rounded-2xl rounded-tl-sm max-w-[85%]">
                          {msg.answer === '...' ? (
                            <div className="flex gap-1 py-1">
                              <div className="w-1.5 h-1.5 rounded-full bg-sphera-text-muted animate-bounce" />
                              <div className="w-1.5 h-1.5 rounded-full bg-sphera-text-muted animate-bounce [animation-delay:0.2s]" />
                              <div className="w-1.5 h-1.5 rounded-full bg-sphera-text-muted animate-bounce [animation-delay:0.4s]" />
                            </div>
                          ) : (
                            <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">{msg.answer}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Q&A Chat Input (Fixed Bottom) */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-sphera-bg via-sphera-bg/90 to-transparent p-4 pt-12 z-30">
          <div className="max-w-3xl mx-auto flex items-center gap-3 bg-sphera-surface-2 border border-sphera-border rounded-full p-2 pl-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] focus-within:border-sphera-green/50 transition-colors">
            <MessageSquare className="w-4 h-4 text-sphera-text-muted hidden sm:block" />
            <input
              type="text"
              placeholder="Demandez n'importe quoi sur ce cours..."
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              className="flex-1 bg-transparent border-none text-sm text-white placeholder-sphera-text-muted outline-none focus:ring-0"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  handleSendChat()
                }
              }}
            />
            <button
              onClick={handleSendChat}
              disabled={!chatMessage.trim() || isChatting || !id}
              className="w-9 h-9 rounded-full bg-sphera-green text-black flex items-center justify-center hover:bg-green-400 disabled:opacity-50 disabled:hover:bg-sphera-green transition-colors flex-shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </div>
      </div>
      
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

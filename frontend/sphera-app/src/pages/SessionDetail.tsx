import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSession, getAnnale, askQuestion, deleteSession, deleteAnnale, shareSession, shareAnnale, updateSessionText, addToolToSession, createFromSelection, API_BASE } from '../services/spheraApi'
import { normalizeAiResponse } from '../utils/normalizeAiResponse'
import { FileText, ArrowLeft, Maximize2, Minimize2, Send, Square, MessageSquare, Bot, User, BrainCircuit, Columns, Share2, Trash2, Check, AtSign, Plus, Loader2, AlertCircle, Sparkles } from 'lucide-react'
import { FicheView, QuizView, FlashcardsView, AnnaleView } from '../components/app/ResultViews'
import { ShareModal } from '../components/app/ShareModal'
import { DeleteConfirmModal } from '../components/app/DeleteConfirmModal'
import { CourseTextReader } from '../components/app/CourseTextReader'
import { DocumentImageViewer } from '../components/app/DocumentImageViewer'
import { CommandMenu, COMMANDS, type Command } from '../components/app/CommandMenu'
import { QuestionSuggestions } from '../components/app/QuestionSuggestions'
import { AiMessageItem } from '../components/app/AiMessageItem'
import { TextSelectionToolbar, type SelectionActionType } from '../components/app/TextSelectionToolbar'

export default function SessionDetail({ type = 'session' }: { type?: 'session' | 'annale' }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('')

  const [isGeneratingTool, setIsGeneratingTool] = useState(false)
  const [toolError, setToolError] = useState<string | null>(null)

  // Workspace State
  const [isPdfExpanded, setIsPdfExpanded] = useState(true)
  const [docViewMode, setDocViewMode] = useState<'doc' | 'text'>('doc')
  const [mobileActiveView, setMobileActiveView] = useState<'doc' | 'workspace'>('workspace')
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [isChatting, setIsChatting] = useState(false)

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

  const handleAddTool = async (tool: 'fiche' | 'quiz' | 'flashcards') => {
    if (!session?.id) return
    setIsGeneratingTool(true)
    setToolError(null)
    try {
      const res = await addToolToSession(session.id, tool)
      const payload = res.data
      setSession(payload)
      setActiveTab(tool)
    } catch (e: any) {
      setToolError(e.message || `Erreur lors de la génération de ${tool}.`)
    } finally {
      setIsGeneratingTool(false)
    }
  }

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

  useEffect(() => {
    if (!id) return
    const fetchFn = type === 'annale' ? getAnnale : getSession;
    fetchFn(id)
      .then(r => {
        setSession(r?.data ?? r)
        const payload = r?.data ?? r;
        const types = payload.tool_types || (type === 'annale' ? ['annale'] : [])
        if (types.length) setActiveTab(types[0])
        else setActiveTab('chat')
        if (payload.qa_history) setChatHistory(payload.qa_history)
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }, [id, type, navigate])

  if (loading) return (
    <div className="p-8 max-w-4xl mx-auto flex flex-col gap-4">
      <div className="h-24 bg-sphera-surface rounded-xl animate-pulse" />
      <div className="h-40 bg-sphera-surface rounded-xl animate-pulse" />
      <div className="h-40 bg-sphera-surface rounded-xl animate-pulse" />
    </div>
  )

  if (!session) return null

  const toolTypes: string[] = session.tool_types || (type === 'annale' ? ['annale'] : [])
  const content = session.content || {}

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
          newHist[i].answer = "*(Génération interrompue)*";
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
          newHist[index].answer = normalized;
        }
        return newHist;
      });
    } catch (e: any) {
      if (e?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      setChatHistory(prev => {
        const newHist = [...prev];
        if (newHist[index] && newHist[index].answer === '...') {
          newHist[index].answer = "Erreur de connexion avec l'assistant.";
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
          newHist[index].answer = normalized;
        }
        return newHist;
      });
    } catch (e: any) {
      if (e?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      setChatHistory(prev => {
        const newHist = [...prev];
        if (newHist[index] && newHist[index].answer === '...') {
          newHist[index].answer = "Erreur de connexion avec l'assistant.";
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

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await askQuestion(id, queryForAi, type, controller.signal);
      const normalized = normalizeAiResponse(res?.data?.answer);
      setChatHistory(prev => {
        const newHist = [...prev];
        if (newHist.length > 0 && newHist[newHist.length - 1].answer === '...') {
          newHist[newHist.length - 1].answer = normalized;
        }
        return newHist;
      });
    } catch (e: any) {
      if (e?.name === 'AbortError' || controller.signal.aborted) {
        return;
      }
      setChatHistory(prev => {
        const newHist = [...prev];
        if (newHist.length > 0 && newHist[newHist.length - 1].answer === '...') {
          newHist[newHist.length - 1].answer = "Erreur de connexion avec l'assistant.";
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
        message: action === 'quiz' ? 'Génération du quiz sur la sélection...' : 'Génération des flashcards...',
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
            ? `✨ ${count} question${count > 1 ? 's' : ''} ajoutée${count > 1 ? 's' : ''} avec succès au Quiz !` 
            : `✨ ${count} flashcard${count > 1 ? 's' : ''} ajoutée${count > 1 ? 's' : ''} avec succès au paquet !`,
          type: 'success',
        });
        setTimeout(() => setActionFeedback(null), 4000);
        return;
      } catch (err: any) {
        setActionFeedback({
          message: err?.message || 'Erreur lors de la création de l\'élément.',
          type: 'error',
        });
        setTimeout(() => setActionFeedback(null), 4000);
        return;
      }
    }

    let prompt = ''
    let display = ''

    if (action === 'expliquer') {
      display = `Expliquer : "${selectedText}"`
      prompt = `Explique-moi ce passage de cours de manière claire, concise et pédagogique :\n\n> "${selectedText}"`
    } else if (action === 'resumer') {
      display = `Résumer : "${selectedText}"`
      prompt = `Résume les points essentiels de ce passage en quelques puces claires :\n\n> "${selectedText}"`
    } else if (action === 'exemple') {
      display = `Exemple pour : "${selectedText}"`
      prompt = `Donne-moi un exemple concret ou une mise en situation pratique illustrant ce concept :\n\n> "${selectedText}"`
    } else if (action === 'quiz') {
      display = `Quiz sur : "${selectedText}"`
      prompt = `Génère une question de quiz à choix multiples (avec 4 options A, B, C, D, la bonne réponse et une brève explication) basée sur ce passage :\n\n> "${selectedText}"`
    } else if (action === 'flashcards') {
      display = `Flashcard pour : "${selectedText}"`
      prompt = `Crée une flashcard recto/verso (Question clé au recto, Réponse synthétique au verso) basée sur ce concept :\n\n> "${selectedText}"`
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
      setChatHistory(prev => {
        const newHist = [...prev]
        if (newHist.length > 0 && newHist[newHist.length - 1].answer === '...') {
          newHist[newHist.length - 1].answer = normalized
        }
        return newHist
      })
    } catch (e: any) {
      if (e?.name === 'AbortError' || controller.signal.aborted) {
        return
      }
      setChatHistory(prev => {
        const newHist = [...prev]
        if (newHist.length > 0 && newHist[newHist.length - 1].answer === '...') {
          newHist[newHist.length - 1].answer = "Erreur de connexion avec l'assistant."
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
    <div className="flex h-full overflow-hidden flex-col md:flex-row bg-sphera-bg">
      {/* Mobile Top Bar with Segmented View Switcher */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 bg-sphera-surface-2 border-b border-sphera-border shrink-0 z-30">
        <button
          onClick={() => navigate('/dashboard')}
          className="p-1.5 text-sphera-text-muted hover:bg-sphera-surface hover:text-white rounded-md transition-colors shrink-0"
          title="Retour au tableau de bord"
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
            {isImage ? 'Image' : isPdf ? 'PDF' : 'Document'}
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
            Espace d'étude
          </button>
        </div>
      </div>

      {/* Left Column: Source Document */}
      <div className={`${mobileActiveView === 'doc' ? 'flex flex-1 w-full' : 'hidden'} ${isPdfExpanded ? 'md:flex md:w-1/2' : 'md:hidden'} border-r border-sphera-border flex-col bg-sphera-surface-2 overflow-hidden transition-all duration-300`}>
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
                {isImage ? 'Image' : 'PDF'}
              </button>
              <button
                type="button"
                onClick={() => setDocViewMode('text')}
                title="Texte extrait interactif (surlignage et IA)"
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                  docViewMode === 'text' ? 'bg-sphera-green text-black shadow-sm' : 'text-sphera-text-muted hover:text-white'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Texte interactif</span>
              </button>
            </div>
          )}
        </div>

        {/* Document Viewer */}
        <div className="flex-1 overflow-hidden relative bg-[#1E1E1E]">
          {docViewMode === 'doc' && isImage && fileUrl ? (
            <DocumentImageViewer
              src={fileUrl}
              alt={session.resource_title || 'Document'}
              title={session.resource_title || session.source_filename}
            />
          ) : docViewMode === 'doc' && isPdf && fileUrl ? (
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
      <div className={`${mobileActiveView === 'workspace' ? 'flex flex-1 w-full' : 'hidden'} ${isPdfExpanded ? 'md:flex md:w-1/2' : 'md:flex md:w-full'} flex-col h-full bg-sphera-bg relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300`}>

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
            <div className="flex gap-1 bg-sphera-bg p-1 rounded-md overflow-x-auto">
              {(type === 'session' ? ['fiche', 'quiz', 'flashcards'] : ['annale']).map(t => {
                const isGenerated = content[t] !== undefined;
                return (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                      activeTab === t
                        ? 'bg-sphera-surface text-white shadow-sm'
                        : isGenerated
                          ? 'text-sphera-text-muted hover:text-white'
                          : 'text-sphera-text-muted/50 hover:text-sphera-text-muted/90'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                    {!isGenerated && type === 'session' && (
                      <span className="text-[9px] bg-sphera-surface-2 px-1.5 rounded-full border border-sphera-border text-sphera-text-muted">+</span>
                    )}
                  </button>
                )
              })}
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
        <div 
          className="flex-1 overflow-y-auto min-h-0 relative select-text"
          onMouseUp={handleWorkspaceSelection}
          onTouchEnd={handleWorkspaceSelection}
        >
          <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
            {activeTab !== 'chat' && content[activeTab] === undefined ? (
              <div className="p-8 text-center bg-sphera-surface-2 rounded-2xl border border-sphera-border">
                <p className="text-sphera-text-muted mb-4">Cet outil n'a pas encore été généré pour ce cours.</p>
                <button
                  onClick={() => handleAddTool(activeTab as any)}
                  disabled={isGeneratingTool}
                  className="sphera-primary-btn py-2 px-4 text-xs inline-flex items-center gap-2"
                >
                  {isGeneratingTool ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Générer {activeTab}</span>
                </button>
                {toolError && <p className="text-red-400 text-sm mt-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{toolError}</p>}
              </div>
            ) : (
              <>
                {activeTab === 'fiche' && <FicheView content={content.fiche} />}
                {activeTab === 'quiz' && <QuizView content={content.quiz} />}
                {activeTab === 'flashcards' && <FlashcardsView content={content.flashcards} />}
                {activeTab === 'annale' && <AnnaleView annale={session} />}
              </>
            )}
            {activeTab === 'chat' && (
              <div className="flex flex-col gap-2 pb-6">
                {chatHistory.length === 0 ? (
                  <div className="text-center p-12 bg-sphera-surface-2 rounded-2xl border border-sphera-border">
                    <MessageSquare className="w-10 h-10 text-sphera-text-muted mx-auto mb-4 opacity-50" />
                    <p className="text-white font-medium mb-1">Posez vos questions</p>
                    <p className="text-sm text-sphera-text-muted">Demandez des éclaircissements sur ce document.</p>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <AiMessageItem
                      key={i}
                      index={i}
                      question={msg.question}
                      answer={msg.answer}
                      onEdit={handleEditMessage}
                      onRegenerate={handleRegenerateResponse}
                      disabled={isChatting}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Q&A Chat Input (Pinned at Bottom) */}
        <div className="shrink-0 w-full bg-sphera-surface-2/95 border-t border-sphera-border px-3 py-2 sm:px-4 sm:py-3 z-30 backdrop-blur-md">
          {activeTab === 'chat' && (
            <div className="max-w-3xl mx-auto mb-2">
              <QuestionSuggestions
                sessionId={id}
                askedQuestions={chatHistory.map(m => m.question)}
                onSelect={(q) => {
                  setChatMessage(q)
                  chatInputRef.current?.focus()
                }}
              />
            </div>
          )}

          <div className="max-w-3xl mx-auto relative">
            <CommandMenu
              isVisible={showCommandMenu}
              filter={commandFilter}
              activeIndex={commandActiveIdx}
              onSelect={handleCommandSelect}
              onClose={() => setShowCommandMenu(false)}
            />
            <div className="flex items-center gap-2 bg-sphera-surface border border-sphera-border rounded-full p-1.5 pl-3 sm:pl-4 shadow-[0_0_20px_rgba(0,0,0,0.3)] focus-within:border-sphera-green/50 transition-colors">
              <button
                type="button"
                onClick={handleToggleCommandMenu}
                title="Commandes (@)"
                aria-label="Ouvrir les commandes (@)"
                className={`p-1.5 rounded-full transition-colors shrink-0 ${
                  showCommandMenu 
                    ? 'bg-sphera-green text-black' 
                    : 'text-sphera-text-muted hover:text-sphera-green hover:bg-sphera-surface-2'
                }`}
              >
                <AtSign className="w-4 h-4" />
              </button>
              <input
                ref={chatInputRef}
                type="text"
                placeholder="Demandez n'importe quoi sur ce cours... ou @ pour les commandes"
                value={chatMessage}
                onChange={e => handleChatInputChange(e.target.value)}
                onKeyDown={handleChatKeyDown}
                className="flex-1 bg-transparent border-none text-sm text-white placeholder-sphera-text-muted outline-none focus:ring-0"
              />
              {isChatting ? (
                <button
                  type="button"
                  onClick={handleStopChat}
                  title="Arrêter la réponse"
                  aria-label="Arrêter la réponse"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-500/90 hover:bg-red-500 text-white flex items-center justify-center transition-all flex-shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-in fade-in"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendChat}
                  disabled={!chatMessage.trim() || !id}
                  title="Envoyer le message"
                  aria-label="Envoyer le message"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-sphera-green text-black flex items-center justify-center hover:bg-green-400 disabled:opacity-50 disabled:hover:bg-sphera-green transition-colors flex-shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
                >
                  <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 ml-0.5" />
                </button>
              )}
            </div>
          </div>
        </div>
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

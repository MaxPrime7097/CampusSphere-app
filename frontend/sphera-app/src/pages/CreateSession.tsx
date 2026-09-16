import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  FileText,
  ArrowLeft,
  Maximize2,
  Minimize2,
  Send,
  Square,
  MessageSquare,
  Bot,
  User,
  AtSign,
  Sparkles,
  BookOpen,
  Zap,
  Loader2,
  Plus,
  AlertCircle,
  Check
} from 'lucide-react'
import { ToolSelector, type ToolType } from '../components/app/ToolSelector'
import { GenerateButton } from '../components/app/GenerateButton'
import { pendingUploadFile } from '../store/fileStore'
import { FicheView, QuizView, FlashcardsView, AnnaleView, MindmapView, AudioSummaryView } from '../components/app/ResultViews'
import { generateFromUpload, generateAnnale, askQuestion, addToolToSession, createFromSelection } from '../services/spheraApi'
import { QuestionSuggestions } from '../components/app/QuestionSuggestions'
import { normalizeAiResponse } from '../utils/normalizeAiResponse'
import { CommandMenu, COMMANDS, type Command } from '../components/app/CommandMenu'
import { QuotaIndicator } from '../components/app/QuotaIndicator'
import { CourseTextReader } from '../components/app/CourseTextReader'
import { DocumentImageViewer } from '../components/app/DocumentImageViewer'
import { AiMessageItem } from '../components/app/AiMessageItem'
import { TextSelectionToolbar, type SelectionActionType } from '../components/app/TextSelectionToolbar'

export default function CreateSession() {
  const navigate = useNavigate()
  const [currentFile, setCurrentFile] = useState<File | null>(pendingUploadFile)
  const file = currentFile

  const [generationMode, setGenerationMode] = useState<'study' | 'annale'>('study')
  const [selectedTools, setSelectedTools] = useState<ToolType[]>(['fiche'])
  const [annaleMode, setAnnaleMode] = useState<'complete' | 'rapide'>('complete')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [textSource, setTextSource] = useState<string | null>(null)
  
  // Workspace State
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [isPdfExpanded, setIsPdfExpanded] = useState(true)
  const [docViewMode, setDocViewMode] = useState<'doc' | 'text'>('doc')
  const [activeTab, setActiveTab] = useState<string>('fiche')
  const [isGeneratingTool, setIsGeneratingTool] = useState(false)
  const [toolError, setToolError] = useState<string | null>(null)
  
  // Chat State
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [isChatting, setIsChatting] = useState(false)

  // Command menu state
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [commandFilter, setCommandFilter] = useState('')
  const [commandActiveIdx, setCommandActiveIdx] = useState(0)
  const [mobileActiveView, setMobileActiveView] = useState<'doc' | 'workspace'>('workspace')
  const chatInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

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

  const isImage = currentFile ? (currentFile.type.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp|svg)$/i.test(currentFile.name)) : false;
  const isPdf = currentFile ? (currentFile.type === 'application/pdf' || /\.pdf$/i.test(currentFile.name)) : false;
  const isText = currentFile ? (currentFile.name.endsWith('.md') || currentFile.name.endsWith('.txt') || currentFile.name.endsWith('.markdown') || currentFile.type.startsWith('text/')) : false;

  useEffect(() => {
    if (!currentFile) {
      navigate('/dashboard', { replace: true })
      return
    }

    if (isPdf || isImage) {
      const url = URL.createObjectURL(currentFile)
      setFileUrl(url)
      return () => URL.revokeObjectURL(url)
    } else if (isText) {
      currentFile.text().then(txt => setTextSource(txt)).catch(console.error)
    }
  }, [currentFile, navigate, isPdf, isImage, isText])

  const handleTextSave = (newText: string) => {
    if (!currentFile) return
    setTextSource(newText)
    const updatedFile = new File([newText], currentFile.name, {
      type: currentFile.type || 'text/markdown',
      lastModified: Date.now(),
    })
    setCurrentFile(updatedFile)
  }

  if (!file) return null

  const handleStartDirectQa = async () => {
    setGenerating(true)
    setError(null)
    try {
      const result = await generateFromUpload({ file, tool_types: [] })
      const payload = result?.data ?? result
      setGeneratedContent(payload.content || {})
      if (payload.extracted_text) {
        setTextSource(payload.extracted_text)
      }
      if (payload.id) setSessionId(payload.id)
      if (payload.qa_history) setChatHistory(payload.qa_history)
      setActiveTab('chat')
    } catch (e: any) {
      setError(e.message || "Erreur lors de l'initialisation de la session Q&A.")
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerate = async () => {
    if (generationMode === 'study' && selectedTools.length === 0) {
      return handleStartDirectQa()
    }
    setGenerating(true)
    setError(null)
    try {
      let result;
      if (generationMode === 'study') {
        result = await generateFromUpload({ file, tool_types: selectedTools });
      } else {
        result = await generateAnnale({ file, mode: annaleMode });
      }

      const payload = result?.data ?? result;
      setGeneratedContent(payload.content || payload);
      if (payload.extracted_text) {
        setTextSource(payload.extracted_text);
      }
      if (payload.id) setSessionId(payload.id);
      if (payload.qa_history) setChatHistory(payload.qa_history);
      
      // Set active tab based on what was generated
      const generatedTypes = payload.tool_types || (generationMode === 'study' ? selectedTools : ['annale']);
      if (generatedTypes && generatedTypes.length > 0) {
        setActiveTab(generatedTypes[0]);
      } else {
        setActiveTab('chat');
      }
      
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la génération avec le serveur CampusSphere.')
    } finally {
      setGenerating(false)
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
    const trimmed = newQuestion.trim();
    if (!trimmed) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setIsChatting(true);
    setActiveTab('chat');

    setChatHistory(prev => {
      const newHist = [...prev];
      if (newHist[index]) {
        newHist[index] = { question: trimmed, answer: '...' };
      }
      return newHist;
    });

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      setGeneratedContent({});
      try {
        const result = await generateFromUpload({ file, tool_types: [] });
        const payload = result?.data ?? result;
        activeSessionId = payload.id;
        setSessionId(payload.id);
      } catch (err: any) {
        setChatHistory(prev => {
          const newHist = [...prev];
          if (newHist[index]) {
            newHist[index].answer = err.message || "Erreur lors de la création de la session.";
          }
          return newHist;
        });
        setIsChatting(false);
        return;
      }
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await askQuestion(
        activeSessionId,
        trimmed,
        generationMode === 'annale' ? 'annale' : 'session',
        controller.signal
      );
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
    if (!item || !item.question) return;

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

    let activeSessionId = sessionId;
    if (!activeSessionId) {
      setGeneratedContent({});
      try {
        const result = await generateFromUpload({ file, tool_types: [] });
        const payload = result?.data ?? result;
        activeSessionId = payload.id;
        setSessionId(payload.id);
      } catch (err: any) {
        setChatHistory(prev => {
          const newHist = [...prev];
          if (newHist[index]) {
            newHist[index].answer = err.message || "Erreur lors de la création de la session.";
          }
          return newHist;
        });
        setIsChatting(false);
        return;
      }
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await askQuestion(
        activeSessionId,
        item.question,
        generationMode === 'annale' ? 'annale' : 'session',
        controller.signal
      );
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
    if (!raw) return;
    
    setChatMessage('');

    // 1. Bare tool command -> switch tab or generate without sending raw prompt
    const lower = raw.toLowerCase();
    if (lower === '@fiche' || lower === '@quiz' || lower === '@flashcards') {
      const tool = lower.replace('@', '') as 'fiche' | 'quiz' | 'flashcards';
      if (sessionId) {
        if (generatedContent && generatedContent[tool] !== undefined) {
          setActiveTab(tool);
        } else {
          await handleAddTool(tool);
          setActiveTab(tool);
        }
      } else {
        setSelectedTools([tool]);
        setGenerating(true);
        try {
          const result = await generateFromUpload({ file, tool_types: [tool] });
          const payload = result?.data ?? result;
          setGeneratedContent(payload.content || payload);
          if (payload.id) setSessionId(payload.id);
          setActiveTab(tool);
        } catch (e: any) {
          setError(e.message);
        } finally {
          setGenerating(false);
        }
      }
      return;
    }

    // 2. Parse smart commands with text
    let displayQuestion = raw;
    let queryForAi = raw;

    const match = raw.match(/^@(\w+)\s*(.*)$/);
    if (match) {
      const cmdTrigger = `@${match[1].toLowerCase()}`;
      const rest = match[2].trim();
      const foundCmd = COMMANDS.find(c => c.trigger.toLowerCase() === cmdTrigger);

      if (foundCmd && foundCmd.category === 'action' && foundCmd.prefix) {
        displayQuestion = raw;
        queryForAi = rest 
          ? `${foundCmd.prefix}${rest}` 
          : `Explique-moi les concepts essentiels du cours de manière pédagogique.`;
      } else if (foundCmd && foundCmd.category === 'tool') {
        displayQuestion = raw;
        queryForAi = rest 
          ? `En lien avec le cours, donne-moi les éléments nécessaires sur "${rest}".` 
          : `Résume les points essentiels du cours.`;
      } else {
        queryForAi = rest || raw;
      }
    }

    setIsChatting(true);
    setActiveTab('chat');
    
    let activeSessionId = sessionId;

    if (!activeSessionId) {
      // First message before session creation: initialize session on the fly
      setGeneratedContent({});
      setChatHistory([{ question: displayQuestion, answer: '...' }]);
      try {
        const result = await generateFromUpload({ file, tool_types: [] });
        const payload = result?.data ?? result;
        activeSessionId = payload.id;
        setSessionId(payload.id);
      } catch (err: any) {
        setChatHistory([{ question: displayQuestion, answer: err.message || "Erreur lors de la création de la session." }]);
        setIsChatting(false);
        return;
      }
    } else {
      setChatHistory(prev => [...prev, { question: displayQuestion, answer: '...' }]);
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await askQuestion(
        activeSessionId,
        queryForAi,
        generationMode === 'annale' ? 'annale' : 'session',
        controller.signal
      );
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
    if (action === 'quiz' || action === 'flashcards') {
      setMobileActiveView('workspace');
      setActionFeedback({
        message: action === 'quiz' ? 'Génération du quiz sur la sélection...' : 'Génération des flashcards...',
        type: 'loading',
      });
      try {
        let activeSessionId = sessionId;
        if (!activeSessionId) {
          const result = await generateFromUpload({ file, tool_types: [] });
          const payload = result?.data ?? result;
          activeSessionId = payload.id;
          setSessionId(payload.id);
        }

        const res = await createFromSelection(activeSessionId, action, selectedText);
        const updatedSession = res?.data?.session;
        if (updatedSession) {
          setGeneratedContent(updatedSession.content || {});
        } else if (res?.data?.created_items || res?.data?.created_item) {
          const itemsToAdd = Array.isArray(res.data.created_items) ? res.data.created_items : [res.data.created_item];
          setGeneratedContent((prev: any) => {
            const copy = { ...(prev || {}) };
            if (action === 'quiz') {
              const currentQ = Array.isArray(copy.quiz?.questions) ? copy.quiz.questions : [];
              copy.quiz = { ...(copy.quiz || {}), questions: [...currentQ, ...itemsToAdd] };
            } else {
              const currentC = Array.isArray(copy.flashcards?.cartes) ? copy.flashcards.cartes : [];
              copy.flashcards = { ...(copy.flashcards || {}), cartes: [...currentC, ...itemsToAdd] };
            }
            return copy;
          });
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

    let activeSessionId = sessionId
    if (!activeSessionId) {
      setGeneratedContent({})
      setChatHistory([{ question: display, answer: '...' }])
      try {
        const result = await generateFromUpload({ file, tool_types: [] })
        const payload = result?.data ?? result
        activeSessionId = payload.id
        setSessionId(payload.id)
      } catch (err: any) {
        setChatHistory([{ question: display, answer: err.message || "Erreur lors de la création de la session." }])
        setIsChatting(false)
        return
      }
    } else {
      setChatHistory(prev => [...prev, { question: display, answer: '...' }])
    }

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await askQuestion(
        activeSessionId, 
        prompt, 
        generationMode === 'annale' ? 'annale' : 'session',
        controller.signal
      )
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

  const handleAddTool = async (tool: ToolType) => {
    if (!sessionId) return;
    setIsGeneratingTool(true);
    setToolError(null);
    try {
      const res = await addToolToSession(sessionId, tool);
      const payload = res.data;
      setGeneratedContent(payload.content || payload);
      setActiveTab(tool);
      if (!selectedTools.includes(tool)) {
        setSelectedTools(prev => [...prev, tool]);
      }
    } catch (e: any) {
      setToolError(e.message || `Erreur lors de la génération de ${tool}.`);
    } finally {
      setIsGeneratingTool(false);
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

  const handleCommandSelect = async (cmd: Command) => {
    setShowCommandMenu(false)

    if (cmd.category === 'tool' && cmd.toolType) {
      setChatMessage('')
      if (generatedContent && generatedContent[cmd.toolType] !== undefined) {
        setActiveTab(cmd.toolType)
      } else {
        await handleAddTool(cmd.toolType)
        setActiveTab(cmd.toolType)
      }
      return
    }

    // Action command (e.g. @expliquer, @résumer, @exemple)
    if (cmd.template) {
      setChatMessage(prev => {
        const atIdx = prev.lastIndexOf('@')
        if (atIdx !== -1) {
          return prev.slice(0, atIdx) + cmd.template
        }
        return cmd.template || ''
      })
    }
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCommandMenu) {
      const search = commandFilter.toLowerCase().trim()
      const filtered = COMMANDS.filter(c =>
        c.trigger.toLowerCase().includes(search) ||
        c.label.toLowerCase().includes(search) ||
        c.description.toLowerCase().includes(search)
      )

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

  const STUDY_TABS: ToolType[] = ['fiche', 'quiz', 'flashcards', 'mindmap', 'audio']
  const TOOL_LABELS: Record<string, string> = {
    fiche: 'Fiche',
    quiz: 'Quiz',
    flashcards: 'Flashcards',
    mindmap: 'Carte mentale',
    audio: 'Résumé audio',
    annale: 'Annale',
  }

  const isToolGenerated = (t: string) => {
    if (t === 'annale') {
      return Boolean(generatedContent && (generatedContent.sections || generatedContent.corrections || Object.keys(generatedContent).length > 0))
    }
    return generatedContent && generatedContent[t] !== undefined
  }

  return (
    <div className="flex h-full overflow-hidden flex-col md:flex-row bg-sphera-bg">
      {/* Mobile Top Bar with Segmented View Switcher */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 bg-sphera-surface-2 border-b border-sphera-border shrink-0 z-30">
        <button 
          onClick={() => navigate('/dashboard')} 
          title="Retour au tableau de bord"
          aria-label="Retour au tableau de bord"
          className="p-1.5 text-sphera-text-muted hover:bg-sphera-surface hover:text-white rounded-md transition-colors"
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
      
      {/* Left Column: PDF Preview */}
      <div className={`${mobileActiveView === 'doc' ? 'flex flex-1 w-full' : 'hidden'} ${isPdfExpanded ? 'md:flex md:w-1/2' : 'md:hidden'} border-r border-sphera-border flex-col bg-sphera-surface-2 overflow-hidden transition-all duration-300`}>
        <div className="h-14 border-b border-sphera-border flex items-center justify-between px-4 bg-sphera-bg">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => navigate('/dashboard')} 
              title="Retour au tableau de bord"
              aria-label="Retour au tableau de bord"
              className="p-1.5 text-sphera-text-muted hover:bg-sphera-surface hover:text-white rounded-md transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-white truncate">{file.name}</span>
            </div>
          </div>

          {(isImage || isPdf) && textSource && (
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

        <div className="flex-1 overflow-hidden relative bg-[#1E1E1E]">
          {docViewMode === 'doc' && isImage && fileUrl ? (
            <DocumentImageViewer
              src={fileUrl}
              alt={file.name}
              title={file.name}
            />
          ) : docViewMode === 'doc' && isPdf && fileUrl ? (
            <iframe 
              src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
              className="w-full h-full border-none custom-scrollbar"
              title="Aperçu du PDF"
            />
          ) : textSource !== null ? (
            <CourseTextReader
              initialText={textSource}
              title={file.name.replace(/\.[^/.]+$/, '')}
              isEditable={true}
              onSave={handleTextSave}
              onSelectionAction={handleSelectionAction}
            />
          ) : (
            <div className="flex-1 p-8 flex flex-col items-center justify-center text-center opacity-60 h-full">
              <div className="w-24 h-32 rounded-lg border-2 border-dashed border-sphera-border flex flex-col items-center justify-center mb-6 bg-sphera-surface">
                <FileText className="w-8 h-8 text-sphera-text-muted" />
              </div>
              <p className="text-sm text-sphera-text-muted">Aperçu direct non disponible pour ce format.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Configuration & Results Workspace */}
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
                {file.name}
              </span>
            )}
          </div>

          {generatedContent && (
            <div className="flex gap-1 bg-sphera-bg p-1 rounded-md overflow-x-auto">
              {(generationMode === 'study' ? STUDY_TABS : ['annale']).map(t => {
                const isGenerated = isToolGenerated(t);
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
                    {TOOL_LABELS[t] || (t.charAt(0).toUpperCase() + t.slice(1))}
                    {!isGenerated && generationMode === 'study' && (
                      <span className="text-[9px] bg-sphera-surface-2 px-1.5 rounded-full border border-sphera-border text-sphera-text-muted">+</span>
                    )}
                  </button>
                )
              })}
              {sessionId && (
                <button 
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                    activeTab === 'chat' ? 'bg-sphera-surface text-white' : 'text-sphera-text-muted hover:text-white'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Q&A
                </button>
              )}
            </div>
          )}
        </div>

        {/* Scrollable Content Area */}
        <div 
          className="flex-1 overflow-y-auto min-h-0 relative select-text"
          onMouseUp={handleWorkspaceSelection}
          onTouchEnd={handleWorkspaceSelection}
        >
          {!generatedContent ? (
            /* Settings View */
            <div className="p-6 sm:p-8 max-w-xl mx-auto w-full pb-8">
              <h2 className="font-display text-2xl font-bold text-white mb-6">Paramétrer la session</h2>
              
              {error && <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

              {/* Mode Toggle */}
              <div className="flex bg-sphera-surface p-1 rounded-xl w-full mb-8">
                <button
                  onClick={() => setGenerationMode('study')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    generationMode === 'study'
                      ? 'bg-sphera-surface-2 text-white shadow-sm border border-sphera-border'
                      : 'text-sphera-text-muted hover:text-white border border-transparent'
                  }`}
                >
                  Réviser un cours
                </button>
                <button
                  onClick={() => setGenerationMode('annale')}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                    generationMode === 'annale'
                      ? 'bg-sphera-surface-2 text-white shadow-sm border border-sphera-border'
                      : 'text-sphera-text-muted hover:text-white border border-transparent'
                  }`}
                >
                  Corriger une annale
                </button>
              </div>

              {generationMode === 'study' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <ToolSelector 
                    selectedTools={selectedTools}
                    onToolSelect={setSelectedTools}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <label className="text-sm font-medium text-sphera-text-muted">Type de correction</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setAnnaleMode('complete')}
                      className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        annaleMode === 'complete'
                          ? 'bg-sphera-surface-2 border-sphera-green text-white shadow-sm'
                          : 'bg-sphera-surface border-sphera-border text-sphera-text-muted hover:border-sphera-text-muted'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white mb-1">Complète</div>
                        <div className="text-xs text-sphera-text-muted">Correction détaillée étape par étape</div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-xs text-sphera-green">
                        <BookOpen className="w-4 h-4" /> Recommandé
                      </div>
                    </button>
                    <button
                      onClick={() => setAnnaleMode('rapide')}
                      className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        annaleMode === 'rapide'
                          ? 'bg-sphera-surface-2 border-sphera-green text-white shadow-sm'
                          : 'bg-sphera-surface border-sphera-border text-sphera-text-muted hover:border-sphera-text-muted'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white mb-1">Rapide</div>
                        <div className="text-xs text-sphera-text-muted">Réponses synthétiques directes</div>
                      </div>
                      <div className="mt-4 flex items-center gap-1.5 text-xs text-[#ff9800]">
                        <Zap className="w-4 h-4" /> Express
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {generationMode === 'study' && selectedTools.length === 0 ? (
                <button
                  onClick={handleStartDirectQa}
                  disabled={generating}
                  className="sphera-primary-btn w-full mt-8 py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Initialisation de la session...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5" />
                      <span>Démarrer en mode Q&A direct</span>
                    </>
                  )}
                </button>
              ) : (
                <>
                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="sphera-primary-btn w-full mt-8 py-3.5 text-sm font-bold flex items-center justify-center gap-2 shadow-lg"
                  >
                    {generating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Génération en cours...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>
                          {generationMode === 'study'
                            ? `Générer ${selectedTools.length} outil${selectedTools.length > 1 ? 's' : ''}`
                            : 'Lancer la correction'}
                        </span>
                      </>
                    )}
                  </button>

                  {generationMode === 'study' && (
                    <button
                      type="button"
                      onClick={handleStartDirectQa}
                      disabled={generating}
                      className="w-full mt-3 py-2.5 px-4 text-xs font-semibold text-sphera-text-muted hover:text-white hover:bg-sphera-surface rounded-xl border border-sphera-border/60 hover:border-sphera-border transition-all flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-sphera-green" />
                      <span>Ou démarrer directement par le Q&A (sans générer d'outils)</span>
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Results View */
            <div className="p-4 sm:p-6 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-6">
              {activeTab !== 'chat' && (
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-sphera-border">
                  <div>
                    <h2 className="text-lg font-bold text-white capitalize">{activeTab}</h2>
                    <p className="text-xs text-sphera-text-muted">Généré depuis {file.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-3 py-1.5 rounded-lg bg-sphera-surface hover:bg-sphera-surface-2 border border-sphera-border text-xs font-semibold text-white transition-colors"
                    >
                      Voir dans le dashboard
                    </button>
                  </div>
                </div>
              )}

              {/* Tool specific renders */}
              {activeTab !== 'chat' && !isToolGenerated(activeTab) ? (
                <div className="p-8 text-center bg-sphera-surface-2 rounded-2xl border border-sphera-border">
                  <p className="text-sphera-text-muted mb-4">Cet outil n'a pas encore été généré pour ce cours.</p>
                  <button
                    onClick={() => handleAddTool(activeTab as ToolType)}
                    disabled={isGeneratingTool}
                    className="sphera-primary-btn py-2 px-4 text-xs inline-flex items-center gap-2"
                  >
                    {isGeneratingTool ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    <span>Générer {TOOL_LABELS[activeTab] || activeTab}</span>
                  </button>
                  {toolError && <p className="text-red-400 text-sm mt-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{toolError}</p>}
                </div>
              ) : (
                <>
                  {activeTab === 'fiche' && <FicheView content={generatedContent.fiche} />}
                  {activeTab === 'quiz' && <QuizView content={generatedContent.quiz} />}
                  {activeTab === 'flashcards' && <FlashcardsView content={generatedContent.flashcards} />}
                  {activeTab === 'mindmap' && <MindmapView content={generatedContent.mindmap || generatedContent} />}
                  {activeTab === 'audio' && <AudioSummaryView content={generatedContent.audio || generatedContent} />}
                  {activeTab === 'annale' && <AnnaleView annale={{ content: generatedContent, mode: annaleMode }} />}
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
          )}
        </div>

        {/* Q&A Chat Input (Pinned Bottom Bar) */}
        <div className="shrink-0 w-full bg-sphera-surface-2/95 border-t border-sphera-border px-3 py-2 sm:px-4 sm:py-3 z-30 backdrop-blur-md">
          {/* Suggestions de questions */}
          {sessionId && activeTab === 'chat' && (
            <div className="max-w-3xl mx-auto mb-2">
              <QuestionSuggestions
                sessionId={sessionId}
                askedQuestions={chatHistory.map(m => m.question)}
                onSelect={(q) => {
                  setChatMessage(q)
                  chatInputRef.current?.focus()
                }}
              />
            </div>
          )}

          {/* Chat input with @ command detection */}
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
                placeholder="Posez une question sur ce document... ou @ pour les commandes"
                value={chatMessage}
                onChange={e => handleChatInputChange(e.target.value)}
                onKeyDown={handleChatKeyDown}
                disabled={isChatting || generating}
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
                  disabled={!chatMessage.trim() || generating}
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
    </div>
  )
}

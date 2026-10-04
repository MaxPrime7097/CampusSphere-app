import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  FileText,
  Cards,
  Exam,
  Note,
  Waveform,
  GitFork,
  ArrowLeft,
  ArrowsOut as Maximize2,
  ArrowsIn as Minimize2,
  PaperPlaneTilt as Send,
  Square,
  ChatCircle as MessageSquare,
  Robot as Bot,
  User,
  At as AtSign,
  Sparkle as Sparkles,
  BookOpen,
  Lightning as Zap,
  Spinner as Loader2,
  Plus,
  WarningCircle as AlertCircle,
  Check,
  Trash as Trash2,
  Stack as Layers,
} from "@phosphor-icons/react";
import { ToolSelector, type ToolType } from '../components/app/ToolSelector'
import { GenerateButton } from '../components/app/GenerateButton'
import { pendingUploadFile } from '../store/fileStore'
import { FicheView, QuizView, FlashcardsView, AnnaleView, MindmapView, AudioSummaryView } from '../components/app/ResultViews'
import { ChapterFicheView } from '../components/app/ChapterFicheView'
import { ArtefactList } from '../components/app/ArtefactList'
import { ChatThreadBar } from '../components/app/ChatThreadBar'
import { StudyWorkspacePanel } from '../components/app/StudyWorkspacePanel'
import {
  generateFromUpload,
  generateAnnale,
  askQuestion,
  addToolToSession,
  createFromSelection,
  createArtefact,
  updateArtefact,
  deleteArtefact,
  regenerateFiche,
  createChatThread,
  sendThreadMessage,
  deleteChatThread,
  type ArtefactItem,
  type ChatThreadItem,
} from '../services/spheraApi'
import { QuestionSuggestions } from '../components/app/QuestionSuggestions'
import { normalizeAiResponse } from '../utils/normalizeAiResponse'
import { CommandMenu, COMMANDS, type Command } from '../components/app/CommandMenu'
import { isTextEnglish } from '../utils/detectLanguage'
import { QuotaIndicator } from '../components/app/QuotaIndicator'
import { CourseTextReader } from '../components/app/CourseTextReader'
import { DocumentImageViewer } from '../components/app/DocumentImageViewer'
import { AiMessageItem } from '../components/app/AiMessageItem'
import { TextSelectionToolbar, type SelectionActionType } from '../components/app/TextSelectionToolbar'
import { useTranslation } from 'react-i18next'
import { setCached } from '../utils/sessionCache'
import { updateSessionDetailCache } from '../hooks/useSpheraQueries'

export default function CreateSession() {
  const { t } = useTranslation('study')
  const navigate = useNavigate()
  const [currentFile, setCurrentFile] = useState<File | null>(pendingUploadFile)
  const file = currentFile

  const [generationMode, setGenerationMode] = useState<'study' | 'annale'>('study')
  const [selectedTools, setSelectedTools] = useState<ToolType[]>(['fiche'])
  const [annaleMode, setAnnaleMode] = useState<'complete' | 'rapide'>('complete')
  const [generating, setGenerating] = useState(false)
  const [creationStep, setCreationStep] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [textSource, setTextSource] = useState<string | null>(null)
  
  // Workspace State
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [rawAnnaleData, setRawAnnaleData] = useState<any>(null)
  const [isPdfExpanded, setIsPdfExpanded] = useState(true)
  const [docViewMode, setDocViewMode] = useState<'doc' | 'text'>('doc')
  const [activeTab, setActiveTab] = useState<string>('fiche')
  const [isGeneratingTool, setIsGeneratingTool] = useState(false)
  const [generatingToolType, setGeneratingToolType] = useState<string | null>(null)
  const [toolError, setToolError] = useState<string | null>(null)

  // Artefacts & Multi-threads state
  const [artefacts, setArtefacts] = useState<ArtefactItem[]>([])
  const [activeArtefact, setActiveArtefact] = useState<ArtefactItem | null>(null)
  const [threads, setThreads] = useState<ChatThreadItem[]>([])
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null)
  const [isRegeneratingFiche, setIsRegeneratingFiche] = useState(false)
  const [isGeneratingArtefact, setIsGeneratingArtefact] = useState(false)
  const [generatingChapterArtefact, setGeneratingChapterArtefact] = useState<{ type: 'quiz' | 'flashcards'; chapter: string } | null>(null)
  const [noteContentText, setNoteContentText] = useState('')
  
  // Chat State
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [isChatting, setIsChatting] = useState(false)

  // Command menu state
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [commandFilter, setCommandFilter] = useState('')
  const [commandActiveIdx, setCommandActiveIdx] = useState(0)

  // Floating feedback notification
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'loading' | 'success' | 'error' } | null>(null)
  const showFeedback = (message: string, type: 'loading' | 'success' | 'error', duration = 3500) => {
    setActionFeedback({ message, type })
    if (type !== 'loading') {
      setTimeout(() => {
        setActionFeedback((prev) => (prev?.message === message ? null : prev))
      }, duration)
    }
  }

  const handleGenerateChapterQuiz = async (chapterTitle: string, chapterSummary: string) => {
    if (!sessionId) return
    setIsGeneratingArtefact(true)
    setGeneratingChapterArtefact({ type: 'quiz', chapter: chapterTitle })
    showFeedback(`Création du quiz pour "${chapterTitle}" en cours (0.5 gén)...`, 'loading')
    try {
      const res = await createArtefact(sessionId, {
        type: 'quiz',
        title: `Quiz - ${chapterTitle}`,
        subtitle: `Quiz ciblé • ${chapterTitle}`,
        target_chapter: chapterTitle,
        selection_text: chapterSummary,
      })
      const newArt = res.data
      setArtefacts(prev => [newArt, ...prev])
      setActiveArtefact(newArt)
      setActiveTab('artefacts')
      showFeedback(`Le quiz pour "${chapterTitle}" est prêt !`, 'success')
    } catch (err: any) {
      showFeedback(err.message || 'Erreur lors de la génération du quiz par chapitre.', 'error')
    } finally {
      setIsGeneratingArtefact(false)
      setGeneratingChapterArtefact(null)
    }
  }

  const handleGenerateChapterFlashcards = async (chapterTitle: string, chapterSummary: string) => {
    if (!sessionId) return
    setIsGeneratingArtefact(true)
    setGeneratingChapterArtefact({ type: 'flashcards', chapter: chapterTitle })
    showFeedback(`Création des flashcards pour "${chapterTitle}" en cours (0.5 gén)...`, 'loading')
    try {
      const res = await createArtefact(sessionId, {
        type: 'flashcards',
        title: `Flashcards - ${chapterTitle}`,
        subtitle: `Flashcards • ${chapterTitle}`,
        target_chapter: chapterTitle,
        selection_text: chapterSummary,
      })
      const newArt = res.data
      setArtefacts(prev => [newArt, ...prev])
      setActiveArtefact(newArt)
      setActiveTab('artefacts')
      showFeedback(`Les flashcards pour "${chapterTitle}" sont prêtes !`, 'success')
    } catch (err: any) {
      showFeedback(err.message || 'Erreur lors de la génération des flashcards par chapitre.', 'error')
    } finally {
      setIsGeneratingArtefact(false)
      setGeneratingChapterArtefact(null)
    }
  }

  const handleRegenerateFiche = async () => {
    if (!sessionId) return
    setIsRegeneratingFiche(true)
    showFeedback('Régénération de la fiche en cours...', 'loading')
    try {
      const res = await regenerateFiche(sessionId)
      if (res.data?.fiche) {
        setGeneratedContent((prev: any) => ({
          ...prev,
          fiche: res.data.fiche,
        }))
        showFeedback('Fiche régénérée avec succès !', 'success')
      }
    } catch (err: any) {
      showFeedback(err.message || 'Erreur lors de la régénération de la fiche.', 'error')
    } finally {
      setIsRegeneratingFiche(false)
    }
  }

  const handleSelectArtefact = (art: ArtefactItem) => {
    setActiveArtefact(art)
    if (art.type === 'note') {
      setNoteContentText(art.content?.text || '')
    }
  }

  const handleDeleteArtefact = async (artId: number) => {
    const backup = artefacts
    setArtefacts(prev => prev.filter(a => a.id !== artId))
    if (activeArtefact?.id === artId) {
      setActiveArtefact(null)
    }
    showFeedback('Outil supprimé.', 'success')
    try {
      await deleteArtefact(artId)
    } catch (err: any) {
      setArtefacts(backup)
      showFeedback(err.message || "Erreur lors de la suppression de l'artefact.", 'error')
    }
  }

  const handleRenameArtefact = async (artId: number, newTitle: string) => {
    const backup = artefacts
    setArtefacts(prev => prev.map(a => a.id === artId ? { ...a, title: newTitle } : a))
    if (activeArtefact?.id === artId) {
      setActiveArtefact(prev => prev ? { ...prev, title: newTitle } : null)
    }
    showFeedback('Outil renommé.', 'success')
    try {
      await updateArtefact(artId, { title: newTitle })
    } catch (err: any) {
      setArtefacts(backup)
      showFeedback(err.message || 'Erreur lors du renommage.', 'error')
    }
  }

  const handleNewNote = async () => {
    if (!sessionId) return
    try {
      const noteCount = artefacts.filter(a => a.type === 'note').length + 1
      const res = await createArtefact(sessionId, {
        type: 'note',
        title: `Note #${noteCount}`,
        subtitle: 'Note personnelle',
        content: { text: '' },
      })
      const newArt = res.data
      setArtefacts(prev => [newArt, ...prev])
      setActiveArtefact(newArt)
      setNoteContentText('')
      setActiveTab('artefacts')
      showFeedback('Nouvelle note créée.', 'success')
      return newArt
    } catch (err: any) {
      showFeedback(err.message || 'Erreur lors de la création de la note.', 'error')
    }
  }

  const handleSaveNote = async (artId: number, text: string) => {
    try {
      await updateArtefact(artId, { content: { text } })
      setArtefacts(prev => prev.map(a => a.id === artId ? { ...a, content: { text } } : a))
      if (activeArtefact?.id === artId) {
        setActiveArtefact(prev => prev ? { ...prev, content: { text } } : null)
      }
      showFeedback('Note enregistrée.', 'success')
    } catch (err: any) {
      showFeedback(err.message || "Erreur lors de l'enregistrement de la note.", 'error')
    }
  }

  const handleCreateThread = async (title: string) => {
    if (!sessionId) return
    try {
      const res = await createChatThread(sessionId, title)
      const newThread = res.data
      setThreads(prev => [...prev, newThread])
      setActiveThreadId(newThread.id)
      setActiveTab('chat')
      showFeedback('Fil de discussion créé.', 'success')
    } catch (err: any) {
      showFeedback(err.message || 'Erreur lors de la création du fil de discussion.', 'error')
    }
  }

  const handleSelectThread = (threadId: number) => {
    setActiveThreadId(threadId)
  }

  const handleSendThreadMessage = async (threadId: number, questionText: string) => {
    setIsChatting(true)
    setActiveTab('chat')
    try {
      setThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          return {
            ...t,
            messages: [
              ...(t.messages || []),
              { id: Date.now(), role: 'user' as const, content: questionText, createdAt: new Date().toISOString() },
              { id: Date.now() + 1, role: 'assistant' as const, content: '...', createdAt: new Date().toISOString() }
            ]
          }
        }
        return t
      }))

      const res = await sendThreadMessage(threadId, questionText)
      const assistantMsg = res.data

      setThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          const msgs = (t.messages || []).map(m => m.content === '...' ? {
            id: assistantMsg.id,
            role: 'assistant' as const,
            content: assistantMsg.content,
            createdAt: assistantMsg.createdAt,
          } : m)
          return { ...t, messages: msgs }
        }
        return t
      }))
    } catch (err: any) {
      setThreads(prev => prev.map(t => {
        if (t.id === threadId) {
          const msgs = (t.messages || []).map(m => m.content === '...' ? {
            ...m,
            content: "Erreur lors de l'envoi du message."
          } : m)
          return { ...t, messages: msgs }
        }
        return t
      }))
    } finally {
      setIsChatting(false)
    }
  }

  const handleDeleteThread = async (threadId: number) => {
    try {
      await deleteChatThread(threadId)
      setThreads(prev => prev.filter(t => t.id !== threadId))
      if (activeThreadId === threadId) {
        const remaining = threads.filter(t => t.id !== threadId)
        setActiveThreadId(remaining.length ? remaining[0].id : null)
      }
      showFeedback('Fil supprimé.', 'success')
    } catch (err: any) {
      showFeedback(err.message || 'Erreur lors de la suppression du fil.', 'error')
    }
  }
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
    setCreationStep(1)
    setError(null)
    const stepTimer = setTimeout(() => setCreationStep(2), 1500)
    try {
      const result = await generateFromUpload({ file, tool_types: [] })
      clearTimeout(stepTimer)
      const payload = result?.data ?? result
      setGeneratedContent(payload.content || {})
      if (payload.extracted_text) {
        setTextSource(payload.extracted_text)
      }
      if (payload.id) setSessionId(payload.id)
      if (payload.qa_history) setChatHistory(payload.qa_history)
      setActiveTab('chat')
    } catch (e: any) {
      clearTimeout(stepTimer)
      setError(e.message || "Erreur lors de l'initialisation de la session Q&A.")
    } finally {
      setGenerating(false)
    }
  }

  const handleStartAnnale = async () => {
    if (!file) return
    setGenerationMode('annale')
    setGenerating(true)
    setCreationStep(1)
    setError(null)
    const stepTimer = setTimeout(() => setCreationStep(2), 1500)
    try {
      // Fast initialization: extract text and create session instantly (1-2s)
      const result = await generateFromUpload({ file, tool_types: [] })
      clearTimeout(stepTimer)
      const payload = result?.data ?? result
      if (payload.id) {
        setSessionId(payload.id)
      }
      if (payload.extracted_text) {
        setTextSource(payload.extracted_text)
      }
      if (payload.qa_history) setChatHistory(payload.qa_history)
      if (payload.artefacts) setArtefacts(payload.artefacts)
      if (payload.chat_threads && payload.chat_threads.length > 0) {
        setThreads(payload.chat_threads)
        setActiveThreadId(payload.chat_threads[0].id)
      }
      setGeneratedContent({ isAnnaleWorkspace: true, extracted_text: payload.extracted_text, id: payload.id })
      setRawAnnaleData({ isAnnaleWorkspace: true, extracted_text: payload.extracted_text, id: payload.id })
      setActiveTab('chat')
    } catch (e: any) {
      clearTimeout(stepTimer)
      setError(e.message || "Erreur lors de la préparation de l'espace annale.")
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
      if (payload.artefacts) setArtefacts(payload.artefacts);
      if (payload.chat_threads) {
        setThreads(payload.chat_threads);
        if (payload.chat_threads.length > 0) {
          setActiveThreadId(payload.chat_threads[0].id);
        }
      }
      
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
      const foundCmd = COMMANDS.find(c =>
        c.trigger.toLowerCase() === cmdTrigger ||
        (c.aliases && c.aliases.some(a => a.toLowerCase() === cmdTrigger))
      );

      const isDocEn = isTextEnglish(raw);
      if (foundCmd && foundCmd.category === 'action' && (foundCmd.prefix || foundCmd.prefixEn)) {
        displayQuestion = raw;
        const prefix = isDocEn ? (foundCmd.prefixEn || foundCmd.prefix) : (foundCmd.prefix || foundCmd.prefixEn);
        queryForAi = rest 
          ? `${prefix}${rest}` 
          : (isDocEn ? 'Explain the essential concepts of the course clearly.' : `Explique-moi les concepts essentiels du cours de manière pédagogique.`);
      } else if (foundCmd && foundCmd.category === 'tool') {
        displayQuestion = raw;
        queryForAi = rest 
          ? (isDocEn ? `Regarding the course, explain the essential elements of "${rest}".` : `En lien avec le cours, donne-moi les éléments nécessaires sur "${rest}".`)
          : (isDocEn ? 'Summarize the essential points of the course.' : `Résume les points essentiels du cours.`);
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
    setGeneratingToolType(tool);
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
      const errMsg = e.message || `Erreur lors de la génération de ${tool}.`;
      setToolError(errMsg);
      showFeedback(errMsg, 'error');
    } finally {
      setIsGeneratingTool(false);
      setGeneratingToolType(null);
    }
  }

  const handleSendDirectQuestion = async (query: string) => {
    if (!sessionId || !query.trim() || isChatting) return
    setIsChatting(true)
    setChatHistory(prev => [...prev, { question: query, answer: '...' }])
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await askQuestion(sessionId, query, generationMode === 'annale' ? 'annale' : 'session', controller.signal)
      const normalized = normalizeAiResponse(res?.data?.answer)
      const newEntry = {
        question: query,
        answer: normalized,
        created_at: res?.data?.created_at || new Date().toISOString(),
      }
      setChatHistory(prev => {
        const newHist = [...prev]
        if (newHist.length > 0 && newHist[newHist.length - 1].answer === '...') {
          newHist[newHist.length - 1] = newEntry
        } else {
          newHist.push(newEntry)
        }
        return newHist
      })
      if (sessionId) {
        updateSessionDetailCache(sessionId, generationMode === 'annale' ? 'annale' : 'session', (old: any) => {
          const prevQa = Array.isArray(old?.qa_history) ? old.qa_history : [];
          return { ...old, qa_history: [...prevQa, newEntry] };
        });
      }
    } catch (e: any) {
      if (e?.name === 'AbortError' || controller.signal.aborted) return
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

  const handleSendChatMessage = (msg: string) => {
    if (activeThreadId) {
      handleSendThreadMessage(activeThreadId, msg)
    } else {
      setChatMessage(msg)
      handleSendDirectQuestion(msg)
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

  const STUDY_TABS: ToolType[] = ['fiche', 'quiz', 'flashcards', 'mindmap', 'audio', 'artefacts' as ToolType]
  const TOOL_LABELS: Record<string, string> = {
    fiche: t('tools.fiche.title'),
    quiz: t('tools.quiz.title'),
    flashcards: t('tools.flashcards.title'),
    mindmap: t('tools.mindmap.title'),
    audio: t('tools.audio.title'),
    annale: t('tools.annale.title'),
    artefacts: `Mes ensembles (${artefacts.length})`,
  }

  const isToolGenerated = (tKey: string) => {
    if (tKey === 'artefacts') return true
    if (tKey === 'fiche') return Boolean(generatedContent && generatedContent.fiche)
    if (tKey === 'annale') {
      return Boolean(generatedContent && (generatedContent.sections || generatedContent.corrections || Object.keys(generatedContent).length > 0))
    }
    return generatedContent && generatedContent[tKey] !== undefined
  }

  return (
    <div className="flex h-full overflow-hidden flex-col md:flex-row bg-sphera-bg">
      {/* Mobile Top Bar with Segmented View Switcher */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 bg-sphera-surface-2 border-b border-sphera-border shrink-0 z-30">
        <button 
          onClick={() => navigate('/dashboard')} 
          title={t('createSession.backToDashboard')}
          aria-label={t('createSession.backToDashboard')}
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
            {isImage ? t('createSession.image') : isPdf ? t('createSession.pdf') : t('createSession.document')}
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
            {t('createSession.studySpace')}
          </button>
        </div>
      </div>
      
      {/* Left Column: PDF Preview */}
      <div className={`${mobileActiveView === 'doc' ? 'flex flex-1 w-full min-h-0' : 'hidden'} ${isPdfExpanded ? 'md:flex md:w-1/2' : 'md:hidden'} border-r border-sphera-border flex-col bg-sphera-surface-2 overflow-hidden transition-all duration-300`}>
        <div className="h-14 border-b border-sphera-border flex items-center justify-between px-4 bg-sphera-bg">
          <div className="flex items-center gap-3 min-w-0">
            <button 
              onClick={() => navigate('/dashboard')} 
              title={t('createSession.backToDashboard')}
              aria-label={t('createSession.backToDashboard')}
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
                {isImage ? t('createSession.image') : t('createSession.pdf')}
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
                <span>{t('createSession.interactiveText')}</span>
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
              title={t('createSession.pdfPreviewTitle')}
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
              <p className="text-sm text-sphera-text-muted">{t('createSession.previewNotAvailable')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Configuration & Results Workspace */}
      <div className={`${mobileActiveView === 'workspace' ? 'flex flex-1 w-full min-h-0' : 'hidden'} ${isPdfExpanded ? 'md:flex md:w-1/2' : 'md:flex md:w-full'} flex-col bg-sphera-bg relative shadow-[-10px_0_30px_rgba(0,0,0,0.5)] transition-all duration-300`}>

        {!generatedContent ? (
          /* ── PRE-GENERATION: 2 big cards + loading state ── */
          <div className="flex flex-col h-full">
            {/* Mini toolbar */}
            <div className="h-14 border-b border-sphera-border flex items-center justify-between px-4 bg-sphera-surface-2/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPdfExpanded(!isPdfExpanded)}
                  className="p-1.5 rounded-md text-sphera-text-muted hover:text-white hover:bg-sphera-surface transition-colors"
                  title={isPdfExpanded ? t('createSession.fullscreen') : t('createSession.showPreview')}
                >
                  {isPdfExpanded ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                {!isPdfExpanded && (
                  <span className="text-sm font-semibold text-white truncate max-w-[200px] border-l border-sphera-border pl-3">
                    {file.name}
                  </span>
                )}
              </div>
              <QuotaIndicator />
            </div>

            {/* Cards */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto">
              {generating ? (
                <div className="flex flex-col items-center gap-4 text-center animate-in fade-in max-w-sm">
                  <div className="w-16 h-16 rounded-2xl bg-sphera-surface-2 border border-sphera-border flex items-center justify-center shadow-lg relative">
                    <Loader2 className="w-8 h-8 text-sphera-green animate-spin" />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-base mb-1">
                      {generationMode === 'annale' ? "Préparation de l'espace d'annale…" : "Préparation de l'espace d'étude…"}
                    </p>
                    <p className="text-xs text-sphera-text-muted">
                      {creationStep === 1
                        ? "Étape 1/2 : Extraction et analyse du document…"
                        : "Étape 2/2 : Initialisation de l'espace d'étude…"}
                    </p>
                  </div>
                  {/* Step indicators */}
                  <div className="flex items-center gap-2 mt-1 w-48">
                    <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${creationStep >= 1 ? 'bg-sphera-green' : 'bg-sphera-surface-2'}`} />
                    <div className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${creationStep >= 2 ? 'bg-sphera-green' : 'bg-sphera-surface-2'}`} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-8 text-center">
                    <h2 className="font-display text-2xl font-bold text-white mb-2">{t('createSession.title')}</h2>
                    <p className="text-sm text-sphera-text-muted">Choisissez comment exploiter ce document</p>
                  </div>

                  {error && <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400 w-full max-w-md">{error}</div>}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                    {/* Card 1: Réviser un cours */}
                    <button
                      onClick={() => {
                        setGenerationMode('study')
                        setSelectedTools([])
                        handleStartDirectQa()
                      }}
                      disabled={generating}
                      className="group flex flex-col items-center justify-center p-6 rounded-2xl border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 hover:border-sphera-border/80 transition-all duration-200 text-center cursor-pointer shadow-sm"
                    >
                      <div className="w-11 h-11 rounded-xl bg-sphera-surface-2 border border-sphera-border flex items-center justify-center mb-3 group-hover:border-sphera-green/40 transition-colors">
                        <BookOpen weight="duotone" className="w-5 h-5 text-sphera-green" />
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1">Réviser un cours</h3>
                      <p className="text-xs text-sphera-text-muted">Fiches, quiz, flashcards…</p>
                    </button>

                    {/* Card 2: Corriger une annale */}
                    <button
                      onClick={handleStartAnnale}
                      disabled={generating}
                      className="group flex flex-col items-center justify-center p-6 rounded-2xl border border-sphera-border bg-sphera-surface hover:bg-sphera-surface-2 hover:border-sphera-border/80 transition-all duration-200 text-center cursor-pointer shadow-sm"
                    >
                      <div className="w-11 h-11 rounded-xl bg-sphera-surface-2 border border-sphera-border flex items-center justify-center mb-3 group-hover:border-orange-500/40 transition-colors">
                        <Exam weight="duotone" className="w-5 h-5 text-orange-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-white mb-1">Corriger une annale</h3>
                      <p className="text-xs text-sphera-text-muted">Corrigé détaillé pas à pas</p>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          /* ── POST-GENERATION: StudyWorkspacePanel handles everything ── */
          <StudyWorkspacePanel
            sessionId={sessionId}
            documentTitle={file.name.replace(/\.[^/.]+$/, '')}
            sessionContent={generatedContent}
            artefacts={artefacts}
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={handleSelectThread}
            onCreateThread={handleCreateThread}
            onDeleteThread={handleDeleteThread}
            chatHistory={chatHistory}
            isChatting={isChatting}
            onSendMessage={handleSendChatMessage}
            onStopChat={handleStopChat}
            onEditMessage={handleEditMessage}
            onRegenerateResponse={handleRegenerateResponse}
            isGeneratingTool={isGeneratingTool}
            generatingToolType={generatingToolType}
            onGenerateTool={handleAddTool}
            onDeleteArtefact={handleDeleteArtefact}
            onRenameArtefact={handleRenameArtefact}
            onNewNote={handleNewNote}
            onSaveNote={handleSaveNote}
            onGenerateChapterQuiz={handleGenerateChapterQuiz}
            onGenerateChapterFlashcards={handleGenerateChapterFlashcards}
            onRegenerateFiche={handleRegenerateFiche}
            isRegeneratingFiche={isRegeneratingFiche}
            isGeneratingArtefact={isGeneratingArtefact}
            generatingChapterArtefact={generatingChapterArtefact}
            isPdfExpanded={isPdfExpanded}
            onTogglePdfExpanded={() => setIsPdfExpanded(!isPdfExpanded)}
            rawAnnale={generationMode === 'annale' ? (rawAnnaleData || generatedContent) : undefined}
            onArtefactCreated={(newArt) => setArtefacts(prev => [newArt, ...prev])}
            onCreateNoteWithContent={async (title, text) => {
              if (!sessionId) return
              try {
                const res = await createArtefact(sessionId, {
                  type: 'note',
                  title,
                  subtitle: 'Créée depuis le Q&A',
                  content: { text },
                })
                setArtefacts(prev => [res.data, ...prev])
                showFeedback('Note enregistrée !', 'success')
              } catch (err: any) {
                showFeedback(err?.message || "Erreur lors de l'enregistrement de la note", 'error')
              }
            }}
            extractedText={generatedContent?.extracted_text || rawAnnaleData?.extracted_text || ''}
          />
        )}
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


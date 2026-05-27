import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FileText, ArrowLeft } from 'lucide-react'
import { ToolSelector, type ToolType } from '../components/app/ToolSelector'
import { GenerateButton } from '../components/app/GenerateButton'
import { pendingUploadFile } from '../store/fileStore'
import { Maximize2, Minimize2, Send, MessageSquare, Bot, User } from 'lucide-react'
import { FicheView, QuizView, FlashcardsView, AnnaleView } from '../components/app/ResultViews'
import { generateFromUpload, generateAnnale, askQuestion } from '../services/spheraApi'
import { Sparkles } from 'lucide-react'
import { QuestionSuggestions } from '../components/app/QuestionSuggestions'
import { CommandMenu, COMMANDS, type Command } from '../components/app/CommandMenu'

export default function CreateSession() {
  const navigate = useNavigate()
  const file = pendingUploadFile

  const [generationMode, setGenerationMode] = useState<'study' | 'annale'>('study')
  const [selectedTools, setSelectedTools] = useState<ToolType[]>(['fiche'])
  const [annaleMode, setAnnaleMode] = useState<'complete' | 'rapide'>('complete')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  
  // Workspace State
  const [generatedContent, setGeneratedContent] = useState<any>(null)
  const [isPdfExpanded, setIsPdfExpanded] = useState(true)
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
  const chatInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!file) {
      navigate('/dashboard', { replace: true })
      return
    }

    if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      const url = URL.createObjectURL(file)
      setFileUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file, navigate])

  if (!file) return null

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    try {
      let result;
      if (generationMode === 'study') {
        const types = selectedTools.length > 0 ? selectedTools : ['fiche'];
        result = await generateFromUpload({ file, tool_types: types as ToolType[] });
      } else {
        result = await generateAnnale({ file, mode: annaleMode });
      }

      const payload = result?.data ?? result;
      setGeneratedContent(payload.content || payload);
      if (payload.id) setSessionId(payload.id);
      if (payload.qa_history) setChatHistory(payload.qa_history);
      
      // Set active tab based on what was generated
      const generatedTypes = payload.tool_types || (generationMode === 'study' ? selectedTools : ['annale']);
      if (generatedTypes && generatedTypes.length > 0) {
        setActiveTab(generatedTypes[0]);
      } else {
        setActiveTab(generationMode === 'study' ? selectedTools[0] || 'fiche' : 'annale');
      }
      
    } catch (e: any) {
      setError(e.message || 'Erreur lors de la génération avec le serveur CampusSphere.')
    } finally {
      setGenerating(false)
    }
  }

  const handleSendChat = async () => {
    if (!chatMessage.trim() || !sessionId) return;
    
    const msg = chatMessage;
    setChatMessage('');
    setIsChatting(true);
    setActiveTab('chat');
    
    setChatHistory(prev => [...prev, { question: msg, answer: '...' }]);
    
    try {
      const res = await askQuestion(sessionId, msg);
      setChatHistory(prev => {
        const newHist = [...prev];
        newHist[newHist.length - 1].answer = res.data.answer;
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

  const handleAddTool = async (tool: ToolType) => {
    if (!sessionId) return;
    setIsGeneratingTool(true);
    setToolError(null);
    try {
      // Import this from spheraApi.ts at the top if needed (we'll assume it's imported or we'll add it)
      const { addToolToSession } = await import('../services/spheraApi');
      const res = await addToolToSession(sessionId, tool);
      
      const payload = res.data;
      setGeneratedContent(payload.content);
      // Selected tools will be implicitly updated because generatedContent now has it
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
    const atIdx = val.lastIndexOf('@')
    if (atIdx !== -1) {
      const after = val.slice(atIdx + 1)
      if (!after.includes(' ')) {
        setShowCommandMenu(true)
        setCommandFilter('@' + after)
        setCommandActiveIdx(0)
        return
      }
    }
    setShowCommandMenu(false)
  }

  const handleCommandSelect = async (cmd: Command) => {
    // Nettoyer le @... du message
    setChatMessage(prev => prev.replace(/@\w*$/, '').trim())
    setShowCommandMenu(false)
    // Si l'outil est déjà généré → naviguer directement
    if (generatedContent && generatedContent[cmd.toolType] !== undefined) {
      setActiveTab(cmd.toolType)
    } else {
      // Sinon lancer la génération
      await handleAddTool(cmd.toolType)
      setActiveTab(cmd.toolType)
    }
  }

  const handleChatKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showCommandMenu) {
      const filtered = COMMANDS.filter(c =>
        c.trigger.includes(commandFilter.toLowerCase()) ||
        c.label.toLowerCase().includes(commandFilter.toLowerCase())
      )
      if (e.key === 'ArrowDown') { e.preventDefault(); setCommandActiveIdx(i => Math.min(i + 1, filtered.length - 1)) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setCommandActiveIdx(i => Math.max(i - 1, 0)) }
      if (e.key === 'Enter') { e.preventDefault(); if (filtered[commandActiveIdx]) { handleCommandSelect(filtered[commandActiveIdx]); } return }
      if (e.key === 'Escape') { setShowCommandMenu(false); return }
      return
    }
    if (e.key === 'Enter') handleSendChat()
  }

  const STUDY_TABS = ['fiche', 'quiz', 'flashcards']

  return (
    <div className="flex h-full overflow-hidden flex-col md:flex-row bg-sphera-bg">
      
      {/* Left Column: PDF Preview */}
      <div className={`${isPdfExpanded ? 'w-full md:w-1/2 flex' : 'hidden'} border-r border-sphera-border flex-col bg-sphera-surface-2 overflow-hidden transition-all duration-300`}>
        <div className="h-14 border-b border-sphera-border flex items-center px-4 gap-4 bg-sphera-bg">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="p-1.5 text-sphera-text-muted hover:bg-sphera-surface hover:text-white rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-white truncate">{file.name}</span>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative bg-[#1E1E1E]">
          {fileUrl ? (
            <iframe 
              src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
              className="w-full h-full border-none custom-scrollbar"
              title="Aperçu du PDF"
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
                {file.name}
              </span>
            )}
          </div>

          {generatedContent && (
            <div className="flex gap-1 bg-sphera-bg p-1 rounded-md overflow-x-auto">
              {(generationMode === 'study' ? STUDY_TABS : ['annale']).map(t => {
                const isGenerated = generatedContent[t] !== undefined;
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
        <div className="flex-1 overflow-y-auto relative pb-24">
          {!generatedContent ? (
            /* Settings View */
            <div className="p-8 max-w-xl mx-auto w-full">
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
                  <h3 className="text-white font-medium text-lg px-1">Mode de correction</h3>
                  <div className="p-5 rounded-2xl bg-sphera-surface-2 border border-sphera-border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setAnnaleMode('complete')}
                        className={`py-4 px-4 rounded-xl text-left transition-all border relative overflow-hidden ${
                          annaleMode === 'complete'
                            ? 'bg-sphera-green/10 border-sphera-green shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                            : 'bg-sphera-bg border-sphera-border hover:bg-sphera-surface hover:border-sphera-border/80'
                        }`}
                      >
                        <span className={`block font-semibold text-sm mb-1 ${annaleMode === 'complete' ? 'text-sphera-green' : 'text-white'}`}>
                          Complète
                        </span>
                        <span className="block text-xs text-sphera-text-muted">Réponse + explication + chapitre</span>
                      </button>
                      <button
                        onClick={() => setAnnaleMode('rapide')}
                        className={`py-4 px-4 rounded-xl text-left transition-all border relative overflow-hidden ${
                          annaleMode === 'rapide'
                            ? 'bg-sphera-green/10 border-sphera-green shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                            : 'bg-sphera-bg border-sphera-border hover:bg-sphera-surface hover:border-sphera-border/80'
                        }`}
                      >
                        <span className={`block font-semibold text-sm mb-1 ${annaleMode === 'rapide' ? 'text-sphera-green' : 'text-white'}`}>
                          Rapide
                        </span>
                        <span className="block text-xs text-sphera-text-muted">Réponses directes, zéro blabla</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-12">
                <GenerateButton 
                  onGenerate={handleGenerate}
                  disabled={generationMode === 'study' && selectedTools.length === 0}
                  isGenerating={generating}
                />
              </div>
            </div>
          ) : (
            /* Results View */
            <div className="p-6 md:p-8 max-w-3xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              {['fiche', 'quiz', 'flashcards'].includes(activeTab) && !generatedContent[activeTab] ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-sphera-surface-2 rounded-2xl border border-sphera-border">
                  <Bot className="w-12 h-12 text-sphera-text-muted mx-auto mb-4 opacity-50" />
                  <h3 className="text-xl font-bold text-white mb-2">Cet outil n'a pas encore été généré</h3>
                  <p className="text-sm text-sphera-text-muted mb-8 max-w-sm">
                    Génère ce contenu instantanément en utilisant l'analyse déjà effectuée sur ton document.
                  </p>
                  <button 
                    onClick={() => handleAddTool(activeTab as ToolType)}
                    disabled={isGeneratingTool}
                    className="sphera-primary-btn text-sm px-6 py-2.5 flex items-center gap-2"
                  >
                    {isGeneratingTool ? (
                      <>Génération en cours...</>
                    ) : (
                      <><Sparkles className="w-4 h-4"/> Générer {activeTab === 'flashcards' ? 'les' : 'le'} {activeTab}</>
                    )}
                  </button>
                  {toolError && <p className="text-red-400 text-sm mt-4 bg-red-500/10 p-3 rounded-lg border border-red-500/20">{toolError}</p>}
                </div>
              ) : (
                <>
                  {activeTab === 'fiche' && <FicheView content={generatedContent.fiche} />}
                  {activeTab === 'quiz' && <QuizView content={generatedContent.quiz} />}
                  {activeTab === 'flashcards' && <FlashcardsView content={generatedContent.flashcards} />}
                  {activeTab === 'annale' && <AnnaleView annale={{ content: generatedContent, mode: annaleMode }} />}
                </>
              )}
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
          )}
        </div>

        {/* Q&A Chat Input (Fixed Bottom) */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-sphera-bg via-sphera-bg/90 to-transparent p-4 pt-8 z-30">
          {/* Suggestions de questions */}
          {sessionId && activeTab === 'chat' && (
            <QuestionSuggestions
              sessionId={sessionId}
              onSelect={(q) => {
                setChatMessage(q)
                chatInputRef.current?.focus()
              }}
            />
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
            <div className="flex items-center gap-3 bg-sphera-surface-2 border border-sphera-border rounded-full p-2 pl-5 shadow-[0_0_30px_rgba(0,0,0,0.5)] focus-within:border-sphera-green/50 transition-colors">
              <MessageSquare className="w-4 h-4 text-sphera-text-muted hidden sm:block" />
              <input 
                ref={chatInputRef}
                type="text" 
                placeholder={sessionId ? "Demandez n'importe quoi... ou @ pour les commandes" : "Génère d'abord une session"}
                value={chatMessage}
                onChange={e => handleChatInputChange(e.target.value)}
                onKeyDown={handleChatKeyDown}
                className="flex-1 bg-transparent border-none text-sm text-white placeholder-sphera-text-muted outline-none focus:ring-0"
              />
              {!chatMessage && (
                <span className="text-[10px] text-sphera-green/40 font-mono shrink-0 hidden sm:block">@commandes</span>
              )}
              <button 
                onClick={handleSendChat}
                disabled={!chatMessage.trim() || isChatting || !sessionId}
                className="w-9 h-9 rounded-full bg-sphera-green text-black flex items-center justify-center hover:bg-green-400 disabled:opacity-50 disabled:hover:bg-sphera-green transition-colors flex-shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

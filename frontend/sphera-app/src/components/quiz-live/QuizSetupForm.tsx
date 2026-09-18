import React, { useState } from 'react';
import {
  createQuizManual,
  generateQuizQuestionsFromResource,
  generateQuizQuestionsFromUpload,
  importQuizJson,
} from '../../services/spheraApi';
import { Loader2, Plus, Trash2, Upload, Sparkles, Clock, Award, CheckCircle2, X, Sliders, Check } from 'lucide-react';

interface QuizSetupFormProps {
  onSessionCreated: (session: any) => void;
}

interface QuestionItem {
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit: number;
  points: number;
}

const TIME_PRESETS = [10, 15, 20, 30, 45, 60, 90, 120];
const POINTS_PRESETS = [500, 1000, 1500, 2000];

export function QuizSetupForm({ onSessionCreated }: QuizSetupFormProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'manual' | 'import'>('generate');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Generate tab configuration
  const [resourceInput, setResourceInput] = useState('');
  const [generateFile, setGenerateFile] = useState<File | null>(null);
  const [defaultTimeLimit, setDefaultTimeLimit] = useState(30);
  const [isCustomDefaultTime, setIsCustomDefaultTime] = useState(false);
  const [customDefaultTime, setCustomDefaultTime] = useState('30');

  const [defaultPoints, setDefaultPoints] = useState(1000);
  const [isCustomDefaultPoints, setIsCustomDefaultPoints] = useState(false);
  const [customDefaultPoints, setCustomDefaultPoints] = useState('1000');

  // Manual tab global bulk controls
  const [bulkTime, setBulkTime] = useState<number>(30);
  const [isCustomBulkTime, setIsCustomBulkTime] = useState(false);
  const [customBulkTime, setCustomBulkTime] = useState('30');

  const [bulkPoints, setBulkPoints] = useState<number>(1000);
  const [isCustomBulkPoints, setIsCustomBulkPoints] = useState(false);
  const [customBulkPoints, setCustomBulkPoints] = useState('1000');

  // Manual questions list
  const [questions, setQuestions] = useState<QuestionItem[]>([
    { question: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: 30, points: 1000 },
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        let list: any[] = [];
        if (Array.isArray(parsed) && parsed.length > 0) {
          list = parsed;
        } else if (parsed.questions && Array.isArray(parsed.questions)) {
          list = parsed.questions;
          if (parsed.title && !title) setTitle(parsed.title);
        } else {
          throw new Error('Format invalide');
        }

        const formattedQuestions: QuestionItem[] = list.map(q => ({
          question: q.question || '',
          options: Array.isArray(q.options) && q.options.length >= 4 
            ? q.options.slice(0, 4) 
            : [q.options?.[0] || '', q.options?.[1] || '', q.options?.[2] || '', q.options?.[3] || ''],
          correctIndex: typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3 ? q.correctIndex : 0,
          timeLimit: typeof q.timeLimit === 'number' && q.timeLimit > 0 ? q.timeLimit : 30,
          points: typeof q.points === 'number' && q.points > 0 ? q.points : 1000,
        }));

        setQuestions(formattedQuestions);
        setActiveTab('manual');
        setSuccessMessage(`JSON importé avec succès (${formattedQuestions.length} questions). Vous pouvez les prévisualiser ci-dessous.`);
        setError(null);
      } catch (err) {
        setError("Le fichier JSON n'est pas au bon format. Format attendu : liste de questions avec question, options, correctIndex.");
      }
    };
    reader.readAsText(uploadedFile);
  };

  /**
   * Génération des questions avec Sphera -> Ramène sur 'manual' pour prévisualisation
   */
  const handleGenerateQuestions = async () => {
    if (!generateFile && !resourceInput.trim()) {
      setError('Veuillez sélectionner un fichier ou indiquer le lien/identifiant d\'un document.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccessMessage(null);

    const effectiveTime = isCustomDefaultTime ? (parseInt(customDefaultTime, 10) || 30) : defaultTimeLimit;
    const effectivePoints = isCustomDefaultPoints ? (parseInt(customDefaultPoints, 10) || 1000) : defaultPoints;

    try {
      let res;
      if (generateFile) {
        res = await generateQuizQuestionsFromUpload(generateFile, title, effectiveTime, effectivePoints);
      } else {
        let raw = resourceInput.trim();
        const urlMatch = raw.match(/\/(\d+)(?:\/|\?|$)/) || raw.match(/(\d+)/);
        const parsedId = urlMatch ? parseInt(urlMatch[1], 10) : parseInt(raw, 10);
        if (isNaN(parsedId)) {
          throw new Error('Lien ou identifiant de document invalide. Entrez par exemple un numéro (ex: 12) ou un lien CampusSphere.');
        }

        res = await generateQuizQuestionsFromResource(parsedId, title, effectiveTime, effectivePoints);
      }

      const payload = res?.data || res;
      if (!payload || !Array.isArray(payload.questions) || payload.questions.length === 0) {
        throw new Error('L\'IA n\'a pas pu générer de questions à partir de ce document.');
      }

      if (payload.title && !title.trim()) {
        setTitle(payload.title);
      }

      const formatted: QuestionItem[] = payload.questions.map((q: any) => ({
        question: q.question || '',
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : [q.options?.[0] || '', q.options?.[1] || '', q.options?.[2] || '', q.options?.[3] || ''],
        correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
        timeLimit: typeof q.timeLimit === 'number' && q.timeLimit > 0 ? q.timeLimit : effectiveTime,
        points: typeof q.points === 'number' && q.points > 0 ? q.points : effectivePoints,
      }));

      setQuestions(formatted);
      setActiveTab('manual');
      setSuccessMessage(`${formatted.length} questions générées par Sphera ! Vous pouvez les prévisualiser, ajuster le temps et les points ci-dessous avant de lancer la session.`);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la génération avec Sphera.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Création définitive de la session Live
   */
  const handleCreateSession = async () => {
    if (!title.trim()) {
      setError('Veuillez entrer un titre pour la session.');
      return;
    }

    if (questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) {
      setError('Veuillez remplir l\'énoncé et les 4 options pour chaque question.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await createQuizManual(title, questions);
      const session = (res as any)?.data || res;
      onSessionCreated({ ...session, questions: session.questions || questions, title: session.title || title });
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors du lancement de la session.');
    } finally {
      setLoading(false);
    }
  };

  // Appliquer le même temps / points à toutes les questions
  const handleApplyBulkToAll = () => {
    const t = isCustomBulkTime ? (parseInt(customBulkTime, 10) || 30) : bulkTime;
    const p = isCustomBulkPoints ? (parseInt(customBulkPoints, 10) || 1000) : bulkPoints;
    setQuestions(prev => prev.map(q => ({ ...q, timeLimit: t, points: p })));
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative group overflow-hidden bg-sphera-surface-2/90 backdrop-blur-md border border-sphera-border rounded-3xl p-6 sm:p-10 shadow-2xl transition-all duration-500 animate-fade-in-up">
      <div className="absolute top-0 right-0 w-64 h-64 bg-sphera-green/5 rounded-bl-[150px] -z-10 transition-transform duration-700 group-hover:scale-110" />
      <h2 className="text-3xl font-display font-bold text-white mb-8 tracking-tight">
        Créer une session <span className="text-sphera-green">Live</span>
      </h2>
      
      {/* Titre de la session */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-sphera-text-muted mb-2">Titre de la session</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Révision Biologie Cellulaire — Chapitre 3"
          className="w-full bg-sphera-surface border border-sphera-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sphera-green transition-colors"
        />
      </div>

      {/* Onglets de configuration */}
      <div className="flex bg-sphera-surface rounded-2xl p-1.5 mb-8 border border-sphera-border/50 shadow-inner">
        <button
          type="button"
          onClick={() => { setActiveTab('generate'); setError(null); }}
          className={`flex-1 text-sm font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'generate' 
              ? 'bg-sphera-surface-2 text-white shadow-md border border-sphera-border scale-[1.02]' 
              : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2/50'
          }`}
        >
          <Sparkles className="w-4 h-4 text-sphera-green" />
          Générer avec Sphera
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('manual'); setError(null); }}
          className={`flex-1 text-sm font-bold py-3 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 ${
            activeTab === 'manual' 
              ? 'bg-sphera-surface-2 text-white shadow-md border border-sphera-border scale-[1.02]' 
              : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2/50'
          }`}
        >
          <span>Créer manuellement</span>
          <span className="px-2 py-0.5 rounded-full text-xs bg-sphera-green/15 text-sphera-green font-bold">
            {questions.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab('import'); setError(null); }}
          className={`flex-1 text-sm font-bold py-3 rounded-xl transition-all duration-300 ${
            activeTab === 'import' 
              ? 'bg-sphera-surface-2 text-white shadow-md border border-sphera-border scale-[1.02]' 
              : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2/50'
          }`}
        >
          Importer un JSON
        </button>
      </div>

      <div className="mb-8 min-h-[200px]">
        {/* ── Onglet 1 : Générer avec Sphera ── */}
        {activeTab === 'generate' && (
          <div className="space-y-6">
            <p className="text-sm text-sphera-text-muted leading-relaxed">
              Sphera analyse votre document (PDF, Word, TXT ou photo de cours) et conçoit un ensemble de questions QCM prêtes pour le jeu.
            </p>
            
            {/* Option 1: URL/ID */}
            <div className={`transition-opacity ${generateFile ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <label className="block text-sm font-medium text-white mb-2">Option 1 : Lien ou identifiant de document CampusSphere</label>
              <input
                type="text"
                value={resourceInput}
                onChange={e => setResourceInput(e.target.value)}
                placeholder="Ex: 42 ou https://campussphere.app/resources/42"
                className="w-full bg-sphera-surface border border-sphera-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sphera-green transition-colors"
              />
            </div>
            
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-sphera-border"></div>
              <span className="flex-shrink-0 mx-4 text-sphera-text-muted text-xs font-bold uppercase tracking-wider">ou</span>
              <div className="flex-grow border-t border-sphera-border"></div>
            </div>

            {/* Option 2: Upload direct */}
            <div className={`transition-opacity ${resourceInput.trim() ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <label className="block text-sm font-medium text-white mb-2">Option 2 : Importer un fichier de cours</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-sphera-border border-dashed rounded-xl cursor-pointer bg-sphera-surface hover:bg-sphera-surface-2 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-4 pb-5">
                    <Upload className="w-7 h-7 text-sphera-green mb-2" />
                    <p className="mb-1 text-sm text-sphera-text-muted">
                      <span className="font-semibold text-white">Cliquez pour choisir</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-sphera-text-muted">PDF, DOCX, TXT, Images (PNG, JPG, WEBP) · max 50 MB</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
                    onChange={e => setGenerateFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              {generateFile && (
                <div className="mt-3 flex items-center justify-between p-3 bg-sphera-surface border border-sphera-green/30 rounded-xl">
                  <span className="text-sm text-sphera-green font-medium truncate">{generateFile.name}</span>
                  <button type="button" onClick={() => setGenerateFile(null)} className="text-sphera-text-muted hover:text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Paramètres par défaut de la génération */}
            <div className="p-4 rounded-2xl bg-sphera-surface border border-sphera-border/60 space-y-3">
              <p className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sphera-green" /> Paramètres de jeu par défaut
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-sphera-text-muted mb-1.5">Temps par question :</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={isCustomDefaultTime ? 'custom' : defaultTimeLimit}
                      onChange={e => {
                        if (e.target.value === 'custom') {
                          setIsCustomDefaultTime(true);
                        } else {
                          setIsCustomDefaultTime(false);
                          setDefaultTimeLimit(Number(e.target.value));
                        }
                      }}
                      className="flex-1 bg-sphera-bg border border-sphera-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-sphera-green"
                    >
                      <option value={10}>10 secondes (Ultra-rapide)</option>
                      <option value={15}>15 secondes</option>
                      <option value={20}>20 secondes</option>
                      <option value={30}>30 secondes (Standard)</option>
                      <option value={45}>45 secondes</option>
                      <option value={60}>60 secondes (Réflexion)</option>
                      <option value={90}>90 secondes</option>
                      <option value={120}>2 minutes (Calculs)</option>
                      <option value="custom">Personnalisé...</option>
                    </select>
                    {isCustomDefaultTime && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={5}
                          max={600}
                          value={customDefaultTime}
                          onChange={e => setCustomDefaultTime(e.target.value)}
                          placeholder="sec"
                          className="w-16 bg-sphera-bg border border-sphera-border rounded-xl px-2.5 py-2 text-white text-sm focus:outline-none focus:border-sphera-green"
                        />
                        <span className="text-xs text-sphera-text-muted">s</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-sphera-text-muted mb-1.5">Points par question :</label>
                  <div className="flex items-center gap-2">
                    <select
                      value={isCustomDefaultPoints ? 'custom' : defaultPoints}
                      onChange={e => {
                        if (e.target.value === 'custom') {
                          setIsCustomDefaultPoints(true);
                        } else {
                          setIsCustomDefaultPoints(false);
                          setDefaultPoints(Number(e.target.value));
                        }
                      }}
                      className="flex-1 bg-sphera-bg border border-sphera-border rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-sphera-green"
                    >
                      <option value={500}>500 points (Quiz court)</option>
                      <option value={1000}>1 000 points (Standard)</option>
                      <option value={2000}>2 000 points (Double points)</option>
                      <option value="custom">Personnalisé...</option>
                    </select>
                    {isCustomDefaultPoints && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={50}
                          max={10000}
                          step={50}
                          value={customDefaultPoints}
                          onChange={e => setCustomDefaultPoints(e.target.value)}
                          placeholder="pts"
                          className="w-20 bg-sphera-bg border border-sphera-border rounded-xl px-2.5 py-2 text-white text-sm focus:outline-none focus:border-sphera-green"
                        />
                        <span className="text-xs text-sphera-text-muted">pts</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bouton Générer avec Sphera */}
            <button
              type="button"
              onClick={handleGenerateQuestions}
              disabled={isGenerating || (!generateFile && !resourceInput.trim())}
              className="w-full bg-sphera-green text-black font-bold text-base rounded-2xl px-6 py-4 hover:bg-sphera-green-hover transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyse &amp; Génération par Sphera...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Générer les questions &amp; Prévisualiser</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Onglet 2 : Créer manuellement / Prévisualiser ── */}
        {activeTab === 'manual' && (
          <div className="space-y-6">
            {/* Bannière de succès après génération */}
            {successMessage && (
              <div className="p-4 rounded-xl bg-sphera-green/10 border border-sphera-green/30 text-sphera-green text-sm flex items-center justify-between gap-3 animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span>{successMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSuccessMessage(null)}
                  className="text-sphera-text-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Barre de contrôle globale */}
            <div className="p-4 rounded-2xl bg-sphera-surface border border-sphera-border space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-sphera-green uppercase tracking-wider flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5" /> Réglage global pour toutes les questions
                </span>
                <div className="text-xs text-sphera-text-muted font-medium flex items-center gap-2">
                  <span>{questions.length} question{questions.length > 1 ? 's' : ''}</span>
                  <span>•</span>
                  <span>Total : {questions.reduce((acc, q) => acc + (q.points || 1000), 0)} pts</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sphera-text-muted flex items-center gap-1">
                    <Clock className="w-3 h-3 text-blue-400" /> Temps pour toutes :
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={isCustomBulkTime ? 'custom' : bulkTime}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomBulkTime(true);
                        } else {
                          setIsCustomBulkTime(false);
                          setBulkTime(parseInt(e.target.value, 10));
                        }
                      }}
                      className="flex-1 bg-sphera-bg border border-sphera-border text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sphera-green"
                    >
                      {TIME_PRESETS.map(t => (
                        <option key={t} value={t}>{t}s</option>
                      ))}
                      <option value="custom">Personnalisé...</option>
                    </select>
                    {isCustomBulkTime && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={5}
                          max={600}
                          value={customBulkTime}
                          onChange={(e) => setCustomBulkTime(e.target.value)}
                          placeholder="sec"
                          className="w-16 bg-sphera-bg border border-sphera-border text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-sphera-green"
                        />
                        <span className="text-xs text-sphera-text-muted">s</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sphera-text-muted flex items-center gap-1">
                    <Award className="w-3 h-3 text-yellow-400" /> Points pour toutes :
                  </label>
                  <div className="flex items-center gap-2">
                    <select
                      value={isCustomBulkPoints ? 'custom' : bulkPoints}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomBulkPoints(true);
                        } else {
                          setIsCustomBulkPoints(false);
                          setBulkPoints(parseInt(e.target.value, 10));
                        }
                      }}
                      className="flex-1 bg-sphera-bg border border-sphera-border text-white text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-sphera-green"
                    >
                      {POINTS_PRESETS.map(p => (
                        <option key={p} value={p}>{p} pts</option>
                      ))}
                      <option value="custom">Personnalisé...</option>
                    </select>
                    {isCustomBulkPoints && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min={50}
                          max={10000}
                          step={50}
                          value={customBulkPoints}
                          onChange={(e) => setCustomBulkPoints(e.target.value)}
                          placeholder="pts"
                          className="w-20 bg-sphera-bg border border-sphera-border text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-sphera-green"
                        />
                        <span className="text-xs text-sphera-text-muted">pts</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyBulkToAll}
                className="w-full py-2 px-3 rounded-lg bg-sphera-green/10 hover:bg-sphera-green/20 border border-sphera-green/30 text-sphera-green font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Appliquer à toutes les questions ({questions.length})
              </button>
            </div>

            {/* Liste des questions */}
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="p-5 border border-sphera-border rounded-2xl bg-sphera-surface relative space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-sphera-green/10 text-sphera-green border border-sphera-green/20">
                    Question #{qIndex + 1}
                  </span>
                  {questions.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                      className="text-sphera-text-muted hover:text-red-400 transition-colors p-1"
                      title="Supprimer la question"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Énoncé */}
                <div>
                  <input
                    type="text"
                    value={q.question}
                    onChange={e => {
                      const newQ = [...questions];
                      newQ[qIndex].question = e.target.value;
                      setQuestions(newQ);
                    }}
                    placeholder="Posez votre question ici..."
                    className="w-full bg-sphera-bg border border-sphera-border rounded-xl px-3.5 py-2.5 text-white font-medium focus:outline-none focus:border-sphera-green"
                  />
                </div>

                {/* Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {q.options.map((opt, oIndex) => {
                    const isSelected = q.correctIndex === oIndex;
                    return (
                      <div
                        key={oIndex}
                        className={`flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                          isSelected ? 'bg-sphera-green/10 border-sphera-green/50' : 'bg-sphera-bg border-sphera-border'
                        }`}
                      >
                        <input
                          type="radio"
                          checked={isSelected}
                          onChange={() => {
                            const newQ = [...questions];
                            newQ[qIndex].correctIndex = oIndex;
                            setQuestions(newQ);
                          }}
                          className="accent-[#22c55e] h-4 w-4 shrink-0 cursor-pointer"
                          name={`correct-${qIndex}`}
                          id={`q-${qIndex}-opt-${oIndex}`}
                        />
                        <input
                          type="text"
                          value={opt}
                          onChange={e => {
                            const newQ = [...questions];
                            newQ[qIndex].options[oIndex] = e.target.value;
                            setQuestions(newQ);
                          }}
                          placeholder={`Option ${String.fromCharCode(65 + oIndex)}`}
                          className="flex-1 bg-transparent border-0 text-white text-sm focus:outline-none"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Réglage du temps et des points de CETTE question */}
                <div className="pt-2 border-t border-sphera-border/50 flex items-center justify-between flex-wrap gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-sphera-text-muted">Temps :</span>
                    <select 
                      value={TIME_PRESETS.includes(q.timeLimit) ? q.timeLimit : 'custom'}
                      onChange={e => {
                        const newQ = [...questions];
                        if (e.target.value !== 'custom') {
                          newQ[qIndex].timeLimit = parseInt(e.target.value, 10);
                        }
                        setQuestions(newQ);
                      }}
                      className="bg-sphera-bg border border-sphera-border rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-sphera-green"
                    >
                      {TIME_PRESETS.map(t => (
                        <option key={t} value={t}>{t}s</option>
                      ))}
                      <option value="custom">Perso...</option>
                    </select>
                    {!TIME_PRESETS.includes(q.timeLimit) && (
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          min={5}
                          max={600}
                          value={q.timeLimit}
                          onChange={e => {
                            const newQ = [...questions];
                            newQ[qIndex].timeLimit = parseInt(e.target.value, 10) || 5;
                            setQuestions(newQ);
                          }}
                          className="w-12 bg-sphera-bg border border-sphera-border rounded px-1.5 py-1 text-white text-xs focus:outline-none focus:border-sphera-green"
                        />
                        <span className="text-[10px] text-sphera-text-muted">s</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-sphera-text-muted">Points :</span>
                    <select 
                      value={POINTS_PRESETS.includes(q.points) ? q.points : 'custom'}
                      onChange={e => {
                        const newQ = [...questions];
                        if (e.target.value !== 'custom') {
                          newQ[qIndex].points = parseInt(e.target.value, 10);
                        }
                        setQuestions(newQ);
                      }}
                      className="bg-sphera-bg border border-sphera-border rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-sphera-green"
                    >
                      {POINTS_PRESETS.map(p => (
                        <option key={p} value={p}>{p} pts</option>
                      ))}
                      <option value="custom">Perso...</option>
                    </select>
                    {!POINTS_PRESETS.includes(q.points) && (
                      <div className="flex items-center gap-0.5">
                        <input
                          type="number"
                          min={50}
                          max={10000}
                          step={50}
                          value={q.points}
                          onChange={e => {
                            const newQ = [...questions];
                            newQ[qIndex].points = parseInt(e.target.value, 10) || 100;
                            setQuestions(newQ);
                          }}
                          className="w-16 bg-sphera-bg border border-sphera-border rounded px-1.5 py-1 text-white text-xs focus:outline-none focus:border-sphera-green"
                        />
                        <span className="text-[10px] text-sphera-text-muted">pts</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setQuestions([
                ...questions, 
                { 
                  question: '', 
                  options: ['', '', '', ''], 
                  correctIndex: 0, 
                  timeLimit: isCustomDefaultTime ? (parseInt(customDefaultTime, 10) || 30) : defaultTimeLimit, 
                  points: isCustomDefaultPoints ? (parseInt(customDefaultPoints, 10) || 1000) : defaultPoints 
                }
              ])}
              className="flex items-center gap-2 text-sphera-green hover:text-green-400 transition-colors text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Ajouter une question manuellement
            </button>

            {/* Bouton Créer/Lancer la session depuis l'onglet Manuel */}
            <div className="pt-4 border-t border-sphera-border">
              <button
                type="button"
                onClick={handleCreateSession}
                disabled={loading}
                className="w-full bg-sphera-green text-black font-bold text-lg rounded-2xl px-6 py-4 hover:bg-sphera-green-hover transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {loading && <Loader2 className="w-6 h-6 animate-spin" />}
                {loading ? 'Lancement de la session...' : 'Lancer la session Live'}
              </button>
            </div>
          </div>
        )}

        {/* ── Onglet 3 : Importer un JSON ── */}
        {activeTab === 'import' && (
          <div className="space-y-4">
            <p className="text-sm text-sphera-text-muted leading-relaxed">
              Importez un fichier JSON contenant votre questionnaire. Les questions seront chargées dans l'éditeur pour vérification avant le lancement.
            </p>
            <p className="text-xs text-sphera-text-muted font-mono bg-sphera-surface p-3.5 rounded-xl border border-sphera-border">
              Format attendu :<br/>
              {`[{ "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "timeLimit": 30, "points": 1000 }]`}
            </p>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-sphera-border border-dashed rounded-xl cursor-pointer bg-sphera-surface hover:bg-sphera-surface-2 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 text-sphera-text-muted mb-3" />
                  <p className="mb-2 text-sm text-sphera-text-muted">
                    <span className="font-semibold text-white">Cliquez pour importer</span> ou glissez-déposez
                  </p>
                  <p className="text-xs text-sphera-text-muted">Fichier .json uniquement</p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".json"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center font-medium animate-shake">
          {error}
        </div>
      )}
    </div>
  );
}

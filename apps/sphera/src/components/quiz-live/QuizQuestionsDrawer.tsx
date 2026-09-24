import React, { useState, useEffect } from 'react';
import { X, Edit3, Eye, Check, Plus, Trash2, Clock, Award, Save, Loader2, AlertCircle, Sliders } from 'lucide-react';
import { updateQuizQuestions } from '../../services/spheraApi';

export interface QuestionItem {
  question: string;
  options: string[];
  correctIndex: number;
  timeLimit?: number;
  points?: number;
}

interface QuizQuestionsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  initialQuestions: QuestionItem[];
  initialTitle?: string;
  onQuestionsUpdated: (updatedQuestions: QuestionItem[], updatedTitle?: string) => void;
}

const TIME_OPTIONS = [10, 15, 20, 30, 45, 60, 90, 120];
const POINTS_OPTIONS = [500, 1000, 1500, 2000];

export function QuizQuestionsDrawer({
  isOpen,
  onClose,
  roomCode,
  initialQuestions,
  initialTitle = 'Quiz Live',
  onQuestionsUpdated,
}: QuizQuestionsDrawerProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Bulk settings state
  const [bulkTime, setBulkTime] = useState<number>(30);
  const [customBulkTime, setCustomBulkTime] = useState<string>('30');
  const [isCustomBulkTime, setIsCustomBulkTime] = useState<boolean>(false);

  const [bulkPoints, setBulkPoints] = useState<number>(1000);
  const [customBulkPoints, setCustomBulkPoints] = useState<string>('1000');
  const [isCustomBulkPoints, setIsCustomBulkPoints] = useState<boolean>(false);

  // Sync state whenever drawer opens or initial props change
  useEffect(() => {
    if (isOpen) {
      setQuestions(JSON.parse(JSON.stringify(initialQuestions || [])));
      setTitle(initialTitle || 'Quiz Live');
      setMode('view');
      setError(null);
      setSavedSuccess(false);
    }
  }, [isOpen, initialQuestions, initialTitle]);

  if (!isOpen) return null;

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    setQuestions(prev => {
      const next = [...prev];
      const newOpts = [...next[qIndex].options];
      newOpts[optIndex] = value;
      next[qIndex] = { ...next[qIndex], options: newOpts };
      return next;
    });
  };

  const handleCorrectIndexChange = (qIndex: number, optIndex: number) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], correctIndex: optIndex };
      return next;
    });
  };

  const handleQuestionTextChange = (qIndex: number, text: string) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], question: text };
      return next;
    });
  };

  const handleTimeLimitChange = (qIndex: number, val: number) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], timeLimit: val };
      return next;
    });
  };

  const handlePointsChange = (qIndex: number, val: number) => {
    setQuestions(prev => {
      const next = [...prev];
      next[qIndex] = { ...next[qIndex], points: val };
      return next;
    });
  };

  const handleApplyBothToAll = () => {
    const timeVal = isCustomBulkTime ? parseInt(customBulkTime, 10) : bulkTime;
    const ptsVal = isCustomBulkPoints ? parseInt(customBulkPoints, 10) : bulkPoints;
    if (!timeVal || isNaN(timeVal) || timeVal <= 0) {
      setError('Veuillez spécifier un temps valide (en secondes).');
      return;
    }
    if (!ptsVal || isNaN(ptsVal) || ptsVal <= 0) {
      setError('Veuillez spécifier un nombre de points valide.');
      return;
    }
    setQuestions(prev => prev.map(q => ({ ...q, timeLimit: timeVal, points: ptsVal })));
    setError(null);
  };

  const handleAddQuestion = () => {
    setQuestions(prev => [
      ...prev,
      {
        question: `Nouvelle question ${prev.length + 1}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: 0,
        timeLimit: 30,
        points: 1000,
      },
    ]);
  };

  const handleDeleteQuestion = (index: number) => {
    if (questions.length <= 1) {
      setError('Le quiz doit contenir au moins une question.');
      return;
    }
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setError(null);
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`La question #${i + 1} ne peut pas être vide.`);
        return;
      }
      if (q.options.some(opt => !opt.trim())) {
        setError(`Toutes les 4 options de la question #${i + 1} doivent être renseignées.`);
        return;
      }
    }

    setSaving(true);
    try {
      const res = await updateQuizQuestions(roomCode, questions, title);
      if (res && (res as any).success) {
        onQuestionsUpdated(questions, title);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
        setMode('view');
      } else {
        setError('Impossible d\'enregistrer les modifications.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-live">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-sphera-surface-2 border-l border-sphera-border flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-6 border-b border-sphera-border flex items-center justify-between bg-sphera-surface">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sphera-green/20 text-sphera-green border border-sphera-green/40">
                  Salle {roomCode}
                </span>
                <span className="text-xs text-sphera-text-muted">
                  {questions.length} question{questions.length > 1 ? 's' : ''}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {mode === 'view' ? (title || 'Questions du Quiz') : 'Modifier les questions'}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              {mode === 'view' ? (
                <button
                  onClick={() => setMode('edit')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sphera-green/10 border border-sphera-green/30 text-sphera-green hover:bg-sphera-green hover:text-black transition-colors text-sm font-semibold"
                >
                  <Edit3 className="w-4 h-4" />
                  Modifier
                </button>
              ) : (
                <button
                  onClick={() => {
                    setQuestions(JSON.parse(JSON.stringify(initialQuestions || [])));
                    setMode('view');
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-sphera-bg border border-sphera-border text-sphera-text-muted hover:text-white transition-colors text-sm font-semibold"
                >
                  <Eye className="w-4 h-4" />
                  Aperçu
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-sphera-text-muted hover:text-white hover:bg-sphera-bg rounded-lg transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Feedback banners */}
          {savedSuccess && (
            <div className="mx-6 mt-4 p-3 bg-sphera-green/20 border border-sphera-green/50 rounded-xl flex items-center gap-2 text-sphera-green text-sm font-medium animate-fade-in">
              <Check className="w-4 h-4" />
              Questions mises à jour avec succès ! Les joueurs verront ces modifications.
            </div>
          )}

          {error && (
            <div className="mx-6 mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-2 text-red-400 text-sm font-medium animate-fade-in">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {mode === 'edit' && (
              <>
                <div className="bg-sphera-surface p-4 rounded-xl border border-sphera-border mb-4">
                  <label className="block text-xs font-semibold text-sphera-text-muted uppercase tracking-wider mb-2">
                    Titre du Quiz
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-sphera-bg border border-sphera-border focus:border-sphera-green rounded-lg px-3 py-2 text-white font-medium text-sm focus:outline-none"
                    placeholder="ex: Quiz Révision Biologie"
                  />
                </div>

                {/* Bulk Time & Points Configuration */}
                <div className="bg-sphera-surface p-4 rounded-xl border border-sphera-border/80 mb-4 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sphera-green uppercase tracking-wider flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" /> Réglage global pour toutes les questions
                    </span>
                    <span className="text-[11px] text-sphera-text-muted">
                      {questions.length} question{questions.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sphera-text-muted flex items-center gap-1">
                        <Clock className="w-3 h-3 text-blue-400" /> Temps par question :
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
                          {TIME_OPTIONS.map(t => (
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
                              placeholder="ex: 25"
                              className="w-16 bg-sphera-bg border border-sphera-border text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-sphera-green"
                            />
                            <span className="text-xs text-sphera-text-muted">s</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sphera-text-muted flex items-center gap-1">
                        <Award className="w-3 h-3 text-yellow-400" /> Points par question :
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
                          {POINTS_OPTIONS.map(p => (
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
                              placeholder="ex: 750"
                              className="w-18 bg-sphera-bg border border-sphera-border text-white text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-sphera-green"
                            />
                            <span className="text-xs text-sphera-text-muted">pts</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleApplyBothToAll}
                    className="w-full py-2 px-3 rounded-lg bg-sphera-green/10 hover:bg-sphera-green/20 border border-sphera-green/30 text-sphera-green font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Appliquer ce temps et ces points à toutes les questions ({questions.length})
                  </button>
                </div>
              </>
            )}

            {questions.map((q, qIndex) => {
              const qTime = q.timeLimit || 30;
              const qPts = q.points || 1000;

              return (
                <div
                  key={qIndex}
                  className="bg-sphera-surface border border-sphera-border rounded-2xl p-5 relative group"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-full bg-sphera-green/20 text-sphera-green border border-sphera-green/30 text-xs font-bold flex items-center justify-center">
                        {qIndex + 1}
                      </span>
                      <span className="text-xs font-medium text-sphera-text-muted">
                        Question {qIndex + 1} sur {questions.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {mode === 'view' ? (
                        <>
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sphera-bg border border-sphera-border text-sphera-text-muted">
                            <Clock className="w-3 h-3 text-blue-400" />
                            {qTime}s
                          </span>
                          <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-sphera-bg border border-sphera-border text-sphera-text-muted">
                            <Award className="w-3 h-3 text-yellow-400" />
                            {qPts} pts
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-blue-400" />
                            <select
                              value={TIME_OPTIONS.includes(qTime) ? qTime : 'custom'}
                              onChange={(e) => {
                                if (e.target.value !== 'custom') {
                                  handleTimeLimitChange(qIndex, parseInt(e.target.value, 10));
                                }
                              }}
                              className="bg-sphera-bg border border-sphera-border text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-sphera-green"
                            >
                              {TIME_OPTIONS.map(t => (
                                <option key={t} value={t}>{t}s</option>
                              ))}
                              <option value="custom">Perso...</option>
                            </select>
                            {!TIME_OPTIONS.includes(qTime) && (
                              <div className="flex items-center gap-0.5">
                                <input
                                  type="number"
                                  min={5}
                                  max={600}
                                  value={qTime}
                                  onChange={(e) => handleTimeLimitChange(qIndex, parseInt(e.target.value, 10) || 5)}
                                  className="w-12 bg-sphera-bg border border-sphera-border text-white text-xs rounded px-1.5 py-1 focus:outline-none focus:border-sphera-green"
                                />
                                <span className="text-[10px] text-sphera-text-muted">s</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="w-3 h-3 text-yellow-400" />
                            <select
                              value={POINTS_OPTIONS.includes(qPts) ? qPts : 'custom'}
                              onChange={(e) => {
                                if (e.target.value !== 'custom') {
                                  handlePointsChange(qIndex, parseInt(e.target.value, 10));
                                }
                              }}
                              className="bg-sphera-bg border border-sphera-border text-white text-xs rounded px-2 py-1 focus:outline-none focus:border-sphera-green"
                            >
                              {POINTS_OPTIONS.map(p => (
                                <option key={p} value={p}>{p} pts</option>
                              ))}
                              <option value="custom">Perso...</option>
                            </select>
                            {!POINTS_OPTIONS.includes(qPts) && (
                              <div className="flex items-center gap-0.5">
                                <input
                                  type="number"
                                  min={50}
                                  max={10000}
                                  step={50}
                                  value={qPts}
                                  onChange={(e) => handlePointsChange(qIndex, parseInt(e.target.value, 10) || 100)}
                                  className="w-14 bg-sphera-bg border border-sphera-border text-white text-xs rounded px-1.5 py-1 focus:outline-none focus:border-sphera-green"
                                />
                                <span className="text-[10px] text-sphera-text-muted">pts</span>
                              </div>
                            )}
                          </div>
                          {questions.length > 1 && (
                            <button
                              onClick={() => handleDeleteQuestion(qIndex)}
                              className="p-1 rounded text-sphera-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
                              title="Supprimer cette question"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  {mode === 'view' ? (
                    <h3 className="text-white font-semibold text-base mb-4">
                      {q.question}
                    </h3>
                  ) : (
                    <textarea
                      value={q.question}
                      onChange={(e) => handleQuestionTextChange(qIndex, e.target.value)}
                      rows={2}
                      className="w-full bg-sphera-bg border border-sphera-border focus:border-sphera-green rounded-xl p-3 text-white text-sm focus:outline-none mb-4 resize-none"
                      placeholder="Énoncé de la question..."
                    />
                  )}

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIndex) => {
                      const isCorrect = q.correctIndex === optIndex;
                      const letter = String.fromCharCode(65 + optIndex);

                      if (mode === 'view') {
                        return (
                          <div
                            key={optIndex}
                            className={`p-3 rounded-xl border text-sm flex items-center justify-between transition-colors ${
                              isCorrect
                                ? 'bg-sphera-green/10 border-sphera-green text-sphera-green font-medium'
                                : 'bg-sphera-bg border-sphera-border text-sphera-text-muted'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                isCorrect ? 'bg-sphera-green text-black' : 'bg-sphera-surface-2 text-sphera-text-muted'
                              }`}>
                                {letter}
                              </span>
                              <span className="text-white">{opt}</span>
                            </div>
                            {isCorrect && (
                              <Check className="w-4 h-4 text-sphera-green shrink-0" />
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={optIndex}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 transition-colors ${
                            isCorrect
                              ? 'border-sphera-green/70 bg-sphera-green/5'
                              : 'border-sphera-border bg-sphera-bg'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleCorrectIndexChange(qIndex, optIndex)}
                            title={isCorrect ? "Bonne réponse" : "Définir comme bonne réponse"}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-transform active:scale-90 ${
                              isCorrect
                                ? 'bg-sphera-green text-black shadow-[0_0_10px_rgba(34,197,94,0.4)]'
                                : 'bg-sphera-surface-2 text-sphera-text-muted hover:bg-sphera-surface hover:text-white'
                            }`}
                          >
                            {letter}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                            className="flex-1 bg-transparent text-white text-xs sm:text-sm focus:outline-none"
                            placeholder={`Option ${letter}`}
                          />
                          {isCorrect && (
                            <Check className="w-4 h-4 text-sphera-green shrink-0 mr-1" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {mode === 'edit' && (
              <button
                type="button"
                onClick={handleAddQuestion}
                className="w-full py-4 border-2 border-dashed border-sphera-border hover:border-sphera-green/50 rounded-2xl flex items-center justify-center gap-2 text-sphera-text-muted hover:text-sphera-green transition-colors group"
              >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-sm">Ajouter une question</span>
              </button>
            )}
          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-sphera-border bg-sphera-surface flex items-center justify-between">
            {mode === 'view' ? (
              <>
                <p className="text-xs text-sphera-text-muted">
                  Astuce : vous pouvez ajuster les questions avant de lancer la partie.
                </p>
                <button
                  onClick={() => setMode('edit')}
                  className="px-5 py-2.5 rounded-xl bg-sphera-green text-black font-bold text-sm hover:bg-sphera-green/90 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)]"
                >
                  <Edit3 className="w-4 h-4" />
                  Modifier les questions
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setQuestions(JSON.parse(JSON.stringify(initialQuestions || [])));
                    setMode('view');
                  }}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-sphera-border text-sphera-text-muted hover:text-white transition-colors text-sm font-semibold"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-sphera-green text-black font-bold text-sm hover:bg-sphera-green/90 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.3)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

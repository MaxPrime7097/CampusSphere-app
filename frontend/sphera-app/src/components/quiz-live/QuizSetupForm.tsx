import React, { useState } from 'react';
import { createQuizManual, createQuizFromResource, importQuizJson, createQuizFromUpload } from '../../services/spheraApi';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';

interface QuizSetupFormProps {
  onSessionCreated: (session: any) => void;
}

export function QuizSetupForm({ onSessionCreated }: QuizSetupFormProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'manual' | 'import'>('generate');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate tab state
  const [resourceInput, setResourceInput] = useState('');
  const [generateFile, setGenerateFile] = useState<File | null>(null);

  // Manual tab state
  const [questions, setQuestions] = useState([{ question: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: 30 }]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question) {
          const formattedQuestions = parsed.map(q => ({
            question: q.question || '',
            options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['', '', '', ''],
            correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
            timeLimit: typeof q.timeLimit === 'number' ? q.timeLimit : 30
          }));
          setQuestions(formattedQuestions);
          setActiveTab('manual');
          setError(null);
        } else {
          throw new Error('Format invalide');
        }
      } catch (err) {
        setError("Le fichier JSON n'est pas au bon format.");
      }
    };
    reader.readAsText(uploadedFile);
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      setError('Veuillez entrer un titre pour la session.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let res;
      if (activeTab === 'generate') {
        if (generateFile) {
          res = await createQuizFromUpload(generateFile, title);
        } else {
          if (!resourceInput.trim()) throw new Error('Veuillez entrer un lien, un ID ou sélectionner un fichier.');
          let finalId = resourceInput.trim();
          const urlMatch = finalId.match(/\/(\d+)(\/|$)/);
          if (urlMatch) {
            finalId = urlMatch[1];
          }
          const parsedId = parseInt(finalId);
          if (isNaN(parsedId)) throw new Error('Lien ou ID de document invalide.');
          
          res = await createQuizFromResource(parsedId, title);
        }
      } else if (activeTab === 'manual' || activeTab === 'import') {
        if (questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) {
          throw new Error('Veuillez remplir tous les champs des questions.');
        }
        res = await createQuizManual(title, questions);
      }
      
      const session = (res as any)?.data || res;
      onSessionCreated(session);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative group overflow-hidden bg-sphera-surface-2/90 backdrop-blur-md border border-sphera-border rounded-3xl p-6 sm:p-10 shadow-2xl transition-all duration-500 animate-fade-in-up">
      <div className="absolute top-0 right-0 w-64 h-64 bg-sphera-green/5 rounded-bl-[150px] -z-10 transition-transform duration-700 group-hover:scale-110" />
      <h2 className="text-3xl font-display font-bold text-white mb-8 tracking-tight">Créer une session <span className="text-sphera-green">Live</span></h2>
      
      <div className="mb-8">
        <label className="block text-sm font-medium text-sphera-text-muted mb-2">Titre de la session</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Révision Biologie Cellulaire"
          className="w-full bg-sphera-surface border border-sphera-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sphera-green transition-colors"
        />
      </div>

      <div className="flex bg-sphera-surface rounded-2xl p-1.5 mb-8 border border-sphera-border/50 shadow-inner">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 text-sm font-bold py-3 rounded-xl transition-all duration-300 ${activeTab === 'generate' ? 'bg-sphera-surface-2 text-white shadow-md border border-sphera-border scale-[1.02]' : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2/50'}`}
        >
          Générer avec Sphera
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 text-sm font-bold py-3 rounded-xl transition-all duration-300 ${activeTab === 'manual' ? 'bg-sphera-surface-2 text-white shadow-md border border-sphera-border scale-[1.02]' : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2/50'}`}
        >
          Créer manuellement
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`flex-1 text-sm font-bold py-3 rounded-xl transition-all duration-300 ${activeTab === 'import' ? 'bg-sphera-surface-2 text-white shadow-md border border-sphera-border scale-[1.02]' : 'text-sphera-text-muted hover:text-white hover:bg-sphera-surface-2/50'}`}
        >
          Importer un JSON
        </button>
      </div>

      <div className="mb-8 min-h-[200px]">
        {activeTab === 'generate' && (
          <div className="space-y-6">
            <p className="text-sm text-sphera-text-muted">
              Générez automatiquement un quiz à partir d'un document existant dans CampusSphere, ou importez un nouveau fichier.
            </p>
            
            {/* Option 1: URL/ID */}
            <div className={`transition-opacity ${generateFile ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <label className="block text-sm font-medium text-white mb-2">Option 1 : Lien ou ID du document</label>
              <input
                type="text"
                value={resourceInput}
                onChange={e => setResourceInput(e.target.value)}
                placeholder="Ex: https://campussphere.app/resources/1234 ou 1234"
                className="w-full bg-sphera-surface border border-sphera-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sphera-green transition-colors"
              />
            </div>
            
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-sphera-border"></div>
              <span className="flex-shrink-0 mx-4 text-sphera-text-muted text-sm font-bold uppercase">ou</span>
              <div className="flex-grow border-t border-sphera-border"></div>
            </div>

            {/* Option 2: Direct Upload */}
            <div className={`transition-opacity ${resourceInput.trim() ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}>
              <label className="block text-sm font-medium text-white mb-2">Option 2 : Importer un fichier</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-sphera-border border-dashed rounded-xl cursor-pointer bg-sphera-surface hover:bg-sphera-surface-2 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 text-sphera-green mb-3" />
                    <p className="mb-2 text-sm text-sphera-text-muted">
                      <span className="font-semibold text-white">Cliquez pour importer</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-sphera-text-muted">PDF, DOCX, TXT</p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".pdf,.docx,.txt"
                    onChange={e => setGenerateFile(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
              {generateFile && (
                <div className="mt-3 flex items-center justify-between p-3 bg-sphera-surface border border-sphera-green/30 rounded-xl">
                  <span className="text-sm text-sphera-green font-medium truncate">{generateFile.name}</span>
                  <button onClick={() => setGenerateFile(null)} className="text-sphera-text-muted hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'manual' && (
          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div key={qIndex} className="p-4 border border-sphera-border rounded-xl bg-sphera-surface relative">
                {questions.length > 1 && (
                  <button 
                    onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                    className="absolute top-4 right-4 text-sphera-text-muted hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <h4 className="text-white font-medium mb-4">Question {qIndex + 1}</h4>
                <div className="mb-4">
                  <input
                    type="text"
                    value={q.question}
                    onChange={e => {
                      const newQ = [...questions];
                      newQ[qIndex].question = e.target.value;
                      setQuestions(newQ);
                    }}
                    placeholder="Posez votre question ici..."
                    className="w-full bg-sphera-bg border border-sphera-border rounded-lg px-3 py-2 text-white focus:outline-none focus:border-sphera-green"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {q.options.map((opt, oIndex) => (
                    <div key={oIndex} className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={q.correctIndex === oIndex}
                        onChange={() => {
                          const newQ = [...questions];
                          newQ[qIndex].correctIndex = oIndex;
                          setQuestions(newQ);
                        }}
                        className="text-sphera-green focus:ring-sphera-green bg-sphera-bg border-sphera-border"
                        name={`correct-${qIndex}`}
                      />
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newQ = [...questions];
                          newQ[qIndex].options[oIndex] = e.target.value;
                          setQuestions(newQ);
                        }}
                        placeholder={`Option ${oIndex + 1}`}
                        className="flex-1 bg-sphera-bg border border-sphera-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sphera-green"
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-xs text-sphera-text-muted mr-2">Temps limite (secondes):</label>
                  <select 
                    value={q.timeLimit}
                    onChange={e => {
                      const newQ = [...questions];
                      newQ[qIndex].timeLimit = parseInt(e.target.value);
                      setQuestions(newQ);
                    }}
                    className="bg-sphera-bg border border-sphera-border rounded px-2 py-1 text-white text-xs"
                  >
                    <option value="15">15s</option>
                    <option value="30">30s</option>
                    <option value="60">60s</option>
                  </select>
                </div>
              </div>
            ))}
            <button
              onClick={() => setQuestions([...questions, { question: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: 30 }])}
              className="flex items-center gap-2 text-sphera-green hover:text-sphera-green-dim transition-colors text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Ajouter une question
            </button>
          </div>
        )}

        {activeTab === 'import' && (
          <div className="space-y-4">
            <p className="text-sm text-sphera-text-muted">Importez un fichier JSON contenant vos questions.</p>
            <p className="text-xs text-sphera-text-muted font-mono bg-sphera-surface p-3 rounded-xl border border-sphera-border">
              Format attendu:<br/>
              {`[{ "question": "...", "options": ["A","B","C","D"], "correctIndex": 0, "timeLimit": 30 }]`}
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
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center font-medium animate-shake">
          {error}
        </div>
      )}

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full bg-sphera-green text-black font-bold text-lg rounded-2xl px-6 py-4 hover:bg-sphera-green-hover transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:-translate-y-1 flex justify-center items-center gap-2"
      >
        {loading && <Loader2 className="w-6 h-6 animate-spin" />}
        {loading ? 'Création en cours...' : 'Créer la session'}
      </button>
    </div>
  );
}

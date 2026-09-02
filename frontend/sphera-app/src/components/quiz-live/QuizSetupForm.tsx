import React, { useState } from 'react';
import { createQuizManual, createQuizFromResource, importQuizJson } from '../../services/spheraApi';
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
  const [resourceId, setResourceId] = useState('');

  // Manual tab state
  const [questions, setQuestions] = useState([{ question: '', options: ['', '', '', ''], correctIndex: 0, timeLimit: 30 }]);

  // Import tab state
  const [file, setFile] = useState<File | null>(null);

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
        if (!resourceId) throw new Error('Veuillez entrer un ID de ressource.');
        res = await createQuizFromResource(parseInt(resourceId), title);
      } else if (activeTab === 'manual') {
        if (questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()))) {
          throw new Error('Veuillez remplir tous les champs des questions.');
        }
        res = await createQuizManual(title, questions);
      } else {
        if (!file) throw new Error('Veuillez sélectionner un fichier JSON.');
        res = await importQuizJson(title, file);
      }
      
      if (res.success && res.data) {
        onSessionCreated(res.data);
      } else {
        throw new Error('Erreur lors de la création de la session.');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-sphera-surface-2 border border-sphera-border rounded-2xl p-6 sm:p-8">
      <h2 className="text-2xl font-display font-bold text-white mb-6">Créer une session Sphera Live</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-sphera-text-muted mb-2">Titre de la session</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Ex: Révision Biologie Cellulaire"
          className="w-full bg-sphera-surface border border-sphera-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sphera-green transition-colors"
        />
      </div>

      <div className="flex bg-sphera-surface rounded-xl p-1 mb-6 border border-sphera-border">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${activeTab === 'generate' ? 'bg-sphera-surface-2 text-white shadow' : 'text-sphera-text-muted hover:text-white'}`}
        >
          Générer avec Sphera
        </button>
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${activeTab === 'manual' ? 'bg-sphera-surface-2 text-white shadow' : 'text-sphera-text-muted hover:text-white'}`}
        >
          Créer manuellement
        </button>
        <button
          onClick={() => setActiveTab('import')}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${activeTab === 'import' ? 'bg-sphera-surface-2 text-white shadow' : 'text-sphera-text-muted hover:text-white'}`}
        >
          Importer un JSON
        </button>
      </div>

      <div className="mb-8 min-h-[200px]">
        {activeTab === 'generate' && (
          <div className="space-y-4">
            <p className="text-sm text-sphera-text-muted">Générez automatiquement un quiz à partir d'un document existant dans CampusSphere.</p>
            <div>
              <label className="block text-sm font-medium text-sphera-text-muted mb-2">ID du document (Ressource)</label>
              <input
                type="number"
                value={resourceId}
                onChange={e => setResourceId(e.target.value)}
                placeholder="Ex: 1234"
                className="w-full bg-sphera-surface border border-sphera-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sphera-green transition-colors"
              />
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
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            {file && (
              <p className="text-sm text-sphera-green text-center">Fichier sélectionné: {file.name}</p>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

      <button
        onClick={handleCreate}
        disabled={loading}
        className="w-full sphera-primary-btn flex justify-center items-center gap-2"
      >
        {loading && <Loader2 className="w-5 h-5 animate-spin" />}
        {loading ? 'Création en cours...' : 'Créer la session'}
      </button>
    </div>
  );
}

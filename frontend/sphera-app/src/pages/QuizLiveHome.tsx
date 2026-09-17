import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Zap, Plus, LogIn, Loader2, ArrowRight, Trash2 } from 'lucide-react';
import { getMyQuizSessions, deleteQuizSession } from '../services/spheraApi';
import { DeleteConfirmModal } from '../components/app/DeleteConfirmModal';
import { Helmet } from 'react-helmet-async';

export default function QuizLiveHome() {
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleConfirmDelete = async () => {
    if (!quizToDelete) return;
    try {
      await deleteQuizSession(quizToDelete);
      setLiveSessions(prev => prev.filter(s => s.roomCode !== quizToDelete));
    } catch (err) {
      console.error("Erreur suppression:", err);
    } finally {
      setQuizToDelete(null);
    }
  };

  useEffect(() => {
    getMyQuizSessions()
      .then(res => {
        const d = (res as any)?.data;
        setLiveSessions(Array.isArray(d) ? d : []);
      })
      .catch(err => console.error("Erreur chargement live sessions:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-12 font-live relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{
        backgroundImage: `radial-gradient(circle at top, rgba(34, 197, 94, 0.15) 0%, transparent 70%)`
      }}></div>

      <Helmet>
        <title>Sphera Live · CampusSphere</title>
      </Helmet>
      
      <main className="flex-1 w-full max-w-5xl mx-auto py-12 px-4 sm:px-6 relative z-10">
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center justify-center p-4 bg-sphera-green/10 border border-sphera-green/30 rounded-full mb-6 sphera-live-pulse shadow-[0_0_30px_rgba(34,197,94,0.2)]">
            <Zap className="w-8 h-8 text-sphera-green" />
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold text-white mb-4 tracking-tight">
            Sphera <span className="text-sphera-green">Live</span>
          </h1>
          <p className="text-xl text-sphera-text-muted font-medium max-w-2xl mx-auto">
            L'expérience quiz multijoueur interactive en temps réel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20 max-w-4xl mx-auto">
          <Link to="/live/host" className="relative group overflow-hidden bg-sphera-surface-2 border border-sphera-border hover:border-sphera-green/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(34,197,94,0.15)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-sphera-green/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
            <div className="w-16 h-16 rounded-2xl bg-sphera-green/10 flex items-center justify-center mb-6 group-hover:bg-sphera-green group-hover:text-black transition-colors">
              <Plus className="w-8 h-8 text-sphera-green group-hover:text-black transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 font-display">Héberger un Quiz</h3>
            <p className="text-sphera-text-muted mb-8 text-lg">Créez une session sur grand écran et invitez vos amis à rejoindre la partie avec un code.</p>
            <div className="flex items-center gap-2 text-sphera-green font-bold uppercase tracking-wider text-sm">
              Commencer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link to="/live/join" className="relative group overflow-hidden bg-sphera-surface-2 border border-sphera-border hover:border-blue-500/50 rounded-3xl p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(59,130,246,0.15)]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <LogIn className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3 font-display">Rejoindre une partie</h3>
            <p className="text-sphera-text-muted mb-8 text-lg">Vous avez un code ? Rejoignez instantanément une salle d'attente depuis votre téléphone.</p>
            <div className="flex items-center gap-2 text-blue-500 font-bold uppercase tracking-wider text-sm">
              Jouer <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-display font-bold text-white">Dernières parties</h3>
          </div>
          
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-sphera-green" />
            </div>
          ) : liveSessions.length === 0 ? (
            <div className="text-center p-12 bg-sphera-surface-2/50 rounded-3xl border border-sphera-border border-dashed">
              <p className="text-sphera-text-muted text-lg">Vous n'avez pas encore hébergé de session Sphera Live.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {liveSessions.map(session => (
                <div 
                  key={session.id} 
                  onClick={() => navigate(`/live/host?code=${session.roomCode}&reset=1`)}
                  className="bg-sphera-surface hover:bg-sphera-surface-2 p-6 border border-sphera-border rounded-2xl cursor-pointer transition-all hover:border-sphera-green/50 group relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-sphera-bg rounded-lg">
                      <Zap className="w-5 h-5 text-sphera-text-muted group-hover:text-sphera-green transition-colors" />
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setQuizToDelete(session.roomCode);
                        }}
                        className="p-1.5 rounded-lg text-sphera-text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                        title="Supprimer la session"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="px-3 py-1 bg-sphera-bg rounded-full text-xs font-mono text-sphera-text-muted group-hover:text-white transition-colors border border-sphera-border">
                        {session.roomCode}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-white font-bold text-lg mb-2 line-clamp-1">{session.title}</h4>
                  <div className="text-sm text-sphera-text-muted">
                    {new Date(session.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <DeleteConfirmModal
        isOpen={Boolean(quizToDelete)}
        setIsOpen={(open) => {
          if (!open) setQuizToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Supprimer le quiz ?"
        description="Cette action est irréversible. Les scores et questions de cette session live seront définitivement supprimés."
      />
    </div>
  );
}

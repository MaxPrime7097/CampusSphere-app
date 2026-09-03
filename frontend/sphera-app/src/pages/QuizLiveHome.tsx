import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Plus, LogIn, Loader2 } from 'lucide-react';
import { getMyQuizSessions } from '../services/spheraApi';
import { Helmet } from 'react-helmet-async';

export default function QuizLiveHome() {
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
    <div className="flex flex-col h-full overflow-y-auto pb-12">
      <Helmet>
        <title>Sphera Live · CampusSphere</title>
      </Helmet>
      
      <main className="flex-1 w-full max-w-5xl mx-auto py-12 px-4 sm:px-6">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-sphera-green/10 rounded-full mb-4 sphera-live-pulse">
            <Zap className="w-8 h-8 text-sphera-green" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
            Sphera Live
          </h1>
          <p className="text-lg text-sphera-text-muted">
            Quiz multijoueur en temps réel
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-16 max-w-3xl mx-auto">
          <Link to="/live/host" className="sphera-card p-8 flex flex-col items-center justify-center text-center hover:bg-sphera-surface-2 transition-all hover:scale-105 border border-sphera-border rounded-2xl group">
            <div className="w-16 h-16 rounded-full bg-sphera-green/10 flex items-center justify-center mb-6 group-hover:bg-sphera-green/20 transition-colors">
              <Plus className="w-8 h-8 text-sphera-green" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Créer une session</h3>
            <p className="text-sphera-text-muted">Hébergez un quiz et défiez vos amis en direct.</p>
          </Link>
          <Link to="/live/join" className="sphera-card p-8 flex flex-col items-center justify-center text-center hover:bg-sphera-surface-2 transition-all hover:scale-105 border border-sphera-border rounded-2xl group">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
              <LogIn className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">Rejoindre avec un code</h3>
            <p className="text-sphera-text-muted">Participez à un quiz en entrant le code de la salle.</p>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <h3 className="text-xl font-bold text-white mb-6">Vos sessions récentes</h3>
          {loading ? (
            <div className="flex justify-center p-8 text-sphera-text-muted">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : liveSessions.length === 0 ? (
            <div className="text-center p-12 bg-sphera-surface-2 rounded-2xl border border-sphera-border">
              <p className="text-sphera-text-muted">Vous n'avez pas encore hébergé de session Sphera Live.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveSessions.map(session => (
                <div key={session.id} className="sphera-card p-5 border border-sphera-border rounded-xl">
                  <h4 className="text-white font-medium mb-3 line-clamp-1">{session.title}</h4>
                  <div className="flex justify-between items-center text-sm text-sphera-text-muted">
                    <span>Code: <strong className="text-white font-mono tracking-wider">{session.roomCode}</strong></span>
                    <span>{new Date(session.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

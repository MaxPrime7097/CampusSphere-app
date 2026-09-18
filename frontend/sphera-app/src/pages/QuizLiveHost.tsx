import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { QuizSetupForm } from '../components/quiz-live/QuizSetupForm';
import { useQuizSocket } from '../hooks/useQuizSocket';
import { TimerBar } from '../components/quiz-live/TimerBar';
import { QuestionDisplay } from '../components/quiz-live/QuestionDisplay';
import { Leaderboard } from '../components/quiz-live/Leaderboard';
import { Helmet } from 'react-helmet-async';
import { useSpheraAuth } from '../contexts/SpheraAuthContext';
import confetti from 'canvas-confetti';
import { playSound, preloadSounds, toggleMute, getMuteState } from '../utils/audioManager';
import { Volume2, VolumeX, Zap, Eye, ArrowLeft, Square } from 'lucide-react';
import { getQuizSessionByCode, getQuizSessionHostDetails, resetQuizSession } from '../services/spheraApi';
import { QuizQuestionsDrawer } from '../components/quiz-live/QuizQuestionsDrawer';

export default function QuizLiveHost() {
  const [isMuted, setIsMuted] = useState(getMuteState());

  useEffect(() => {
    preloadSounds();
  }, []);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useSpheraAuth();
  const [session, setSession] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number | null>(5);
  const codeParam = searchParams.get('code');
  const [isFetchingSession, setIsFetchingSession] = useState(!!codeParam);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const code = searchParams.get('code');
    const reset = searchParams.get('reset');
    if (code) {
      setIsFetchingSession(true);
      
      const prepareSession = async () => {
        if (reset === '1') {
          try {
            await resetQuizSession(code);
            searchParams.delete('reset');
            setSearchParams(searchParams, { replace: true });
          } catch (e) {
            console.error("Failed to reset session:", e);
          }
        }
        
        try {
          const res = await getQuizSessionHostDetails(code);
          if (res && res.data) {
            setSession({
              roomCode: code,
              title: res.data.title,
              questions: res.data.questions || [],
            });
          }
        } catch (err) {
          try {
            const res2 = await getQuizSessionByCode(code);
            if (res2 && (res2 as any).data) {
              setSession({
                roomCode: code,
                title: (res2 as any).data.title,
                questions: [],
              });
            }
          } catch (e2) {
            console.error(e2);
            alert("Impossible de charger la session.");
            navigate('/live');
          }
        } finally {
          setIsFetchingSession(false);
        }
      };
      
      prepareSession();
    }
  }, [searchParams, setSearchParams]);

  const {
    participants,
    currentQuestion,
    questionResults,
    leaderboard,
    status,
    countdownActive,
    startCountdown,
    startQuiz,
    stopQuiz,
    nextQuestion,
    joinRoom
  } = useQuizSocket(session?.roomCode || null);

  const prevParticipantsCount = React.useRef(0);

  useEffect(() => {
    if (participants.length > prevParticipantsCount.current) {
      playSound('join');
    }
    prevParticipantsCount.current = participants.length;
  }, [participants.length]);

  useEffect(() => {
    if (status === 'connected' && session) {
      joinRoom(user?.first_name || user?.username || 'Hote', user?.id);
    }
  }, [status, session, joinRoom, user]);

  const handleSessionCreated = (newSession: any) => {
    setSession(newSession);
  };

  const handleStartWithCountdown = () => {
    startCountdown();
  };

  const handleStopQuiz = () => {
    if (window.confirm("Êtes-vous sûr de vouloir arrêter le quiz et ramener tous les participants au salon d'attente ?")) {
      setCountdown(null);
      stopQuiz();
    }
  };

  useEffect(() => {
    if (countdownActive) {
      playSound('start');
      setCountdown(3);
    } else {
      setCountdown(null);
    }
  }, [countdownActive]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      startQuiz();
      setCountdown(null);
    }
  }, [countdown, startQuiz]);

  const toggleSound = () => {
    setIsMuted(toggleMute());
  };

  // Phases: 'setup', 'waiting', 'playing', 'results', 'finished'
  let phase = 'setup';
  if (session) {
    if (countdown !== null) phase = 'countdown';
    else if (!currentQuestion && !leaderboard.length) phase = 'waiting';
    else if (currentQuestion && !questionResults) phase = 'playing';
    else if (questionResults && currentQuestion) phase = 'results';
    else if (leaderboard.length > 0 && !currentQuestion) {
      phase = 'finished';
    }
  }

  useEffect(() => {
    if (phase === 'results' && autoAdvanceTimer !== null) {
      const timer = setTimeout(() => {
        nextQuestion();
      }, autoAdvanceTimer * 1000);
      return () => clearTimeout(timer);
    }
  }, [phase, autoAdvanceTimer, nextQuestion]);

  useEffect(() => {
    if (phase === 'finished') {
      playSound('podium');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#EAB308', '#FFFFFF']
      });
    }
  }, [phase]);

  if (isFetchingSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-sphera-bg font-live relative overflow-hidden">
        {/* Dynamic Grid Background with Glow */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-40" style={{
          backgroundImage: `radial-gradient(circle at center, rgba(34, 197, 94, 0.2) 0%, transparent 60%), linear-gradient(rgba(34, 197, 94, 0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.15) 1px, transparent 1px)`,
          backgroundSize: '100% 100%, 40px 40px, 40px 40px'
        }}></div>
        <div className="relative z-10 flex flex-col items-center animate-pulse">
          <div className="w-20 h-20 bg-sphera-green/20 rounded-3xl flex items-center justify-center mb-6 border-2 border-sphera-green/50 shadow-[0_0_50px_rgba(34,197,94,0.3)] rotate-12">
            <Zap className="w-10 h-10 text-sphera-green -rotate-12" />
          </div>
          <h1 className="font-display text-4xl font-bold text-white tracking-widest uppercase">
            Connexion...
          </h1>
          <div className="mt-8 flex gap-2">
            <div className="w-2 h-2 bg-sphera-green rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 bg-sphera-green rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 bg-sphera-green rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen h-auto overflow-y-auto bg-sphera-bg relative font-live">
      {/* Dynamic Grid Background with Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30" style={{
        backgroundImage: `radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, transparent 70%), linear-gradient(rgba(34, 197, 94, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.25) 1px, transparent 1px)`,
        backgroundSize: '100% 100%, 40px 40px, 40px 40px'
      }}></div>
      
      <Helmet>
        <title>Héberger un Quiz · Sphera Live</title>
      </Helmet>

      {/* Back to Sphera Live Home button (Visible during setup and waiting lobby, hidden during active quiz) */}
      {(phase === 'setup' || phase === 'waiting') && (
        <Link
          to="/live"
          className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sphera-surface-2/90 backdrop-blur border border-sphera-border text-sphera-text-muted hover:text-white hover:border-sphera-green/50 transition-all text-xs font-semibold shadow-lg group"
          title="Retour à Sphera Live"
        >
          <ArrowLeft className="w-4 h-4 text-sphera-green group-hover:-translate-x-0.5 transition-transform" />
          <span>Sphera Live</span>
        </Link>
      )}

      {/* Top-Right Controls: Mute and Stop Quiz */}
      <div className="absolute top-6 right-6 z-50 flex flex-col items-end gap-2.5">
        <button 
          onClick={toggleSound}
          className="p-3 rounded-full bg-sphera-surface-2 border border-sphera-border text-white hover:bg-sphera-surface transition-colors shadow-lg"
          title={isMuted ? "Activer le son" : "Couper le son"}
        >
          {isMuted ? <VolumeX className="w-6 h-6 text-red-500" /> : <Volume2 className="w-6 h-6 text-sphera-green" />}
        </button>

        {/* Bouton Arrêter le Quiz pour l'admin pendant le jeu */}
        {(phase === 'countdown' || phase === 'playing' || phase === 'results' || phase === 'finished') && (
          <button
            onClick={handleStopQuiz}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 hover:border-red-500 text-red-400 hover:text-red-300 transition-all text-xs font-semibold shadow-lg backdrop-blur group"
            title="Arrêter la partie et revenir au salon d'attente"
          >
            <Square className="w-3.5 h-3.5 fill-red-400 text-red-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Arrêter le quiz</span>
          </button>
        )}
      </div>
      
      <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 flex flex-col justify-center min-h-screen relative z-10">
        
        {phase === 'setup' && (
          <QuizSetupForm onSessionCreated={handleSessionCreated} />
        )}

        {phase === 'countdown' && (
          <div className="flex items-center justify-center w-full">
            <span className="text-[200px] font-bold text-white tabular-nums animate-pulse drop-shadow-[0_0_30px_rgba(34,197,94,0.8)] text-sphera-green">
              {countdown}
            </span>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center">
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">Code pour rejoindre</h2>
            <div className="font-mono text-7xl sm:text-9xl font-bold tracking-[0.2em] text-sphera-green mb-8 select-all bg-sphera-surface-2 py-8 px-16 rounded-3xl border-2 border-sphera-green/50 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
              {session?.roomCode}
            </div>

            {session?.title && (
              <h1 className="text-2xl sm:text-3xl font-display font-bold text-white mb-3">
                {session.title}
              </h1>
            )}

            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 mb-8 rounded-full bg-sphera-surface-2 border border-sphera-border hover:border-sphera-green/50 text-sphera-text-muted hover:text-white transition-all text-sm font-semibold shadow-lg group"
            >
              <Eye className="w-4 h-4 text-sphera-green group-hover:scale-110 transition-transform" />
              <span>Questions du quiz ({session?.questions?.length || 0})</span>
              <span className="text-xs text-sphera-green bg-sphera-green/10 border border-sphera-green/30 px-2.5 py-0.5 rounded-full ml-1 font-mono">
                Voir / Modifier
              </span>
            </button>
            
            <div className="w-full bg-sphera-surface-2/80 backdrop-blur-md border border-sphera-border rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider text-sphera-text-muted">
                Participants ({participants.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-left">
                {participants.length === 0 ? (
                  <p className="text-sphera-text-muted italic col-span-full text-center py-4">En attente de joueurs...</p>
                ) : (
                  participants.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-3 bg-sphera-bg border border-sphera-border rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-sphera-green animate-pulse"></div>
                      <span className="text-white font-medium text-lg truncate">
                        {p.displayName}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-3 mb-8 bg-sphera-surface px-6 py-4 rounded-xl border border-sphera-border">
              <label htmlFor="autoAdvance" className="text-white font-medium select-none text-center">
                Enchaînement automatique :
              </label>
              <select
                id="autoAdvance"
                value={autoAdvanceTimer === null ? 'manual' : autoAdvanceTimer.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  setAutoAdvanceTimer(val === 'manual' ? null : parseInt(val));
                }}
                className="bg-sphera-bg border border-sphera-border text-white px-4 py-2 rounded-lg focus:outline-none focus:border-sphera-green"
              >
                <option value="manual">Désactivé (Manuel)</option>
                <option value="0">Sans pause (Immédiat)</option>
                <option value="3">3 secondes</option>
                <option value="5">5 secondes</option>
                <option value="10">10 secondes</option>
              </select>
            </div>

            <button
              onClick={handleStartWithCountdown}
              disabled={participants.length === 0 || status !== 'connected'}
              className="sphera-primary-btn text-lg px-12 py-4 rounded-xl"
            >
              Démarrer le quiz
            </button>
          </div>
        )}

        {phase === 'playing' && currentQuestion && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-4xl mb-8">
              <TimerBar duration={currentQuestion.timeLimit} />
            </div>
            <QuestionDisplay 
              question={currentQuestion.question}
              options={currentQuestion.options}
              questionIndex={currentQuestion.questionIndex}
              totalQuestions={currentQuestion.totalQuestions}
              selectedAnswer={null}
              correctIndex={null}
              points={currentQuestion.points}
              isHost={true}
            />
          </div>
        )}

        {phase === 'results' && currentQuestion && questionResults && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-4xl mb-8 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Résultats</h2>
              <button
                onClick={nextQuestion}
                className="sphera-primary-btn"
              >
                Question suivante
              </button>
            </div>
            <QuestionDisplay 
              question={currentQuestion.question}
              options={currentQuestion.options}
              questionIndex={currentQuestion.questionIndex}
              totalQuestions={currentQuestion.totalQuestions}
              selectedAnswer={null}
              correctIndex={questionResults.correctIndex}
              points={currentQuestion.points}
              isHost={true}
            />
            <div className="w-full max-w-4xl mt-12">
              <Leaderboard entries={leaderboard} />
            </div>
          </div>
        )}

        {phase === 'finished' && (
          <div className="w-full flex flex-col items-center">
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-live font-bold text-white mb-2">Quiz terminé !</h2>
              <p className="text-sphera-text-muted">Voici le classement final.</p>
            </div>
            <Leaderboard entries={leaderboard} />
            <button
              onClick={() => navigate('/live')}
              className="mt-12 sphera-primary-btn"
            >
              Retour au dashboard
            </button>
          </div>
        )}

        {/* Slide-over Drawer for previewing & modifying questions */}
        <QuizQuestionsDrawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          roomCode={session?.roomCode || ''}
          initialQuestions={session?.questions || []}
          initialTitle={session?.title}
          onQuestionsUpdated={(updatedQuestions, updatedTitle) => {
            setSession((prev: any) => ({
              ...prev,
              questions: updatedQuestions,
              title: updatedTitle || prev?.title,
            }));
          }}
        />

      </main>
    </div>
  );
}

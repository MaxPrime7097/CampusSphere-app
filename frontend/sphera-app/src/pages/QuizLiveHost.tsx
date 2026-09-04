import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizSetupForm } from '../components/quiz-live/QuizSetupForm';
import { useQuizSocket } from '../hooks/useQuizSocket';
import { TimerBar } from '../components/quiz-live/TimerBar';
import { QuestionDisplay } from '../components/quiz-live/QuestionDisplay';
import { Leaderboard } from '../components/quiz-live/Leaderboard';
import { Helmet } from 'react-helmet-async';
import { useSpheraAuth } from '../contexts/SpheraAuthContext';
import confetti from 'canvas-confetti';
import { playSound, preloadSounds } from '../utils/audioManager';

export default function QuizLiveHost() {
  useEffect(() => {
    preloadSounds();
  }, []);

  const navigate = useNavigate();
  const { user } = useSpheraAuth();
  const [session, setSession] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoAdvanceTimer, setAutoAdvanceTimer] = useState<number | null>(5);
  
  const {
    participants,
    currentQuestion,
    questionResults,
    leaderboard,
    status,
    startQuiz,
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
    playSound('start');
    setCountdown(3);
  };

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
            <div className="font-mono text-7xl sm:text-9xl font-bold tracking-[0.2em] text-sphera-green mb-12 select-all bg-sphera-surface-2 py-8 px-16 rounded-3xl border-2 border-sphera-green/50 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
              {session?.roomCode}
            </div>
            
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
              onClick={() => navigate('/dashboard')}
              className="mt-12 sphera-primary-btn"
            >
              Retour au dashboard
            </button>
          </div>
        )}

      </main>
    </div>
  );
}

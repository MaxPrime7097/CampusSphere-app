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

export default function QuizLiveHost() {
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
      new Audio('/sounds/join.mp3').play().catch(e => console.log('Audio error:', e));
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
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      new Audio('/sounds/tick.mp3').play().catch(e => console.log('Audio error:', e));
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      new Audio('/sounds/start.mp3').play().catch(e => console.log('Audio error:', e));
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
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#22C55E', '#EAB308', '#FFFFFF']
      });
    }
  }, [phase]);

  return (
    <div className="flex flex-col min-h-screen h-auto overflow-y-auto bg-sphera-bg relative">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{
        backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.2) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
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
            <span className="text-[150px] font-bold text-white tabular-nums animate-pulse">
              {countdown}
            </span>
          </div>
        )}

        {phase === 'waiting' && (
          <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center">
            <h2 className="text-2xl font-bold text-white mb-2">Code pour rejoindre:</h2>
            <div className="font-mono text-6xl sm:text-8xl font-bold tracking-[0.3em] text-sphera-green mb-12 select-all bg-sphera-surface-2 py-6 px-12 rounded-3xl border border-sphera-green/30 sphera-glow">
              {session?.roomCode}
            </div>
            
            <div className="w-full bg-sphera-surface-2 border border-sphera-border rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-4">
                Participants ({participants.length})
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {participants.length === 0 ? (
                  <p className="text-sphera-text-muted italic">En attente de joueurs...</p>
                ) : (
                  participants.map((p, i) => (
                    <span key={i} className="px-4 py-2 bg-sphera-surface border border-sphera-border rounded-full text-white text-sm font-medium">
                      {p.displayName}
                    </span>
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

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuizSocket } from '../hooks/useQuizSocket';
import { TimerBar } from '../components/quiz-live/TimerBar';
import { QuestionDisplay } from '../components/quiz-live/QuestionDisplay';
import { Leaderboard } from '../components/quiz-live/Leaderboard';
import { getQuizSessionByCode } from '../services/spheraApi';
import { useSpheraAuth } from '../contexts/SpheraAuthContext';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import confetti from 'canvas-confetti';
import { playSound, preloadSounds } from '../utils/audioManager';

export default function QuizLiveJoin() {
  // Preload sounds when component mounts
  useEffect(() => {
    preloadSounds();
  }, []);

  const [searchParams] = useSearchParams();
  const { user } = useSpheraAuth();
  
  const [roomCodeInput, setRoomCodeInput] = useState(searchParams.get('code') || '');
  const [displayName, setDisplayName] = useState(user?.first_name || user?.username || '');
  
  const [joinedRoomCode, setJoinedRoomCode] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerTime, setAnswerTime] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const {
    participants,
    currentQuestion,
    answerResult,
    questionResults,
    leaderboard,
    status,
    countdownActive,
    joinRoom,
    submitAnswer
  } = useQuizSocket(joinedRoomCode);

  const handleJoin = async () => {
    if (!roomCodeInput.trim() || !displayName.trim()) {
      setJoinError('Veuillez entrer un code et un pseudo.');
      return;
    }
    
    setJoining(true);
    setJoinError(null);
    try {
      const code = roomCodeInput.toUpperCase().trim();
      const res = await getQuizSessionByCode(code);
      if (res && (res as any).data) {
        setJoinedRoomCode(code);
      } else {
        setJoinError('Session introuvable.');
      }
    } catch (err: any) {
      setJoinError(err.message || 'Session introuvable ou erreur de connexion.');
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    if (status === 'connected' && joinedRoomCode) {
      joinRoom(displayName, user?.id);
    }
  }, [status, joinedRoomCode, joinRoom, displayName, user?.id]);

  useEffect(() => {
    if (currentQuestion) {
      setSelectedOption(null);
      setAnswerTime(Date.now());
    }
  }, [currentQuestion]);

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
      setCountdown(null);
    }
  }, [countdown]);

  // Phases: 'join', 'waiting', 'countdown', 'playing', 'results', 'finished'
  let phase = 'join';
  if (joinedRoomCode) {
    if (countdown !== null) phase = 'countdown';
    else if (!currentQuestion && !leaderboard.length) phase = 'waiting';
    else if (currentQuestion && !questionResults) phase = 'playing';
    else if (questionResults && currentQuestion) phase = 'results';
    else if (leaderboard.length > 0 && !currentQuestion) phase = 'finished';
  }

  // Audio Effects
  useEffect(() => {
    if (phase === 'results') {
      if (answerResult && answerResult.correct) {
        playSound('success');
      } else {
        playSound('fail');
      }
    }
  }, [phase, answerResult]);

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

  const handleAnswer = (index: number) => {
    if (selectedOption !== null || !currentQuestion) return;
    setSelectedOption(index);
    const timeToAnswer = (Date.now() - answerTime) / 1000;
    submitAnswer(currentQuestion.questionIndex, index, timeToAnswer);
  };

  return (
    <div className="flex flex-col min-h-screen h-auto overflow-y-auto bg-sphera-bg relative font-live">
      {/* Dynamic Grid Background with Glow */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30" style={{
        backgroundImage: `radial-gradient(circle at center, rgba(34, 197, 94, 0.15) 0%, transparent 70%), linear-gradient(rgba(34, 197, 94, 0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.25) 1px, transparent 1px)`,
        backgroundSize: '100% 100%, 40px 40px, 40px 40px'
      }}></div>

      <Helmet>
        <title>Rejoindre un Quiz · Sphera Live</title>
      </Helmet>

      <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-4 flex flex-col justify-center min-h-screen relative z-10">
        
        {phase === 'join' && (
          <div className="w-full max-w-md mx-auto bg-sphera-surface-2/90 backdrop-blur-md border border-sphera-border rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-6 text-center uppercase tracking-widest">Rejoindre</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-sphera-text-muted mb-2">Code de la session</label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder="EX: ABCDEF"
                  maxLength={6}
                  className="w-full font-mono text-center text-2xl tracking-widest bg-sphera-surface border border-sphera-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sphera-green transition-colors uppercase"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-sphera-text-muted mb-2">Votre pseudo</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Pseudo"
                  maxLength={20}
                  className="w-full bg-sphera-surface border border-sphera-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-sphera-green transition-colors"
                />
              </div>
            </div>

            {joinError && <p className="text-red-500 text-sm mb-4 text-center">{joinError}</p>}

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full sphera-primary-btn flex justify-center items-center gap-2"
            >
              {joining && <Loader2 className="w-5 h-5 animate-spin" />}
              Rejoindre
            </button>
          </div>
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
              {joinedRoomCode}
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

            <div className="flex flex-col items-center mt-8">
              <div className="inline-flex items-center justify-center p-4 bg-sphera-surface-2 rounded-full mb-4 sphera-live-pulse">
                <Loader2 className="w-8 h-8 text-sphera-green animate-spin" />
              </div>
              <p className="text-sphera-text-muted uppercase tracking-widest text-lg font-bold">En attente de l'hôte...</p>
            </div>
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
              selectedAnswer={selectedOption}
              correctIndex={null}
              onAnswer={handleAnswer}
            />
          </div>
        )}

        {phase === 'results' && currentQuestion && questionResults && (
          <div className="w-full flex flex-col items-center">
            <div className="mb-8 text-center">
              {answerResult ? (
                  answerResult.correct ? (
                      <h2 className="text-4xl font-bold text-sphera-green mb-2 animate-bounce">+ {answerResult.pointsEarned} pts</h2>
                  ) : (
                      <h2 className="text-3xl font-bold text-red-500 mb-2 animate-pulse">Mauvaise reponse</h2>
                  )
              ) : (
                  <h2 className="text-3xl font-bold text-sphera-text-muted mb-2">Temps ecoule</h2>
              )}
            </div>

            <QuestionDisplay 
              question={currentQuestion.question}
              options={currentQuestion.options}
              questionIndex={currentQuestion.questionIndex}
              totalQuestions={currentQuestion.totalQuestions}
              selectedAnswer={selectedOption}
              correctIndex={questionResults.correctIndex}
            />
            
            <div className="w-full max-w-4xl mt-12">
              <Leaderboard entries={leaderboard} highlightUserId={user?.id} />
            </div>
          </div>
        )}

        {phase === 'finished' && (
          <div className="w-full flex flex-col items-center">
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-live font-bold text-white mb-2">Quiz terminé !</h2>
            </div>
            <Leaderboard entries={leaderboard} highlightUserId={user?.id} />
          </div>
        )}

      </main>
    </div>
  );
}

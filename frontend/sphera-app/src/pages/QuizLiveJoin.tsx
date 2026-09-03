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

export default function QuizLiveJoin() {
  const [searchParams] = useSearchParams();
  const { user } = useSpheraAuth();
  
  const [roomCodeInput, setRoomCodeInput] = useState(searchParams.get('code') || '');
  const [displayName, setDisplayName] = useState(user?.first_name || user?.username || '');
  
  const [joinedRoomCode, setJoinedRoomCode] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [answerTime, setAnswerTime] = useState<number>(0);

  const {
    currentQuestion,
    answerResult,
    questionResults,
    leaderboard,
    status,
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
      if (res.success) {
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

  const handleAnswer = (index: number) => {
    if (selectedOption !== null || !currentQuestion) return;
    setSelectedOption(index);
    const timeToAnswer = (Date.now() - answerTime) / 1000;
    submitAnswer(currentQuestion.questionIndex, index, timeToAnswer);
  };

  // Phases: 'join', 'waiting', 'playing', 'results', 'finished'
  let phase = 'join';
  if (joinedRoomCode) {
    if (!currentQuestion && !leaderboard.length) phase = 'waiting';
    else if (currentQuestion && !questionResults) phase = 'playing';
    else if (questionResults && currentQuestion) phase = 'results';
    else if (leaderboard.length > 0 && !currentQuestion) phase = 'finished';
  }

  return (
    <div className="flex flex-col min-h-screen h-auto overflow-y-auto bg-sphera-bg relative">
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20" style={{
        backgroundImage: `linear-gradient(rgba(34, 197, 94, 0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34, 197, 94, 0.2) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }}></div>

      <Helmet>
        <title>Rejoindre un Quiz · Sphera Live</title>
      </Helmet>

      <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-4 flex flex-col justify-center min-h-screen relative z-10">
        
        {phase === 'join' && (
          <div className="w-full max-w-md mx-auto bg-sphera-surface-2 border border-sphera-border rounded-2xl p-8 shadow-xl">
            <h2 className="text-2xl font-live font-bold text-white mb-6 text-center">Rejoindre un quiz</h2>
            
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

        {phase === 'waiting' && (
          <div className="w-full max-w-md mx-auto text-center">
            <div className="inline-flex items-center justify-center p-4 bg-sphera-surface-2 rounded-full mb-6 sphera-live-pulse">
              <Loader2 className="w-8 h-8 text-sphera-green animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Vous êtes dans la salle</h2>
            <p className="text-sphera-text-muted">En attente du lancement par l'hôte...</p>
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

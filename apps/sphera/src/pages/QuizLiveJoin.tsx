import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuizSocket } from '../hooks/useQuizSocket';
import { TimerBar } from '../components/quiz-live/TimerBar';
import { QuestionDisplay } from '../components/quiz-live/QuestionDisplay';
import { Leaderboard } from '../components/quiz-live/Leaderboard';
import { getQuizSessionByCode, getQuizParticipants } from '../services/spheraApi';
import { useSpheraAuth } from '../contexts/SpheraAuthContext';
import { Spinner as Loader2, SignIn as LogIn, ArrowLeft, SpeakerHigh as Volume2, SpeakerSimpleX as VolumeX } from "@phosphor-icons/react";
import { Helmet } from 'react-helmet-async';
import confetti from 'canvas-confetti';
import { playSound, preloadSounds, toggleMute, getMuteState } from '../utils/audioManager';

export default function QuizLiveJoin() {
  const { t } = useTranslation('live');
  const [isMuted, setIsMuted] = useState(getMuteState());

  const toggleSound = () => {
    setIsMuted(toggleMute());
  };

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
    setParticipants,
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
      setJoinError(t('join.errorMissingFields'));
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
        setJoinError(t('join.errorNotFound'));
      }
    } catch (err: any) {
      setJoinError(err.message || t('join.errorConnection'));
    } finally {
      setJoining(false);
    }
  };

  useEffect(() => {
    if (status === 'connected' && joinedRoomCode) {
      joinRoom(displayName, user?.id, 'participant');
    }
  }, [status, joinedRoomCode, joinRoom, displayName, user?.id]);

  useEffect(() => {
    if (currentQuestion) {
      setSelectedOption(null);
      setAnswerTime(Date.now());
    } else {
      setSelectedOption(null);
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

  // Safety lobby polling every 3s while waiting for the quiz to start
  useEffect(() => {
    if (phase !== 'waiting' || !joinedRoomCode) return;
    const interval = setInterval(async () => {
      try {
        const res = await getQuizParticipants(joinedRoomCode);
        if (res?.data?.participants && Array.isArray(res.data.participants)) {
          setParticipants(res.data.participants);
        }
      } catch {
        // Silent catch: WebSocket is real-time primary
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [phase, joinedRoomCode, setParticipants]);

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
        <title>{t('join.pageTitle')}</title>
      </Helmet>

      {/* Back to Sphera Live Home button */}
      {(phase === 'join' || phase === 'waiting') && (
        <Link
          to="/live"
          className="absolute top-6 left-6 z-50 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sphera-surface-2/90 backdrop-blur border border-sphera-border text-sphera-text-muted hover:text-white hover:border-sphera-green/50 transition-all text-xs font-semibold shadow-lg group"
          title={t('join.backToLive')}
        >
          <ArrowLeft className="w-4 h-4 text-sphera-green group-hover:-translate-x-0.5 transition-transform" />
          <span>Sphera Live</span>
        </Link>
      )}

      {/* Mute Button for participant */}
      <button 
        onClick={toggleSound}
        className="absolute top-6 right-6 z-50 p-3 rounded-full bg-sphera-surface-2 border border-sphera-border text-white hover:bg-sphera-surface transition-colors shadow-lg"
        title={isMuted ? t('join.soundUnmute') : t('join.soundMute')}
      >
        {isMuted ? <VolumeX className="w-6 h-6 text-red-500" /> : <Volume2 className="w-6 h-6 text-sphera-green" />}
      </button>

      <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-4 flex flex-col justify-center min-h-screen relative z-10">
        
        {phase === 'join' && (
          <div className="w-full max-w-md mx-auto relative group overflow-hidden bg-sphera-surface-2/90 backdrop-blur-md border border-sphera-border rounded-3xl p-8 sm:p-10 shadow-2xl transition-all duration-500 hover:border-sphera-green/50 hover:shadow-[0_10px_50px_rgba(34,197,94,0.15)] animate-fade-in-up">
            <div className="absolute top-0 right-0 w-40 h-40 bg-sphera-green/5 rounded-bl-[100px] -z-10 transition-transform duration-700 group-hover:scale-125" />
            
            <div className="flex justify-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-sphera-green/10 flex items-center justify-center border border-sphera-green/20 shadow-[0_0_20px_rgba(34,197,94,0.1)]">
                <LogIn className="w-8 h-8 text-sphera-green" />
              </div>
            </div>

            <h2 className="text-3xl font-display font-bold text-white mb-2 text-center tracking-tight">{t('join.title')}</h2>
            <p className="text-sphera-text-muted text-center mb-8">{t('join.subtitle')}</p>
            
            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-xs font-bold text-sphera-text-muted mb-2 uppercase tracking-wider">{t('join.sessionCodeLabel')}</label>
                <input
                  type="text"
                  value={roomCodeInput}
                  onChange={e => setRoomCodeInput(e.target.value.toUpperCase())}
                  placeholder={t('join.codePlaceholder')}
                  maxLength={6}
                  className="w-full font-mono text-center text-3xl tracking-[0.3em] bg-sphera-surface border-2 border-sphera-border rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-sphera-green transition-colors uppercase shadow-inner"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-sphera-text-muted mb-2 uppercase tracking-wider">{t('join.pseudoLabel')}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder={t('join.pseudoPlaceholder')}
                  maxLength={20}
                  className="w-full text-center text-xl bg-sphera-surface border-2 border-sphera-border rounded-2xl px-4 py-4 text-white focus:outline-none focus:border-sphera-green transition-colors shadow-inner"
                />
              </div>
            </div>

            {joinError && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-sm text-center font-medium animate-shake">
                {joinError}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full bg-sphera-green text-black font-bold text-lg rounded-2xl px-6 py-4 hover:bg-sphera-green-hover transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] hover:-translate-y-1 flex justify-center items-center gap-2"
            >
              {joining ? <Loader2 className="w-6 h-6 animate-spin" /> : t('join.joinBtn')}
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
            <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-widest">{t('join.joinCodeTitle')}</h2>
            <div className="font-mono text-7xl sm:text-9xl font-bold tracking-[0.2em] text-sphera-green mb-12 select-all bg-sphera-surface-2 py-8 px-16 rounded-3xl border-2 border-sphera-green/50 shadow-[0_0_50px_rgba(34,197,94,0.3)]">
              {joinedRoomCode}
            </div>
            
            <div className="w-full bg-sphera-surface-2/80 backdrop-blur-md border border-sphera-border rounded-2xl p-6 mb-8">
              <h3 className="text-xl font-bold text-white mb-6 uppercase tracking-wider text-sphera-text-muted">
                {t('join.participantsCount', { count: participants.length })}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-left">
                {participants.length === 0 ? (
                  <p className="text-sphera-text-muted italic col-span-full text-center py-4">{t('join.waitingPlayers')}</p>
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
              <p className="text-sphera-text-muted uppercase tracking-widest text-lg font-bold">{t('join.waitingRoom')}</p>
            </div>
          </div>
        )}

        {phase === 'playing' && currentQuestion && (
          <div className="w-full flex flex-col items-center">
            <div className="w-full max-w-4xl mb-8">
              <TimerBar key={currentQuestion.questionIndex} duration={currentQuestion.timeLimit} />
            </div>
            <QuestionDisplay 
              question={currentQuestion.question}
              options={currentQuestion.options}
              questionIndex={currentQuestion.questionIndex}
              totalQuestions={currentQuestion.totalQuestions}
              selectedAnswer={selectedOption}
              correctIndex={null}
              points={currentQuestion.points}
              onAnswer={handleAnswer}
            />
          </div>
        )}

        {phase === 'results' && currentQuestion && questionResults && (
          <div className="w-full flex flex-col items-center">
            <div className="mb-8 text-center">
              {answerResult ? (
                  answerResult.correct ? (
                      <h2 className="text-4xl font-bold text-sphera-green mb-2 animate-bounce">{t('join.pointsEarned', { points: answerResult.pointsEarned })}</h2>
                  ) : (
                      <h2 className="text-3xl font-bold text-red-500 mb-2 animate-pulse">{t('join.wrongAnswer')}</h2>
                  )
              ) : (
                  <h2 className="text-3xl font-bold text-sphera-text-muted mb-2">{t('join.timeExpired')}</h2>
              )}
            </div>

            <QuestionDisplay 
              question={currentQuestion.question}
              options={currentQuestion.options}
              questionIndex={currentQuestion.questionIndex}
              totalQuestions={currentQuestion.totalQuestions}
              selectedAnswer={selectedOption}
              correctIndex={questionResults.correctIndex}
              points={currentQuestion.points}
            />
            
            <div className="w-full max-w-4xl mt-12">
              <Leaderboard entries={leaderboard} highlightUserId={user?.id} />
            </div>
          </div>
        )}

        {phase === 'finished' && (
          <div className="w-full flex flex-col items-center">
            <div className="mb-12 text-center">
              <h2 className="text-4xl font-live font-bold text-white mb-2">{t('join.quizFinishedTitle')}</h2>
            </div>
            <Leaderboard entries={leaderboard} highlightUserId={user?.id} />
          </div>
        )}

      </main>
    </div>
  );
}

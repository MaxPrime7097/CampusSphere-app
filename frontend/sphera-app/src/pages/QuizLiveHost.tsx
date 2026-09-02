import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QuizSetupForm } from '../components/quiz-live/QuizSetupForm';
import { useQuizSocket } from '../hooks/useQuizSocket';
import { TimerBar } from '../components/quiz-live/TimerBar';
import { QuestionDisplay } from '../components/quiz-live/QuestionDisplay';
import { Leaderboard } from '../components/quiz-live/Leaderboard';
import { Helmet } from 'react-helmet-async';

export default function QuizLiveHost() {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  
  const {
    participants,
    currentQuestion,
    questionResults,
    leaderboard,
    status,
    startQuiz,
    nextQuestion
  } = useQuizSocket(session?.room_code || null);

  const handleSessionCreated = (newSession: any) => {
    setSession(newSession);
  };

  // Phases: 'setup', 'waiting', 'playing', 'results', 'finished'
  let phase = 'setup';
  if (session) {
    if (!currentQuestion && !leaderboard.length) phase = 'waiting';
    else if (currentQuestion && !questionResults) phase = 'playing';
    else if (questionResults && currentQuestion) phase = 'results';
    else if (leaderboard.length > 0 && !currentQuestion) phase = 'finished';
  }

  return (
    <div className="flex flex-col min-h-full h-auto overflow-y-auto pb-12 bg-sphera-bg">
      <Helmet>
        <title>Héberger un Quiz · Sphera Live</title>
      </Helmet>
      
      <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 flex flex-col justify-center min-h-[calc(100vh-100px)]">
        
        {phase === 'setup' && (
          <QuizSetupForm onSessionCreated={handleSessionCreated} />
        )}

        {phase === 'waiting' && (
          <div className="w-full max-w-3xl mx-auto text-center flex flex-col items-center">
            <h2 className="text-2xl font-bold text-white mb-2">Code pour rejoindre:</h2>
            <div className="font-mono text-6xl sm:text-8xl font-bold tracking-[0.3em] text-sphera-green mb-12 select-all bg-sphera-surface-2 py-6 px-12 rounded-3xl border border-sphera-green/30">
              {session?.room_code}
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

            <button
              onClick={startQuiz}
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
              <h2 className="text-4xl font-display font-bold text-white mb-2">Quiz terminé !</h2>
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

import React, { useState } from 'react'
import { CheckCircle as CheckCircle2, XCircle, Timer, ArrowCounterClockwise as RotateCcw } from "@phosphor-icons/react";

interface QuizResultProps {
  data: any;
}

export function QuizResult({ data }: QuizResultProps) {
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [showResults, setShowResults] = useState(false)

  const quiz = data?.questions ? data : {
    questions: [
      {
        q: "Quelle est l'utilité principale de ce composant ?",
        options: ["Réguler la température", "Stocker les données", "Calculer les opérations", "Afficher l'interface"],
        correct: 2,
        explanation: "Le composant est le processeur central, il s'occupe des calculs mathématiques."
      },
      {
        q: "Laquelle de ces formules est exacte ?",
        options: ["E = mc2", "E = m/c", "E = mc", "E = m2c"],
        correct: 0,
        explanation: "L'énergie est égale à la masse multipliée par la vitesse de la lumière au carré."
      }
    ]
  }

  const handleSelect = (idx: number) => {
    if (answers[currentQ] !== undefined) return
    setAnswers(prev => ({ ...prev, [currentQ]: idx }))
  }

  const nextQ = () => {
    if (currentQ < quiz.questions.length - 1) {
      setCurrentQ(prev => prev + 1)
    } else {
      setShowResults(true)
    }
  }

  const reset = () => {
    setAnswers({})
    setCurrentQ(0)
    setShowResults(false)
  }

  const score = Object.keys(answers).reduce((acc, qIdx) => {
    return acc + (answers[parseInt(qIdx)] === quiz.questions[parseInt(qIdx)].correct ? 1 : 0)
  }, 0)

  if (showResults) {
    return (
      <div className="p-8 rounded-2xl bg-sphera-surface border border-sphera-border text-center animate-in zoom-in-95">
        <div className="w-24 h-24 rounded-full mx-auto bg-sphera-bg flex items-center justify-center border-4 border-sphera-green mb-6">
          <span className="font-display text-3xl font-bold text-white">{score}/{quiz.questions.length}</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Quiz terminé !</h2>
        <p className="text-sphera-text-muted mb-8">
          {score === quiz.questions.length ? "Parfait ! Tu as tout compris." : "Tu y es presque, revois tes erreurs ci-dessous."}
        </p>
        <button onClick={reset} className="btn btn-outline border-sphera-border text-white hover:bg-sphera-surface-2 flex items-center gap-2 mx-auto">
          <RotateCcw className="w-4 h-4" /> Recommencer
        </button>
      </div>
    )
  }

  const q = quiz.questions[currentQ]
  const hasAnswered = answers[currentQ] !== undefined
  const progress = ((currentQ + 1) / quiz.questions.length) * 100

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in">
      
      {/* Header / Progress */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sphera-text-muted font-medium">Question {currentQ + 1} / {quiz.questions.length}</span>
        <div className="flex items-center gap-2 text-sphera-green">
          <Timer className="w-4 h-4" />
          <span className="text-sm font-bold">10:00</span>
        </div>
      </div>

      <div className="w-full h-2 bg-sphera-surface rounded-full mb-8 overflow-hidden">
        <div className="h-full bg-sphera-green transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="p-6 rounded-2xl bg-sphera-surface border border-sphera-border mb-6">
        <h3 className="font-display text-xl text-white mb-6 leading-relaxed">
          {q.q}
        </h3>

        <div className="space-y-3">
          {q.options.map((opt: string, idx: number) => {
            let stateClass = "border-sphera-border hover:border-sphera-green/50 bg-sphera-bg text-white"
            
            if (hasAnswered) {
              if (idx === q.correct) {
                stateClass = "border-sphera-green bg-sphera-green/20 text-white"
              } else if (idx === answers[currentQ]) {
                stateClass = "border-red-500 bg-red-500/20 text-white"
              } else {
                stateClass = "border-sphera-border bg-sphera-bg opacity-50"
              }
            } else if (answers[currentQ] === idx) {
              stateClass = "border-sphera-green bg-sphera-green/10"
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={hasAnswered}
                className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between ${stateClass}`}
              >
                <span>{opt}</span>
                {hasAnswered && idx === q.correct && <CheckCircle2 className="w-5 h-5 text-sphera-green" />}
                {hasAnswered && idx === answers[currentQ] && idx !== q.correct && <XCircle className="w-5 h-5 text-red-500" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Explanation & Next */}
      {hasAnswered && (
        <div className="p-5 rounded-xl bg-sphera-surface-2 border border-sphera-border/50 mb-6 animate-in slide-in-from-bottom-2">
          <p className="text-sm text-sphera-text-muted mb-4"><strong className="text-white">Explication :</strong> {q.explanation}</p>
          <button onClick={nextQ} className="sphera-primary-btn w-full">
            {currentQ < quiz.questions.length - 1 ? "Question suivante" : "Voir le résultat final"}
          </button>
        </div>
      )}
    </div>
  )
}

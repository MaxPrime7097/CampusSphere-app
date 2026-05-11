import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

interface Question {
  question: string;
  options: string[];
  bonne_reponse: string; // "A", "B", "C" ou "D"
  explication: string;
}

interface QuizData {
  titre: string;
  questions: Question[];
}

interface QuizInteractifProps {
  data: QuizData;
}

const TIMER_SECONDS = 30;

export const QuizInteractif: React.FC<QuizInteractifProps> = ({ data }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [timerActive, setTimerActive] = useState(true);
  const [answers, setAnswers] = useState<Array<{ selected: string | null; correct: boolean }>>([]);
  const [showExplanation, setShowExplanation] = useState(false);

  const questions = data.questions || [];
  const currentQuestion = questions[currentIndex];
  const total = questions.length;

  const handleTimeout = useCallback(() => {
    if (selectedOption !== null) return;
    setSelectedOption("__timeout__");
    setTimerActive(false);
    setShowExplanation(true);
    setAnswers((prev) => [...prev, { selected: null, correct: false }]);
  }, [selectedOption]);

  // Timer
  useEffect(() => {
    if (!timerActive || finished) return;
    if (timeLeft <= 0) {
      handleTimeout();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [timeLeft, timerActive, finished, handleTimeout]);

  const handleSelect = (optionLetter: string) => {
    if (selectedOption !== null) return;
    setSelectedOption(optionLetter);
    setTimerActive(false);
    setShowExplanation(true);
    const isCorrect = optionLetter === currentQuestion.bonne_reponse;
    if (isCorrect) setScore((s) => s + 1);
    setAnswers((prev) => [...prev, { selected: optionLetter, correct: isCorrect }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= total) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setShowExplanation(false);
      setTimeLeft(TIMER_SECONDS);
      setTimerActive(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setScore(0);
    setFinished(false);
    setTimeLeft(TIMER_SECONDS);
    setTimerActive(true);
    setAnswers([]);
    setShowExplanation(false);
  };

  const getOptionLetter = (option: string) => option.charAt(0).toUpperCase();

  const getOptionStyle = (letter: string) => {
    if (selectedOption === null) {
      return "border-border hover:border-orange-400 hover:bg-orange-500/5 cursor-pointer";
    }
    const correct = letter === currentQuestion.bonne_reponse;
    const chosen = letter === selectedOption;
    if (correct) return "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400";
    if (chosen && !correct) return "border-red-500 bg-red-500/10 text-red-700 dark:text-red-400";
    return "border-border opacity-50 cursor-default";
  };

  const timerPercent = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor =
    timeLeft > 15 ? "bg-orange-500" : timeLeft > 7 ? "bg-yellow-500" : "bg-red-500";

  // ---- ÉCRAN RÉSULTAT FINAL ----
  if (finished) {
    const pct = Math.round((score / total) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "💪";
    return (
      <div className="space-y-5">
        {/* Score */}
        <div className="text-center py-4">
          <div className="text-5xl mb-2">{emoji}</div>
          <p className="text-2xl font-bold text-foreground">
            {score} <span className="text-muted-foreground font-normal text-lg">/ {total}</span>
          </p>
          <p className="text-muted-foreground text-sm mt-1">{pct}% de réussite</p>
          <Progress value={pct} className="mt-3 h-2" />
        </div>

        {/* Récapitulatif par question */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm text-foreground">Récapitulatif</h3>
          {answers.map((ans, i) => (
            <div
              key={i}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 border text-sm",
                ans.correct
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
              )}
            >
              {ans.correct ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
              )}
              <span className="text-muted-foreground line-clamp-1 flex-1">
                Q{i + 1}. {questions[i]?.question}
              </span>
              {!ans.correct && (
                <Badge variant="outline" className="text-[10px] border-green-500/40 text-green-600 dark:text-green-400 flex-shrink-0">
                  {questions[i]?.bonne_reponse}
                </Badge>
              )}
            </div>
          ))}
        </div>

        <Button onClick={handleRestart} className="w-full gap-2 campus-gradient text-white">
          <RotateCcw className="h-4 w-4" />
          Recommencer
        </Button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  // ---- QUESTION EN COURS ----
  return (
    <div className="space-y-4">
      {/* Header : progression + score */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground font-medium">
          Question <span className="text-foreground">{currentIndex + 1}</span> / {total}
        </span>
        <Badge variant="secondary" className="gap-1">
          <Trophy className="h-3 w-3 text-orange-500" />
          {score} point{score > 1 ? "s" : ""}
        </Badge>
      </div>

      {/* Barre de progression générale */}
      <Progress value={((currentIndex) / total) * 100} className="h-1.5" />

      {/* Timer */}
      <div className="flex items-center gap-2">
        <Timer className={cn("h-4 w-4 flex-shrink-0", timeLeft <= 7 ? "text-red-500 animate-pulse" : "text-muted-foreground")} />
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-1000", timerColor)}
            style={{ width: `${timerPercent}%` }}
          />
        </div>
        <span className={cn("text-xs font-mono w-6 text-right", timeLeft <= 7 ? "text-red-500 font-bold" : "text-muted-foreground")}>
          {timeLeft}s
        </span>
      </div>

      {/* Question */}
      <div className="bg-muted/30 border border-border rounded-xl p-4">
        <p className="font-medium text-foreground leading-relaxed">{currentQuestion.question}</p>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {currentQuestion.options.map((option) => {
          const letter = getOptionLetter(option);
          return (
            <button
              key={letter}
              onClick={() => handleSelect(letter)}
              className={cn(
                "w-full text-left flex items-start gap-3 border rounded-xl px-4 py-3 text-sm transition-all duration-200",
                getOptionStyle(letter)
              )}
              disabled={selectedOption !== null}
            >
              <span className="flex-shrink-0 h-6 w-6 rounded-full bg-background border border-current flex items-center justify-center text-xs font-bold">
                {letter}
              </span>
              <span className="leading-relaxed pt-0.5">{option.slice(3)}</span>
              {selectedOption !== null && letter === currentQuestion.bonne_reponse && (
                <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 ml-auto mt-0.5" />
              )}
              {selectedOption === letter && letter !== currentQuestion.bonne_reponse && (
                <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 ml-auto mt-0.5" />
              )}
            </button>
          );
        })}
      </div>

      {/* Timeout feedback */}
      {selectedOption === "__timeout__" && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-2 text-sm text-yellow-700 dark:text-yellow-400">
          ⏰ Temps écoulé ! La bonne réponse était : <strong>{currentQuestion.bonne_reponse}</strong>
        </div>
      )}

      {/* Explication */}
      {showExplanation && selectedOption !== "__timeout__" && (
        <div
          className={cn(
            "border rounded-xl px-4 py-3 text-sm leading-relaxed",
            selectedOption === currentQuestion.bonne_reponse
              ? "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300"
              : "bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300"
          )}
        >
          <p className="font-semibold mb-1">
            {selectedOption === currentQuestion.bonne_reponse ? "✅ Correct !" : "❌ Incorrect"}
          </p>
          <p className="text-current/80">{currentQuestion.explication}</p>
        </div>
      )}

      {/* Bouton suivant */}
      {selectedOption !== null && (
        <Button
          onClick={handleNext}
          className="w-full gap-2 campus-gradient text-white"
        >
          {currentIndex + 1 >= total ? (
            <>
              <Trophy className="h-4 w-4" /> Voir mon score
            </>
          ) : (
            <>
              Question suivante <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};

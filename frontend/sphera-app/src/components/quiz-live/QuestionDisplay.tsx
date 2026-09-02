import React from 'react';

interface QuestionDisplayProps {
  question: string;
  options: string[];
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: number | null;
  correctIndex: number | null;
  onAnswer?: (index: number) => void;
  isHost?: boolean;
}

export function QuestionDisplay({
  question,
  options,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  correctIndex,
  onAnswer,
  isHost = false
}: QuestionDisplayProps) {
  
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-yellow-500',
    'bg-green-500'
  ];

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
      <div className="text-center">
        <span className="text-sphera-text-muted text-sm font-medium uppercase tracking-wider">
          Question {questionIndex + 1} / {totalQuestions}
        </span>
      </div>
      
      <div className="bg-sphera-surface-2 border border-sphera-border rounded-2xl p-8 text-center shadow-lg">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-white">
          {question}
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {options.map((opt, i) => {
          const isSelected = selectedAnswer === i;
          const isCorrect = correctIndex === i;
          const isWrong = correctIndex !== null && selectedAnswer === i && correctIndex !== i;
          
          let containerClass = "relative overflow-hidden rounded-xl border p-4 sm:p-6 transition-all text-left flex items-center min-h-[80px]";
          let textClass = "text-white font-medium sm:text-lg z-10 ml-4";
          
          if (correctIndex !== null) {
            // Results mode
            if (isCorrect) {
              containerClass += " bg-sphera-green border-sphera-green scale-105 shadow-[0_0_20px_rgba(34,197,94,0.3)]";
              textClass = "text-black font-bold z-10 ml-4";
            } else if (isWrong) {
              containerClass += " bg-red-900/50 border-red-500 opacity-80";
            } else {
              containerClass += " bg-sphera-surface border-sphera-border opacity-50";
            }
          } else {
            // Selection mode
            if (isSelected) {
              containerClass += " bg-sphera-surface border-sphera-green scale-[1.02] shadow-[0_0_15px_rgba(34,197,94,0.15)]";
            } else {
              containerClass += " bg-sphera-surface border-sphera-border hover:border-sphera-text-muted hover:bg-sphera-surface-2 cursor-pointer";
            }
          }

          if (isHost || (selectedAnswer !== null && correctIndex === null)) {
            containerClass = containerClass.replace('cursor-pointer', '');
            containerClass = containerClass.replace('hover:border-sphera-text-muted hover:bg-sphera-surface-2', '');
          }

          const handleClick = () => {
            if (!isHost && selectedAnswer === null && correctIndex === null && onAnswer) {
              onAnswer(i);
            }
          };

          return (
            <button
              key={i}
              onClick={handleClick}
              disabled={isHost || selectedAnswer !== null || correctIndex !== null}
              className={containerClass}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-3 ${colors[i % colors.length]}`} />
              <span className={textClass}>{opt}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

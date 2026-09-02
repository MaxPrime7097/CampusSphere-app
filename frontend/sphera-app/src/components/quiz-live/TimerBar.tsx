import React, { useState, useEffect } from 'react';

interface TimerBarProps {
  duration: number;
  onExpire?: () => void;
}

export function TimerBar({ duration, onExpire }: TimerBarProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    setTimeLeft(duration);
  }, [duration]);

  useEffect(() => {
    if (timeLeft <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timerId = setTimeout(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timerId);
  }, [timeLeft, onExpire]);

  const percentage = duration > 0 ? (timeLeft / duration) * 100 : 0;
  
  let colorClass = 'bg-sphera-green';
  if (timeLeft <= 3) {
    colorClass = 'bg-red-500';
  } else if (timeLeft <= duration * 0.3) {
    colorClass = 'bg-orange-500';
  }

  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-sphera-text-muted mb-1 font-medium">
        <span>Temps restant</span>
        <span className={timeLeft <= 3 ? 'text-red-500 font-bold' : ''}>{timeLeft}s</span>
      </div>
      <div className="h-2 w-full bg-sphera-surface-2 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-1000 ease-linear rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

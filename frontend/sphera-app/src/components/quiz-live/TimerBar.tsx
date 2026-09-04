import React, { useState, useEffect } from 'react';
import { playSound } from '../../utils/audioManager';

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
      setTimeLeft(prev => {
        if (prev <= 4 && prev > 1) { // Will become 3, 2, 1
          playSound('tick');
        }
        return prev - 1;
      });
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
      <div className="flex justify-between items-center text-sm text-sphera-text-muted mb-2 font-medium">
        <span>Temps restant</span>
        <span className={`font-mono text-2xl font-bold ${timeLeft <= 3 ? 'text-red-500 animate-pulse' : timeLeft <= duration * 0.3 ? 'text-orange-500' : 'text-sphera-green'}`}>{timeLeft}s</span>
      </div>
      <div className="h-4 w-full bg-sphera-surface-2 rounded-full overflow-hidden">
        <div 
          className={`h-full ${colorClass} transition-all duration-1000 ease-linear rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

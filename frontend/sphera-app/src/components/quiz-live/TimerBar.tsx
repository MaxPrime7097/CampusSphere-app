import React, { useState, useEffect } from 'react';
import { playSound } from '../../utils/audioManager';

interface TimerBarProps {
  duration: number;
  onExpire?: () => void;
}

export function TimerBar({ duration, onExpire }: TimerBarProps) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const startTime = Date.now();
    let rAF: number;
    let tickedSeconds = new Set<number>();

    const updateTimer = () => {
      const elapsed = (Date.now() - startTime) / 1000;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      const currentSecond = Math.ceil(remaining);
      if (currentSecond <= 3 && currentSecond > 0 && !tickedSeconds.has(currentSecond)) {
        tickedSeconds.add(currentSecond);
        playSound('tick');
      }

      if (remaining > 0) {
        rAF = requestAnimationFrame(updateTimer);
      } else {
        if (onExpire) onExpire();
      }
    };

    rAF = requestAnimationFrame(updateTimer);

    return () => cancelAnimationFrame(rAF);
  }, [duration, onExpire]);

  const percentage = duration > 0 ? (timeLeft / duration) * 100 : 0;
  
  let colorClass = 'bg-sphera-green';
  if (timeLeft <= 3) {
    colorClass = 'bg-red-500';
  } else if (timeLeft <= duration * 0.3) {
    colorClass = 'bg-orange-500';
  }

  const displayTime = Math.ceil(timeLeft);

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-sm text-sphera-text-muted mb-2 font-medium">
        <span>Temps restant</span>
        <span className={`font-mono text-2xl font-bold ${displayTime <= 3 ? 'text-red-500 animate-pulse' : displayTime <= duration * 0.3 ? 'text-orange-500' : 'text-sphera-green'}`}>{displayTime}s</span>
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

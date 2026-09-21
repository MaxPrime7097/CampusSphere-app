import React, { useState, useEffect, useRef } from 'react';
import { playSound } from '../../utils/audioManager';

interface TimerBarProps {
  duration: number;
  onExpire?: () => void;
}

export function TimerBar({ duration, onExpire }: TimerBarProps) {
  const [secondsLeft, setSecondsLeft] = useState(duration);
  const barRef = useRef<HTMLDivElement>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const startTime = Date.now();
    const totalMs = Math.max(1, duration * 1000);
    let rAF: number;
    let lastSecond = duration;
    const tickedSeconds = new Set<number>();

    const updateTimer = () => {
      const elapsed = Date.now() - startTime;
      const remainingMs = Math.max(0, totalMs - elapsed);
      const remainingFraction = remainingMs / totalMs;
      const currentSec = Math.ceil(remainingMs / 1000);

      // Direct DOM update at 60fps: continuous smooth progress with zero CSS transition interference
      if (barRef.current) {
        barRef.current.style.width = `${(remainingFraction * 100).toFixed(2)}%`;
      }

      // Update seconds counter once per second to avoid unnecessary React re-renders
      if (currentSec !== lastSecond) {
        lastSecond = currentSec;
        setSecondsLeft(currentSec);

        if (currentSec <= 3 && currentSec > 0 && !tickedSeconds.has(currentSec)) {
          tickedSeconds.add(currentSec);
          playSound('tick');
        }
      }

      if (remainingMs > 0) {
        rAF = requestAnimationFrame(updateTimer);
      } else {
        if (barRef.current) {
          barRef.current.style.width = '0%';
        }
        setSecondsLeft(0);
        if (onExpireRef.current) {
          onExpireRef.current();
        }
      }
    };

    // Ensure bar starts at full width
    if (barRef.current) {
      barRef.current.style.width = '100%';
    }
    setSecondsLeft(duration);

    rAF = requestAnimationFrame(updateTimer);

    return () => cancelAnimationFrame(rAF);
  }, [duration]);

  let colorClass = 'bg-sphera-green';
  if (secondsLeft <= 3) {
    colorClass = 'bg-red-500';
  } else if (secondsLeft <= duration * 0.3) {
    colorClass = 'bg-orange-500';
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-sm text-sphera-text-muted mb-2 font-medium">
        <span>Temps restant</span>
        <span className={`font-mono text-2xl font-bold transition-colors duration-300 ${
          secondsLeft <= 3 
            ? 'text-red-500 animate-pulse' 
            : secondsLeft <= duration * 0.3 
              ? 'text-orange-500' 
              : 'text-sphera-green'
        }`}>
          {secondsLeft}s
        </span>
      </div>
      <div className="h-4 w-full bg-sphera-surface-2 rounded-full overflow-hidden p-0.5 border border-sphera-border/50">
        <div 
          ref={barRef}
          className={`h-full ${colorClass} transition-colors duration-500 rounded-full`}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}

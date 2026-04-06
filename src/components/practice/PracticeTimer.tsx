'use client';

import { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';

interface PracticeTimerProps {
  onTimeUpdate?: (seconds: number) => void;
  initialTime?: number;
  autoStart?: boolean;
}

export function PracticeTimer({ onTimeUpdate, initialTime = 0, autoStart = false }: PracticeTimerProps) {
  const [seconds, setSeconds] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const newSeconds = prev + 1;
          onTimeUpdate?.(newSeconds);
          return newSeconds;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, onTimeUpdate]);

  const formatTime = useCallback((totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(0);
    onTimeUpdate?.(0);
  };

  return (
    <div className="practice-timer bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
      <div className="timer-display text-center mb-4">
        <div className={`text-5xl font-bold font-mono ${isRunning ? 'text-emerald-600' : 'text-slate-700'}`}>
          {formatTime(seconds)}
        </div>
        <div className="text-sm text-slate-500 mt-1">
          {isRunning ? 'Praticando...' : 'Pausado'}
        </div>
      </div>
      
      <div className="timer-controls flex justify-center items-center gap-3">
        <button
          onClick={toggleTimer}
          className={`flex items-center justify-center w-14 h-14 rounded-full transition-all hover:scale-105 ${
            isRunning 
              ? 'bg-amber-500 hover:bg-amber-600 text-white' 
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {isRunning ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
        </button>
        
        <button
          onClick={resetTimer}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all"
          title="Reiniciar"
        >
          <RotateCcw size={18} />
        </button>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Gauge } from 'lucide-react';

interface AutoscrollProps {
  targetRef: React.RefObject<HTMLElement | null>;
}

type SpeedLevel = 1 | 1.5 | 2;

const SPEED_MAP: Record<SpeedLevel, number> = {
  1: 30,    // pixels por segundo (lento)
  1.5: 50,  // médio
  2: 80     // rápido
};

export const Autoscroll = ({ targetRef }: AutoscrollProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<SpeedLevel>(1);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const scroll = useCallback((timestamp: number) => {
    if (!targetRef.current) return;
    
    const element = targetRef.current;
    const maxScroll = element.scrollHeight - element.clientHeight;
    
    if (maxScroll <= 0) {
      setIsPlaying(false);
      return;
    }

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const deltaTime = (timestamp - lastTimeRef.current) / 1000; // segundos
    lastTimeRef.current = timestamp;

    const scrollAmount = SPEED_MAP[speed] * deltaTime;
    const newScrollTop = element.scrollTop + scrollAmount;

    if (newScrollTop >= maxScroll) {
      element.scrollTop = maxScroll;
      setProgress(100);
      setIsPlaying(false);
      lastTimeRef.current = 0;
      return;
    }

    element.scrollTop = newScrollTop;
    setProgress((newScrollTop / maxScroll) * 100);
    
    animationRef.current = requestAnimationFrame(scroll);
  }, [speed, targetRef]);

  useEffect(() => {
    if (isPlaying) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(scroll);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      lastTimeRef.current = 0;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, scroll]);

  // Atualiza progresso quando scrolla manualmente
  useEffect(() => {
    const element = targetRef.current;
    if (!element) return;

    const handleScroll = () => {
      const maxScroll = element.scrollHeight - element.clientHeight;
      if (maxScroll > 0) {
        setProgress((element.scrollTop / maxScroll) * 100);
      }
    };

    element.addEventListener('scroll', handleScroll);
    return () => element.removeEventListener('scroll', handleScroll);
  }, [targetRef]);

  const togglePlay = () => {
    if (progress >= 100) {
      // Reinicia do início se chegou ao fim
      if (targetRef.current) {
        targetRef.current.scrollTop = 0;
        setProgress(0);
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleSpeedChange = (newSpeed: SpeedLevel) => {
    setSpeed(newSpeed);
  };

  const formatTime = () => {
    const element = targetRef.current;
    if (!element) return '0:00';
    
    const maxScroll = element.scrollHeight - element.clientHeight;
    const remaining = maxScroll - element.scrollTop;
    const seconds = remaining / SPEED_MAP[speed];
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="autoscroll-panel bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="autoscroll-header flex justify-between items-center mb-4">
        <h3 className="panel-title flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 m-0">
          <Gauge size={16} />
          Autoscroll
        </h3>
        <span className="time-remaining text-xs text-slate-400 dark:text-slate-500 font-mono">{formatTime()}</span>
      </div>

      <div className="autoscroll-controls flex items-center gap-4 mb-4">
        <button 
          className={`play-btn flex items-center justify-center w-11 h-11 rounded-full transition-all hover:scale-105 ${isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white shadow-lg`}
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pausar' : 'Iniciar'}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>

        <div className="speed-control flex flex-col gap-2 flex-1">
          <span className="speed-label text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">Velocidade:</span>
          <div className="speed-buttons flex gap-1">
            {[1, 1.5, 2].map((s) => (
              <button
                key={s}
                className={`speed-btn flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${speed === s ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                onClick={() => handleSpeedChange(s as SpeedLevel)}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="progress-bar-container flex items-center gap-3">
        <div className="progress-bar flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div 
            className="progress-fill h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="progress-text text-xs text-slate-500 dark:text-slate-400 font-mono min-w-[2.5rem] text-right">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

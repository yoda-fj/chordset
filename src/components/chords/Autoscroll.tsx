'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Gauge } from 'lucide-react';

interface AutoscrollProps {
  targetRef: React.RefObject<HTMLElement | null>;
}

type SpeedLevel = 0 | 1 | 2 | 3 | 4 | 5;

const SPEED_MAP: Record<SpeedLevel, number> = {
  0: 0,    // off
  1: 15,   // muito lento
  2: 30,   // lento
  3: 60,   // médio
  4: 100,  // rápido
  5: 150   // muito rápido
};

export const Autoscroll = ({ targetRef }: AutoscrollProps) => {
  const [speed, setSpeed] = useState<SpeedLevel>(0);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const scroll = useCallback((timestamp: number) => {
    if (!targetRef.current || speed === 0) return;
    
    const element = targetRef.current;
    const maxScroll = element.scrollHeight - element.clientHeight;
    
    if (maxScroll <= 0) return;

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const deltaTime = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const scrollAmount = SPEED_MAP[speed] * deltaTime;
    const newScrollTop = Math.min(element.scrollTop + scrollAmount, maxScroll);

    element.scrollTop = newScrollTop;
    setProgress((newScrollTop / maxScroll) * 100);
    
    if (newScrollTop < maxScroll && speed > 0) {
      animationRef.current = requestAnimationFrame(scroll);
    } else {
      // Chegou no fim ou velocidade foi mudada pra 0
      setSpeed(0);
      lastTimeRef.current = 0;
    }
  }, [speed, targetRef]);

  useEffect(() => {
    if (speed > 0) {
      lastTimeRef.current = 0;
      animationRef.current = requestAnimationFrame(scroll);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [speed, scroll]);

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

    element.addEventListener('scroll', handleScroll, { passive: true });
    return () => element.removeEventListener('scroll', handleScroll);
  }, [targetRef]);

  const cycleSpeed = () => {
    const newSpeed = ((speed + 1) % 6) as SpeedLevel;
    setSpeed(newSpeed);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className={`p-2 rounded-lg transition-all ${speed > 0 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        onClick={cycleSpeed}
        title={speed === 0 ? 'Auto-scroll: Off' : `Auto-scroll: ${speed}/5`}
      >
        {speed === 0 ? <Gauge size={18} /> : <Play size={16} className={speed >= 4 ? 'fill-current' : ''} />}
      </button>

      <div className="flex-1 flex items-center gap-2">
        <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 w-8">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

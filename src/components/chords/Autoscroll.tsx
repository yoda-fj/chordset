'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Gauge } from 'lucide-react';

interface AutoscrollProps {
  targetRef: React.RefObject<HTMLElement | null>;
  bpm?: number;
}

type SpeedLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// 8 níveis: a faixa lenta é bem mais densa (3-15 px/s) porque a queixa
// mais comum no palco é "mesmo o mais lento passa rápido demais".
const SPEED_MAP: Record<SpeedLevel, number> = {
  0: 0,    // off
  1: 3,    // rastejante
  2: 6,    // ultra lento
  3: 10,   // muito lento
  4: 15,   // lento
  5: 30,   // médio
  6: 60,   // rápido
  7: 120   // muito rápido
};

// Em modo BPM (bpm informado): px/s = px por batida × bpm/60.
// A 120 BPM os níveis dão ~4/8/14/20/40/80/120 px/s.
const BPM_PX_PER_BEAT: Record<SpeedLevel, number> = {
  0: 0, 1: 2, 2: 4, 3: 7, 4: 10, 5: 20, 6: 40, 7: 60
};

export const Autoscroll = ({ targetRef, bpm }: AutoscrollProps) => {
  const [speed, setSpeed] = useState<SpeedLevel>(0);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  const pxPerSecond = useCallback((level: SpeedLevel): number =>
    bpm && bpm > 0 ? (BPM_PX_PER_BEAT[level] * bpm) / 60 : SPEED_MAP[level], [bpm]);

  const scroll = useCallback(function tick(timestamp: number) {
    if (speed === 0) return;
    
    const element = targetRef.current;
    
    if (!element) {
      // Fallback: scroll the window if no target element
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      const scrollAmount = pxPerSecond(speed) * deltaTime;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const newScrollTop = Math.min(window.scrollY + scrollAmount, maxScroll);
      window.scrollTo(0, newScrollTop);
      setProgress((newScrollTop / maxScroll) * 100);
      
      if (newScrollTop < maxScroll && speed > 0) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        setSpeed(0);
        lastTimeRef.current = 0;
      }
      return;
    }
    
    const maxScroll = element.scrollHeight - element.clientHeight;
    
    if (maxScroll <= 0) {
      // Element has no scroll, try window scroll as fallback
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      const scrollAmount = pxPerSecond(speed) * deltaTime;
      const windowMaxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const newScrollTop = Math.min(window.scrollY + scrollAmount, windowMaxScroll);
      window.scrollTo(0, newScrollTop);
      setProgress((newScrollTop / windowMaxScroll) * 100);
      
      if (newScrollTop < windowMaxScroll && speed > 0) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        setSpeed(0);
        lastTimeRef.current = 0;
      }
      return;
    }

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const deltaTime = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const scrollAmount = pxPerSecond(speed) * deltaTime;
    const newScrollTop = Math.min(element.scrollTop + scrollAmount, maxScroll);

    element.scrollTop = newScrollTop;
    setProgress((newScrollTop / maxScroll) * 100);

    if (newScrollTop < maxScroll && speed > 0) {
      animationRef.current = requestAnimationFrame(tick);
    } else {
      // Chegou no fim ou velocidade foi mudada pra 0
      setSpeed(0);
      lastTimeRef.current = 0;
    }
  }, [speed, pxPerSecond, targetRef]);

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
    
    const handleElementScroll = () => {
      if (!element) return;
      const maxScroll = element.scrollHeight - element.clientHeight;
      if (maxScroll > 0) {
        setProgress((element.scrollTop / maxScroll) * 100);
      }
    };
    
    const handleWindowScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll > 0) {
        setProgress((window.scrollY / maxScroll) * 100);
      }
    };

    if (element) {
      element.addEventListener('scroll', handleElementScroll, { passive: true });
    }
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    
    return () => {
      if (element) {
        element.removeEventListener('scroll', handleElementScroll);
      }
      window.removeEventListener('scroll', handleWindowScroll);
    };
  }, [targetRef]);

  const cycleSpeed = () => {
    const newSpeed = ((speed + 1) % 8) as SpeedLevel;
    setSpeed(newSpeed);
  };

  const SPEED_LABELS: Record<SpeedLevel, string> = {
    0: 'desligado',
    1: 'rastejante',
    2: 'ultra lento',
    3: 'muito lento',
    4: 'lento',
    5: 'médio',
    6: 'rápido',
    7: 'muito rápido',
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${speed > 0 ? 'bg-success text-on-accent' : 'text-ink-muted hover:bg-surface-overlay hover:text-ink'}`}
        onClick={cycleSpeed}
        aria-label={`Auto-scroll: ${SPEED_LABELS[speed]}. Toque para mudar a velocidade.`}
        title={`Auto-scroll: ${SPEED_LABELS[speed]}`}
        aria-pressed={speed > 0}
      >
        {speed === 0 ? <Gauge size={20} aria-hidden /> : <Play size={18} className={speed >= 6 ? 'fill-current' : ''} aria-hidden />}
      </button>

      {/* Feedback visível da velocidade ativa (o aria-label sozinho não é visto) */}
      <span
        aria-hidden
        className={`text-xs font-medium rounded-full px-2 py-1 transition-colors whitespace-nowrap ${
          speed > 0
            ? 'bg-success/15 text-success'
            : 'bg-transparent text-ink-faint'
        }`}
      >
        {speed > 0 ? SPEED_LABELS[speed] : 'parado'}
      </span>

      <div className="flex-1 flex items-center gap-2">
        <div
          className="flex-1 h-1 bg-surface-overlay rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso da música"
        >
          <div
            className="h-full bg-success rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-ink-faint w-8">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

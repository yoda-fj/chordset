'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';

interface AutoscrollProps {
  targetRef: React.RefObject<HTMLElement | null>;
  bpm?: number;
}

// Slider com escala exponencial: os primeiros passos cobrem a faixa lenta
// com granularidade fina, e a faixa rápida fica compacta no fim.
export const MIN_PX = 3;
export const MAX_PX = 150;
// Modo BPM: o slider mede px por batida; px/s = px/batida × bpm/60.
export const MIN_PX_PER_BEAT = 1;
export const MAX_PX_PER_BEAT = 60;
const STEPS = 30;

/** Converte o passo do slider (0 = desligado, 1..STEPS) em px/s (sem BPM). */
export function sliderToPx(step: number): number {
  if (step <= 0) return 0;
  const t = (Math.min(step, STEPS) - 1) / (STEPS - 1); // 0..1
  return MIN_PX * Math.pow(MAX_PX / MIN_PX, t);
}

/** Converte o passo do slider em px por batida (modo BPM). */
export function sliderToPxPerBeat(step: number): number {
  if (step <= 0) return 0;
  const t = (Math.min(step, STEPS) - 1) / (STEPS - 1); // 0..1
  return MIN_PX_PER_BEAT * Math.pow(MAX_PX_PER_BEAT / MIN_PX_PER_BEAT, t);
}

/** Rótulo qualitativo só pra referência — o valor em px/s é o que manda. */
function speedLabel(pxPerSecond: number): string {
  if (pxPerSecond <= 0) return 'parado';
  if (pxPerSecond < 4) return 'rastejante';
  if (pxPerSecond < 8) return 'ultra lento';
  if (pxPerSecond < 15) return 'lento';
  if (pxPerSecond < 35) return 'médio';
  if (pxPerSecond < 80) return 'rápido';
  return 'muito rápido';
}

export const Autoscroll = ({ targetRef, bpm }: AutoscrollProps) => {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [mode, setMode] = useState<'px' | 'beat'>(bpm && bpm > 0 ? 'beat' : 'px');
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastStepRef = useRef(8); // retomar neste nível ao religar

  // A música mudou (ou carregou): usa BPM como referência quando existe
  useEffect(() => {
    setMode(bpm && bpm > 0 ? 'beat' : 'px');
  }, [bpm]);

  // px/s efetivo: modo 'beat' (com BPM) mede px por batida; 'px' é fixo.
  const pxPerSecond = useCallback(
    (s: number): number => {
      if (mode === 'beat' && bpm && bpm > 0) return (sliderToPxPerBeat(s) * bpm) / 60;
      return sliderToPx(s);
    },
    [mode, bpm]
  );

  const pxPerBeat = bpm && bpm > 0 ? sliderToPxPerBeat(step) : 0;
  const beatModeActive = mode === 'beat' && bpm && bpm > 0;

  const scroll = useCallback(function tick(timestamp: number) {
    if (step === 0) return;

    const element = targetRef.current;

    if (!element) {
      // Fallback: scroll the window if no target element
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      const scrollAmount = pxPerSecond(step) * deltaTime;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const newScrollTop = Math.min(window.scrollY + scrollAmount, maxScroll);
      window.scrollTo(0, newScrollTop);
      setProgress((newScrollTop / maxScroll) * 100);

      if (newScrollTop < maxScroll && step > 0) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        setStep(0);
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
      const scrollAmount = pxPerSecond(step) * deltaTime;
      const windowMaxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const newScrollTop = Math.min(window.scrollY + scrollAmount, windowMaxScroll);
      window.scrollTo(0, newScrollTop);
      setProgress((newScrollTop / windowMaxScroll) * 100);

      if (newScrollTop < windowMaxScroll && step > 0) {
        animationRef.current = requestAnimationFrame(tick);
      } else {
        setStep(0);
        lastTimeRef.current = 0;
      }
      return;
    }

    if (lastTimeRef.current === 0) {
      lastTimeRef.current = timestamp;
    }

    const deltaTime = (timestamp - lastTimeRef.current) / 1000;
    lastTimeRef.current = timestamp;

    const scrollAmount = pxPerSecond(step) * deltaTime;
    const newScrollTop = Math.min(element.scrollTop + scrollAmount, maxScroll);

    element.scrollTop = newScrollTop;
    setProgress((newScrollTop / maxScroll) * 100);

    if (newScrollTop < maxScroll && step > 0) {
      animationRef.current = requestAnimationFrame(tick);
    } else {
      // Chegou no fim ou velocidade foi mudada pra 0
      setStep(0);
      lastTimeRef.current = 0;
    }
  }, [step, pxPerSecond, targetRef]);

  useEffect(() => {
    if (step > 0) {
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
  }, [step, scroll]);

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

  const toggle = () => {
    if (step > 0) {
      lastStepRef.current = step;
      setStep(0);
    } else {
      setStep(lastStepRef.current);
    }
  };

  const handleSlider = (value: number) => {
    if (value > 0) lastStepRef.current = value;
    setStep(value);
  };

  const currentPx = pxPerSecond(step);

  return (
    <div className="flex flex-col gap-2 flex-1 min-w-[260px]">
      <div className="flex items-center gap-2">
        <button
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg transition-colors ${step > 0 ? 'bg-success text-on-accent' : 'text-ink-muted hover:bg-surface-overlay hover:text-ink'}`}
          onClick={toggle}
          aria-label={step > 0 ? 'Pausar auto-scroll' : 'Iniciar auto-scroll'}
          title={step > 0 ? 'Pausar auto-scroll' : 'Iniciar auto-scroll'}
          aria-pressed={step > 0}
        >
          {step === 0 ? <Play size={20} aria-hidden /> : <Pause size={20} aria-hidden />}
        </button>

        <input
          type="range"
          min={0}
          max={STEPS}
          step={1}
          value={step}
          onChange={(e) => handleSlider(Number(e.target.value))}
          className="flex-1 accent-success h-1.5 cursor-pointer"
          aria-label="Velocidade do auto-scroll"
          aria-valuetext={
            beatModeActive
              ? `${Math.round(pxPerBeat)} pixels por batida (${Math.round(currentPx)} pixels por segundo)`
              : `${Math.round(currentPx)} pixels por segundo (${speedLabel(currentPx)})`
          }
        />

        <span
          aria-hidden
          className={`text-xs font-medium rounded-full px-2 py-1 transition-colors whitespace-nowrap w-24 text-center ${
            step > 0 ? 'bg-success/15 text-success' : 'bg-transparent text-ink-faint'
          }`}
        >
          {step > 0
            ? beatModeActive
              ? `${Math.round(pxPerBeat)} px/bat`
              : `${Math.round(currentPx)} px/s`
            : 'parado'}
        </span>
      </div>

      {/* Seletor de referência: px/s fixo ou pixels por batida (só com BPM) */}
      <div className="flex items-center gap-2 pl-14">
        <div
          className="flex rounded-lg overflow-hidden border border-ink/10 text-xs"
        >
          <button
            type="button"
            onClick={() => setMode('px')}
            aria-pressed={!beatModeActive}
            title="Velocidade fixa em pixels por segundo"
            className={`px-2 py-1 transition-colors ${!beatModeActive ? 'bg-success text-on-accent' : 'text-ink-muted hover:bg-surface-overlay'}`}
          >
            px/s
          </button>
          <button
            type="button"
            onClick={() => setMode('beat')}
            disabled={!(bpm && bpm > 0)}
            aria-pressed={beatModeActive === true}
            title={bpm && bpm > 0 ? `Baseado no BPM da música (${bpm})` : 'Música sem BPM — indisponível'}
            className={`px-2 py-1 transition-colors ${beatModeActive ? 'bg-success text-on-accent' : 'text-ink-muted hover:bg-surface-overlay'} disabled:opacity-40 disabled:pointer-events-none`}
          >
            por batida
          </button>
        </div>
        {beatModeActive && bpm && (
          <span className="text-xs text-ink-faint">BPM {bpm} · {Math.round(currentPx)} px/s efetivo</span>
        )}
      </div>

      <div className="flex items-center gap-2">
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

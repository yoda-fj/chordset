'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { Play, Pause, Minus, Plus } from 'lucide-react';

interface MetronomeProps {
  defaultBpm?: number;
  compact?: boolean;
}

const BPM_MIN = 40;
const BPM_MAX = 220;
const TAP_RESET_MS = 2000; // gap maior que isso zera a sequência de taps

/**
 * Metrônomo visual (Fase 2.4): flash sincronizado ao Tone.Transport
 * (via Tone.Draw, que alinha o frame ao tick de áudio) + tap-tempo.
 * Pulso visível mesmo sem áudio.
 */
export const Metronome = ({ defaultBpm = 100 }: MetronomeProps) => {
  const [bpm, setBpm] = useState(defaultBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [beat, setBeat] = useState(0); // incrementa a cada pulso → retrigger do flash
  const synthRef = useRef<Tone.MembraneSynth | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    synthRef.current = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 2,
      oscillator: { type: 'sine' },
      envelope: {
        attack: 0.001,
        decay: 0.1,
        sustain: 0,
        release: 0.1
      }
    }).toDestination();

    return () => {
      loopRef.current?.dispose();
      synthRef.current?.dispose();
    };
  }, []);

  // BPM muda em tempo real, mesmo tocando
  useEffect(() => {
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const togglePlay = async () => {
    if (isPlaying) {
      Tone.Transport.stop();
      loopRef.current?.stop();
      setIsPlaying(false);
    } else {
      await Tone.start();

      if (!loopRef.current) {
        loopRef.current = new Tone.Loop((time) => {
          synthRef.current?.triggerAttackRelease('C2', '32n', time);
          // Flash visual alinhado ao tick de áudio (não ao setState solto)
          Tone.Draw.schedule(() => setBeat((b) => b + 1), time);
        }, '4n').start(0);
      }

      Tone.Transport.bpm.value = bpm;
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.max(BPM_MIN, Math.min(BPM_MAX, prev + delta)));
  };

  // Tap-tempo: média dos últimos intervalos entre toques
  const handleTap = useCallback(() => {
    const now = performance.now();
    const taps = tapsRef.current;

    if (taps.length > 0 && now - taps[taps.length - 1] > TAP_RESET_MS) {
      taps.length = 0;
    }
    taps.push(now);
    if (taps.length > 5) taps.shift();

    if (taps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < taps.length; i++) {
        intervals.push(taps[i] - taps[i - 1]);
      }
      const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const newBpm = Math.round(60000 / avg);
      setBpm(Math.max(BPM_MIN, Math.min(BPM_MAX, newBpm)));
    }
    setBeat((b) => b + 1); // feedback visual do tap mesmo parado
  }, []);

  return (
    <div className="flex items-center gap-2 bg-surface-raised rounded-lg border border-ink/10 p-2">
      {/* Flash visual do pulso */}
      <div
        key={beat}
        aria-hidden
        className={`h-4 w-4 shrink-0 rounded-full ${isPlaying || beat > 0 ? 'animate-ping-once bg-brand' : 'bg-surface-overlay'}`}
      />

      <button
        className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${isPlaying ? 'bg-danger/15 text-danger' : 'bg-success/15 text-success hover:bg-success/25'}`}
        onClick={togglePlay}
        aria-label={isPlaying ? 'Parar metrônomo' : 'Iniciar metrônomo'}
        aria-pressed={isPlaying}
      >
        {isPlaying ? <Pause size={20} aria-hidden /> : <Play size={20} aria-hidden />}
      </button>

      <div className="flex items-center gap-1">
        <button
          className="flex h-12 w-12 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-overlay hover:text-ink transition-colors"
          onClick={() => adjustBpm(-5)}
          aria-label="Diminuir BPM"
        >
          <Minus size={18} aria-hidden />
        </button>
        <span className="text-sm font-medium text-ink w-14 text-center" aria-live="polite">
          {bpm} <span className="text-xs text-ink-faint">BPM</span>
        </span>
        <button
          className="flex h-12 w-12 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-overlay hover:text-ink transition-colors"
          onClick={() => adjustBpm(5)}
          aria-label="Aumentar BPM"
        >
          <Plus size={18} aria-hidden />
        </button>
      </div>

      <button
        className="flex h-12 items-center justify-center rounded-lg px-4 text-sm font-semibold text-brand border border-brand/30 hover:bg-brand/10 transition-colors active:scale-95"
        onClick={handleTap}
        aria-label="Tap-tempo: toque no ritmo para definir o BPM"
      >
        TAP
      </button>
    </div>
  );
};

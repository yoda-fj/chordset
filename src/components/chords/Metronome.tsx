'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { Play, Pause, Minus, Plus } from 'lucide-react';
import { BPM_MIN, BPM_MAX } from '@/lib/constants';

interface MetronomeProps {
  defaultBpm?: number;
  // Chamado quando o usuário edita o andamento (± ou tap-tempo).
  // O pai persiste na música — ritmo e scroll acompanham ao vivo.
  onBpmChange?: (bpm: number) => void;
  // Modo controlado (CifraViewer): o play/stop fica no pai, sincronizando
  // metrônomo e ritmo. Sem as props, gerencia o próprio estado.
  playing?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}

const TAP_RESET_MS = 2000; // gap maior que isso zera a sequência de taps

/**
 * Metrônomo visual (Fase 2.4): pulso agendado com setInterval + Tone.now()
 * (lookahead curto pra precisão de áudio) e flash via Tone.Draw, que alinha
 * o frame ao tempo de áudio. NÃO usa o Tone.Transport global de propósito:
 * ele é compartilhado com o DrumPad (que dá stop()/mexe no bpm), e o
 * metrônomo precisa continuar tocando independente dele. Inclui tap-tempo.
 * Pulso visível mesmo sem áudio.
 */
export const Metronome = ({ defaultBpm = 100, onBpmChange, playing: playingProp, onPlayingChange }: MetronomeProps) => {
  const [bpm, setBpm] = useState(defaultBpm);
  const [internalPlaying, setInternalPlaying] = useState(false);
  const isPlaying = playingProp ?? internalPlaying;
  const setPlaying = (v: boolean) => {
    if (playingProp === undefined) setInternalPlaying(v);
    onPlayingChange?.(v);
  };

  // Segue o BPM da música quando ele muda (troca de groove no Drum Pad,
  // troca de música no setlist). Ajustes locais de ± não disparam o efeito,
  // pois defaultBpm só muda quando o BPM da música muda de fato.
  useEffect(() => {
    setBpm(Math.min(BPM_MAX, Math.max(BPM_MIN, defaultBpm)));
  }, [defaultBpm]);
  const [beat, setBeat] = useState(0); // incrementa a cada pulso → retrigger do flash
  const synthRef = useRef<Tone.MembraneSynth | null>(null);
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
      synthRef.current?.dispose();
    };
  }, []);

  // Agenda um pulso levemente à frente no tempo de áudio; o flash visual é
  // disparado pelo Tone.Draw exatamente nesse instante
  const schedulePulse = useCallback(() => {
    const time = Tone.now() + 0.05;
    synthRef.current?.triggerAttackRelease('C2', '32n', time);
    Tone.Draw.schedule(() => setBeat((b) => b + 1), time);
  }, []);

  // Intervalo do pulso: recria quando BPM muda, mesmo tocando
  useEffect(() => {
    if (!isPlaying) return;
    schedulePulse(); // primeiro pulso imediato
    const id = setInterval(schedulePulse, 60000 / bpm);
    return () => clearInterval(id);
  }, [isPlaying, bpm, schedulePulse]);

  const togglePlay = async () => {
    if (isPlaying) {
      setPlaying(false);
    } else {
      await Tone.start();
      setPlaying(true);
    }
  };

  const adjustBpm = (delta: number) => {
    const newBpm = Math.max(BPM_MIN, Math.min(BPM_MAX, bpm + delta));
    setBpm(newBpm);
    onBpmChange?.(newBpm);
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
      const newBpm = Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(60000 / avg)));
      setBpm(newBpm);
      onBpmChange?.(newBpm);
    }
    setBeat((b) => b + 1); // feedback visual do tap mesmo parado
  }, [onBpmChange]);

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

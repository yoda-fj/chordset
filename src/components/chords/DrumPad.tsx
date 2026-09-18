'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { getSamplerUrls, volumeToDb, stepsToHits } from '@/lib/drum-samples';
import type { DrumHit } from '@/lib/drum-samples';
import { Play, Pause, Square, Volume2, VolumeX, Music } from 'lucide-react';

interface DrumPadProps {
  initialGroove?: string;
  initialBpm?: number;
  initialVolume?: number;
  onGrooveChange?: (grooveId: string, drumPatternId: number | null) => void;

  onVolumeChange?: (volume: number) => void;
  // Modo controlado (páginas): o play/stop fica no pai, sincronizado com o
  // RhythmPlayer da toolbar e o metrônomo — um play só, um motor só (o do
  // RhythmPlayer). Sem as props, o painel toca sozinho (standalone).
  playing?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}

interface GroovePattern {
  name: string;
  bpm: number;
  pattern: DrumHit[];
}

interface DrumPattern {
  id: number;
  nome: string;
  bpm: number;
  kit: string;
  steps: string; // JSON string from database
}

// Padrões pré-definidos de grooves
const PRESET_GROOVES: Record<string, GroovePattern> = {
  'rock-8': {
    name: 'Rock (8ths)',
    bpm: 120,
    pattern: [
      { time: 0, note: 'C1', velocity: 1 }, // kick
      { time: 0, note: 'F#1', velocity: 0.7 }, // hi-hat
      { time: 1, note: 'F#1', velocity: 0.5 },
      { time: 2, note: 'D1', velocity: 0.9 }, // snare
      { time: 2, note: 'F#1', velocity: 0.7 },
      { time: 3, note: 'F#1', velocity: 0.5 },
      { time: 4, note: 'C1', velocity: 1 },
      { time: 4, note: 'F#1', velocity: 0.7 },
      { time: 5, note: 'F#1', velocity: 0.5 },
      { time: 6, note: 'D1', velocity: 0.9 },
      { time: 6, note: 'F#1', velocity: 0.7 },
      { time: 7, note: 'F#1', velocity: 0.5 },
    ]
  },
  'rock-fill': {
    name: 'Rock com Fill',
    bpm: 120,
    pattern: [
      { time: 0, note: 'C1', velocity: 1 },
      { time: 0, note: 'F#1', velocity: 0.7 },
      { time: 1, note: 'F#1', velocity: 0.5 },
      { time: 2, note: 'D1', velocity: 0.9 },
      { time: 2, note: 'F#1', velocity: 0.7 },
      { time: 3, note: 'F#1', velocity: 0.5 },
      { time: 4, note: 'C1', velocity: 1 },
      { time: 4, note: 'F#1', velocity: 0.7 },
      { time: 5, note: 'C1', velocity: 0.8 },
      { time: 5, note: 'F#1', velocity: 0.5 },
      { time: 6, note: 'D1', velocity: 0.9 },
      { time: 6, note: 'E2', velocity: 0.7 }, // tom low
      { time: 6.5, note: 'F2', velocity: 0.7 }, // tom mid
      { time: 7, note: 'G2', velocity: 0.8 }, // tom high
    ]
  },
  'pop': {
    name: 'Pop',
    bpm: 100,
    pattern: [
      { time: 0, note: 'C1', velocity: 1 },
      { time: 0, note: 'F#1', velocity: 0.7 },
      { time: 2, note: 'D1', velocity: 0.8 },
      { time: 2, note: 'F#1', velocity: 0.6 },
      { time: 4, note: 'C1', velocity: 1 },
      { time: 4, note: 'F#1', velocity: 0.7 },
      { time: 6, note: 'D1', velocity: 0.8 },
      { time: 6, note: 'F#1', velocity: 0.6 },
    ]
  },
  'balada': {
    name: 'Balada',
    bpm: 70,
    pattern: [
      { time: 0, note: 'C1', velocity: 0.9 },
      { time: 2, note: 'D1', velocity: 0.7 },
      { time: 4, note: 'C1', velocity: 0.9 },
      { time: 6, note: 'D1', velocity: 0.7 },
    ]
  },
  'funk': {
    name: 'Funk',
    bpm: 110,
    pattern: [
      { time: 0, note: 'C1', velocity: 1 },
      { time: 0, note: 'F#1', velocity: 0.7 },
      { time: 1, note: 'F#1', velocity: 0.5 },
      { time: 2, note: 'D1', velocity: 0.8 },
      { time: 3, note: 'F#1', velocity: 0.5 },
      { time: 4, note: 'C1', velocity: 0.8 },
      { time: 4, note: 'F#1', velocity: 0.7 },
      { time: 5, note: 'F#1', velocity: 0.5 },
      { time: 6, note: 'D1', velocity: 0.8 },
      { time: 7, note: 'F#1', velocity: 0.5 },
    ]
  },
  'bossa': {
    name: 'Bossa Nova',
    bpm: 85,
    pattern: [
      { time: 0, note: 'F#1', velocity: 0.6 },
      { time: 1, note: 'F#1', velocity: 0.4 },
      { time: 2, note: 'F#1', velocity: 0.6 },
      { time: 3, note: 'F#1', velocity: 0.4 },
      { time: 4, note: 'D1', velocity: 0.7 },
      { time: 5, note: 'F#1', velocity: 0.4 },
      { time: 6, note: 'F#1', velocity: 0.6 },
      { time: 7, note: 'F#1', velocity: 0.4 },
    ]
  }
};

const DRUM_PADS = [
  { note: 'C1', label: 'Kick', key: 'Q', color: 'bg-red-500' },
  { note: 'D1', label: 'Snare', key: 'W', color: 'bg-orange-500' },
  { note: 'F#1', label: 'Hi-Hat', key: 'E', color: 'bg-yellow-500' },
  { note: 'A#1', label: 'Open HH', key: 'R', color: 'bg-green-500' },
  { note: 'C2', label: 'Crash', key: 'A', color: 'bg-blue-500' },
  { note: 'D2', label: 'Ride', key: 'S', color: 'bg-indigo-500' },
  { note: 'E2', label: 'Tom L', key: 'D', color: 'bg-purple-500' },
  { note: 'F2', label: 'Tom M', key: 'F', color: 'bg-pink-500' },
  { note: 'G2', label: 'Tom H', key: 'G', color: 'bg-rose-500' },
];

// Teclas globais não disparam quando o foco está num campo de texto
function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.tagName === 'SELECT' ||
    target.isContentEditable
  );
}

export function DrumPad({ initialGroove, initialBpm, initialVolume, onGrooveChange, onVolumeChange, playing: playingProp, onPlayingChange }: DrumPadProps) {
  const [internalPlaying, setInternalPlaying] = useState(false);
  // Modo controlado: o motor de sequência fica desligado (o som do padrão sai
  // do RhythmPlayer da toolbar); os botões espelham/emitem o estado do pai.
  const controlled = playingProp !== undefined;
  const isPlaying = playingProp ?? internalPlaying;
  const setIsPlaying = useCallback((v: boolean) => {
    if (!controlled) setInternalPlaying(v);
    onPlayingChange?.(v);
  }, [controlled, onPlayingChange]);
  const [selectedGroove, setSelectedGroove] = useState<string>(initialGroove || 'rock-8');
  // BPM derivado da prop: vem da música e segue o hook ao vivo — inclusive
  // DURANTE o play (o efeito abaixo recria o intervalo quando ele muda)
  const bpm = initialBpm && initialBpm > 0 ? initialBpm : 120;
  const [volume, setVolume] = useState(initialVolume ?? 0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activePads, setActivePads] = useState<Set<string>>(new Set());
  const [customPatterns, setCustomPatterns] = useState<DrumPattern[]>([]);
  const [selectedKit, setSelectedKit] = useState<string>('kit1');
  const activePadsTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const sequenceRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const patternRef = useRef<DrumHit[]>([]);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch custom patterns from database
  useEffect(() => {
    async function fetchPatterns() {
      try {
        const res = await fetch('/api/drum-patterns');
        if (res.ok) {
          const patterns = await res.json();
          setCustomPatterns(patterns);
        }
      } catch (err) {
        console.error('[DrumPad] Error fetching patterns:', err);
      }
    }
    fetchPatterns();
  }, []);

  // Inicializa o sampler (com limiter para permitir mais ganho sem distorcer)
  useEffect(() => {
    const limiter = new Tone.Limiter(-3).toDestination();
    const newSampler = new Tone.Sampler({
      urls: getSamplerUrls(selectedKit),
      onload: () => {
        console.log('[DrumPad] Samples loaded!');
        setIsLoaded(true);
      },
      onerror: (err) => {
        console.error('[DrumPad] Sample load error:', err);
      }
    }).connect(limiter);

    setSampler(newSampler);

    return () => {
      newSampler.dispose();
      limiter.dispose();
    };
  }, [selectedKit]);

  // Atualiza volume (0-1 linear para dB, com boost para som mais alto)
  useEffect(() => {
    if (sampler) {
      sampler.volume.value = isMuted ? -Infinity : volumeToDb(volume);
    }
  }, [volume, isMuted, sampler]);

  const playPad = useCallback((note: string) => {
    if (!sampler || !isLoaded) return;
    
    sampler.triggerAttackRelease(note, '8n');
    
    // Visual feedback
    setActivePads(prev => new Set(prev).add(note));
    
    // Clear previous timeout if exists
    const existingTimeout = activePadsTimeoutRef.current.get(note);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Set new timeout
    const timeout = setTimeout(() => {
      setActivePads(prev => {
        const next = new Set(prev);
        next.delete(note);
        return next;
      });
    }, 150);
    
    activePadsTimeoutRef.current.set(note, timeout);
  }, [sampler, isLoaded]);

  const startPlayback = useCallback(async () => {
    if (controlled) return; // modo sincronizado: o motor é o RhythmPlayer
    if (!sampler || !isLoaded) return;

    await Tone.start();

    let patternToPlay: DrumHit[];
    // O ritmo toca SEMPRE no BPM da música (state). O BPM do padrão/preset
    // só pré-preenche o estado quando o usuário seleciona (handleGrooveChange) —
    // usar o do padrão aqui faria o ritmo ignorar o andamento da música.
    if (selectedGroove.startsWith('db-')) {
      // Database pattern - convert steps to DrumHit format
      const patternId = parseInt(selectedGroove.replace('db-', ''));
      const dbPattern = customPatterns.find(p => p.id === patternId);
      if (dbPattern) {
        patternToPlay = stepsToHits(dbPattern.steps);
      } else {
        patternToPlay = PRESET_GROOVES['rock-8'].pattern;
      }
    } else {
      patternToPlay = PRESET_GROOVES[selectedGroove]?.pattern || PRESET_GROOVES['rock-8'].pattern;
    }

    // Use setInterval instead of Tone.Transport
    let step = 0;
    const intervalMs = (60 / bpm) * 1000 / 4; // 16th notes

    const timerId = setInterval(() => {
      patternToPlay.forEach(hit => {
        const hitStep = Math.floor(hit.time * 2) % 16;
        if (hitStep === step) {
          sampler!.triggerAttackRelease(hit.note, '16n');
          // Visual feedback
          setActivePads(prev => new Set(prev).add(hit.note));
          setTimeout(() => {
            setActivePads(prev => {
              const next = new Set(prev);
              next.delete(hit.note);
              return next;
            });
          }, 150);
        }
      });
      step = (step + 1) % 16;
    }, intervalMs);

    Tone.Transport.start();
    sequenceRef.current = timerId;
    patternRef.current = patternToPlay;
    setIsPlaying(true);
  }, [sampler, isLoaded, selectedGroove, bpm, customPatterns, controlled, setIsPlaying]);

  // BPM ao vivo: quando o andamento da música muda durante o play
  // (metrônomo ±/tap), recria o intervalo com o novo tempo, mesmo padrão
  const prevBpmRef = useRef(bpm);
  useEffect(() => {
    if (prevBpmRef.current === bpm) return;
    prevBpmRef.current = bpm;
    if (controlled) return;
    if (!isPlaying || !sampler) return;
    const patternToPlay = patternRef.current;
    if (patternToPlay.length === 0) return;
    if (sequenceRef.current) clearInterval(sequenceRef.current);

    let step = 0;
    const intervalMs = (60 / bpm) * 1000 / 4; // 16th notes
    const timerId = setInterval(() => {
      patternToPlay.forEach(hit => {
        const hitStep = Math.floor(hit.time * 2) % 16;
        if (hitStep === step) {
          sampler.triggerAttackRelease(hit.note, '16n');
          setActivePads(prev => new Set(prev).add(hit.note));
          setTimeout(() => {
            setActivePads(prev => {
              const next = new Set(prev);
              next.delete(hit.note);
              return next;
            });
          }, 150);
        }
      });
      step = (step + 1) % 16;
    }, intervalMs);
    sequenceRef.current = timerId;
  }, [bpm, isPlaying, sampler, controlled]);

  const stopPlayback = useCallback(() => {
    if (sequenceRef.current) {
      clearInterval(sequenceRef.current);
      sequenceRef.current = null;
    }
    Tone.Transport.stop();
    setIsPlaying(false);
    setActivePads(new Set());
  }, [setIsPlaying]);

  // Para o playback ao desmontar (troca de música no setlist remonta o componente via key)
  useEffect(() => {
    return () => {
      if (sequenceRef.current) {
        clearInterval(sequenceRef.current);
        sequenceRef.current = null;
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      Tone.Transport.stop();
    };
  }, []);

  // Auto-restart playback when groove selection or kit changes
  useEffect(() => {
    if (controlled) return;
    if (isPlaying && isLoaded) {
      stopPlayback();
      // Small delay to ensure cleanup before starting new playback
      restartTimeoutRef.current = setTimeout(() => startPlayback(), 50);
    }
    return () => {
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reinicia só ao trocar groove/kit, de propósito
  }, [selectedGroove, selectedKit]);

  const togglePlayback = useCallback(() => {
    if (controlled) {
      // Sincronizado com o RhythmPlayer da toolbar: espelha/emite o estado
      setIsPlaying(!isPlaying);
      return;
    }
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [controlled, isPlaying, startPlayback, stopPlayback, setIsPlaying]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const pad = DRUM_PADS.find(p => p.key.toLowerCase() === e.key.toLowerCase());
      if (pad) {
        e.preventDefault();
        playPad(pad.note);
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlayback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playPad, togglePlayback]);

  const handleGrooveChange = (grooveId: string) => {
    setSelectedGroove(grooveId);
    // O BPM quem define é a música (state inicial = BPM salvo). Selecionar um
    // ritmo NÃO mexe no andamento — o mesmo padrão serve pra várias músicas.
    if (grooveId.startsWith('db-')) {
      // Database pattern
      const patternId = parseInt(grooveId.replace('db-', ''));
      const pattern = customPatterns.find(p => p.id === patternId);
      if (pattern) {
        onGrooveChange?.(grooveId, pattern.id);
        if (pattern.kit && pattern.kit !== selectedKit) {
          setSelectedKit(pattern.kit);
        }
      }
    } else {
      // Preset groove
      onGrooveChange?.(grooveId, null);
      // Presets use kit1
      if (selectedKit !== 'kit1') {
        setSelectedKit('kit1');
      }
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    // Persistência (com debounce) fica no useDrumPadSettings da página
    onVolumeChange?.(newVolume);
  };

  // Painel sempre visível: enquanto os samples carregam, os controles ficam
  // desabilitados (esconder tudo atrás de um "Carregando..." confundia —
  // parecia que o ritmo tinha sumido)
  return (
    <div className="bg-surface-raised rounded-xl border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-ink flex items-center gap-2">
            <Music className="w-4 h-4 text-brand" />
            Drum Pad
          </h3>
          {!isLoaded && (
            <span className="text-xs text-ink-muted animate-pulse">Carregando samples...</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Volume */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex h-12 w-12 items-center justify-center text-ink hover:bg-surface-overlay rounded-lg transition-colors"
            aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
            aria-pressed={isMuted}
          >
            {isMuted ? <VolumeX className="w-5 h-5" aria-hidden /> : <Volume2 className="w-5 h-5" aria-hidden />}
          </button>

          {/* Play/Stop */}
          <button
            onClick={togglePlayback}
            disabled={!isLoaded}
            className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${isPlaying ? 'bg-success text-zinc-950' : 'bg-surface-overlay text-ink hover:bg-surface-overlay/70'} disabled:opacity-40 disabled:cursor-not-allowed`}
            aria-label={isPlaying ? 'Pausar ritmo' : 'Tocar ritmo'}
            aria-pressed={isPlaying}
          >
            {isPlaying ? <Pause className="w-5 h-5" aria-hidden /> : <Play className="w-5 h-5" aria-hidden />}
          </button>

          <button
            onClick={stopPlayback}
            disabled={!isLoaded}
            className="flex h-12 w-12 items-center justify-center bg-surface-overlay text-ink hover:bg-surface-overlay/70 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Parar ritmo"
          >
            <Square className="w-5 h-5" aria-hidden />
          </button>
        </div>
      </div>

      {/* Groove Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={selectedGroove}
          onChange={(e) => handleGrooveChange(e.target.value)}
          disabled={!isLoaded}
          aria-label="Selecionar ritmo"
          className="px-3 min-h-12 bg-surface-overlay border rounded-lg text-sm text-ink min-w-[120px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <optgroup label="Presets">
            {Object.entries(PRESET_GROOVES).map(([id, groove]) => (
              <option key={id} value={id}>{groove.name}</option>
            ))}
          </optgroup>
          {customPatterns.length > 0 && (
            <optgroup label="Ritmos Criados">
              {customPatterns.map((pattern) => (
                <option key={`db-${pattern.id}`} value={`db-${pattern.id}`}>{pattern.nome}</option>
              ))}
            </optgroup>
          )}
        </select>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex h-12 w-12 items-center justify-center text-ink hover:bg-surface-overlay rounded-lg transition-colors"
            aria-label={isMuted ? 'Ativar som' : 'Silenciar'}
            aria-pressed={isMuted}
          >
            {isMuted ? <VolumeX className="w-5 h-5" aria-hidden /> : <Volume2 className="w-5 h-5" aria-hidden />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            aria-label="Volume do ritmo"
            className="w-20 min-h-12"
          />
        </div>
      </div>

      {/* Drum Pads Grid */}
      <div className="grid grid-cols-3 gap-2">
        {DRUM_PADS.map((pad) => (
          <button
            key={pad.note}
            onClick={() => playPad(pad.note)}
            disabled={!isLoaded}
            aria-label={`Tocar ${pad.label} (tecla ${pad.key})`}
            className={`relative p-4 min-h-16 rounded-xl font-medium text-white transition-all transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
              activePads.has(pad.note) ? 'scale-95 brightness-110' : ''
            } ${pad.color} hover:brightness-110`}
          >
            <div className="text-xs opacity-75 absolute top-1 left-2">{pad.key}</div>
            <div className="text-sm">{pad.label}</div>
          </button>
        ))}
      </div>
      
      <p className="text-xs text-ink-faint text-center">
        Teclas: Q-R, A-G | Espaço: Play/Stop
      </p>
    </div>
  );
}

export { PRESET_GROOVES };
export type { GroovePattern, DrumHit };

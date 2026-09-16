'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { getSamplerUrls, volumeToDb } from '@/lib/drum-samples';
import { Play, Pause, Square, Volume2, VolumeX, Music } from 'lucide-react';

interface DrumPadProps {
  readOnly?: boolean;
  initialGroove?: string;
  initialBpm?: number;
  initialVolume?: number;
  onGrooveChange?: (grooveId: string, drumPatternId: number | null) => void;
  onBpmChange?: (bpm: number) => void;
  onVolumeChange?: (volume: number) => void;
}

interface DrumHit {
  time: number; // in 16ths
  note: string;
  velocity?: number;
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

// Mesmos limites do Metronome
const BPM_MIN = 40;
const BPM_MAX = 220;

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

export function DrumPad({ initialGroove, initialBpm, initialVolume, onGrooveChange, onBpmChange, onVolumeChange }: DrumPadProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedGroove, setSelectedGroove] = useState<string>(initialGroove || 'rock-8');
  const [bpm, setBpm] = useState(initialBpm || 120);
  const [volume, setVolume] = useState(initialVolume ?? 0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activePads, setActivePads] = useState<Set<string>>(new Set());
  const [customPatterns, setCustomPatterns] = useState<DrumPattern[]>([]);
  const [selectedKit, setSelectedKit] = useState<string>('kit1');
  const activePadsTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const sequenceRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentPatternRef = useRef<{ pattern: DrumHit[]; bpm: number } | null>(null);

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

  // BPM inicial vem de initialBpm (BPM salvo da música). O BPM do preset só
  // é aplicado quando o usuário troca o groove (em handleGrooveChange) —
  // sobrescrever aqui na montagem apagaria o andamento salvo.

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
    if (!sampler || !isLoaded) return;

    await Tone.start();

    let patternToPlay: DrumHit[];
    let currentBpm = bpm;

    if (selectedGroove.startsWith('db-')) {
      // Database pattern - convert steps to DrumHit format
      const patternId = parseInt(selectedGroove.replace('db-', ''));
      const dbPattern = customPatterns.find(p => p.id === patternId);
      if (dbPattern) {
        currentBpm = dbPattern.bpm;
        // Steps may already be parsed, be a JSON string, or be object format
        let stepsData: boolean[][] | Record<string, boolean[]>;
        if (typeof dbPattern.steps === 'string') {
          stepsData = JSON.parse(dbPattern.steps);
        } else {
          stepsData = dbPattern.steps;
        }
        patternToPlay = [];

        // Object format: {kick: [16], snare: [16], ...}
        if (!Array.isArray(stepsData) && typeof stepsData === 'object') {
          const noteMap: Record<string, string> = {
            kick: 'C1', snare: 'D1', hihatClosed: 'F#1', hihatOpen: 'A#1',
            crash: 'C2', ride: 'D2', tomLow: 'E2', tomMid: 'F2', tomHigh: 'G2'
          };
          Object.entries(stepsData).forEach(([trackName, steps]) => {
            if (Array.isArray(steps)) {
              const note = noteMap[trackName];
              if (note) {
                steps.forEach((hit: boolean, stepIndex: number) => {
                  if (hit) {
                    patternToPlay.push({
                      time: stepIndex / 2,
                      note: note,
                      velocity: 0.8
                    });
                  }
                });
              }
            }
          });
        }
        // Array format: [[16], [16], ...] (9 tracks x 16 steps)
        else if (Array.isArray(stepsData)) {
          const trackNotes = ['C1', 'D1', 'F#1', 'A#1', 'C2', 'D2', 'E2', 'F2', 'G2'];
          stepsData.forEach((track: boolean[], trackIndex: number) => {
            if (Array.isArray(track)) {
              track.forEach((hit: boolean, stepIndex: number) => {
                if (hit) {
                  patternToPlay.push({
                    time: stepIndex / 2, // convert step to time in 16ths
                    note: trackNotes[trackIndex],
                    velocity: 0.8
                  });
                }
              });
            }
          });
        } else {
          console.error('[DrumPad] Invalid steps format:', stepsData);
        }
      } else {
        patternToPlay = PRESET_GROOVES['rock-8'].pattern;
      }
    } else {
      patternToPlay = PRESET_GROOVES[selectedGroove]?.pattern || PRESET_GROOVES['rock-8'].pattern;
      currentBpm = PRESET_GROOVES[selectedGroove]?.bpm || bpm;
    }

    // Use setInterval instead of Tone.Transport
    let step = 0;
    const intervalMs = (60 / currentBpm) * 1000 / 4; // 16th notes

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
    currentPatternRef.current = { pattern: patternToPlay, bpm: currentBpm };
    setIsPlaying(true);
  }, [sampler, isLoaded, selectedGroove, bpm, customPatterns]);

  const stopPlayback = useCallback(() => {
    if (sequenceRef.current) {
      clearInterval(sequenceRef.current);
      sequenceRef.current = null;
    }
    Tone.Transport.stop();
    setIsPlaying(false);
    setActivePads(new Set());
  }, []);

  // Para o playback ao desmontar (troca de música no setlist remonta o componente via key)
  useEffect(() => {
    return () => {
      if (sequenceRef.current) {
        clearInterval(sequenceRef.current);
        sequenceRef.current = null;
      }
      Tone.Transport.stop();
    };
  }, []);

  // Auto-restart playback when groove selection or kit changes
  useEffect(() => {
    if (isPlaying && isLoaded) {
      stopPlayback();
      // Small delay to ensure cleanup before starting new playback
      setTimeout(() => startPlayback(), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reinicia só ao trocar groove/kit, de propósito
  }, [selectedGroove, selectedKit]);

  // Restart playback when BPM changes during playback
  useEffect(() => {
    if (isPlaying && currentPatternRef.current && sequenceRef.current) {
      // Stop current playback
      clearInterval(sequenceRef.current);
      sequenceRef.current = null;

      const { pattern: patternToPlay } = currentPatternRef.current;
      const intervalMs = (60 / bpm) * 1000 / 4; // 16th notes

      let step = 0;
      const timerId = setInterval(() => {
        patternToPlay.forEach(hit => {
          const hitStep = Math.floor(hit.time * 2) % 16;
          if (hitStep === step) {
            sampler!.triggerAttackRelease(hit.note, '16n');
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
      currentPatternRef.current = { pattern: patternToPlay, bpm };
    }
  }, [bpm, isPlaying, sampler]);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, startPlayback, stopPlayback]);

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
    if (grooveId.startsWith('db-')) {
      // Database pattern
      const patternId = parseInt(grooveId.replace('db-', ''));
      const pattern = customPatterns.find(p => p.id === patternId);
      if (pattern) {
        setBpm(pattern.bpm);
        onBpmChange?.(pattern.bpm);
        onGrooveChange?.(grooveId, pattern.id);
        if (pattern.kit && pattern.kit !== selectedKit) {
          setSelectedKit(pattern.kit);
        }
      }
    } else {
      // Preset groove
      const newBpm = PRESET_GROOVES[grooveId]?.bpm || 120;
      setBpm(newBpm);
      onBpmChange?.(newBpm);
      onGrooveChange?.(grooveId, null);
      // Presets use kit1
      if (selectedKit !== 'kit1') {
        setSelectedKit('kit1');
      }
    }
  };

  const handleBpmChange = (newBpm: number) => {
    // Input limpo/inválido gera NaN: ignora pra não quebrar o Tone.Transport
    if (!Number.isFinite(newBpm)) return;
    const clamped = Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(newBpm)));
    setBpm(clamped);
    Tone.Transport.bpm.value = clamped;
    // Persistência (com debounce) fica no useDrumPadSettings da página
    onBpmChange?.(clamped);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    // Persistência (com debounce) fica no useDrumPadSettings da página
    onVolumeChange?.(newVolume);
  };

  if (!isLoaded) {
    return (
      <div className="bg-surface-raised rounded-xl border p-4">
        <div className="flex items-center gap-2 text-ink-muted">
          <Music className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Carregando samples...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-surface-raised rounded-xl border p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-ink flex items-center gap-2">
          <Music className="w-4 h-4 text-brand" />
          Drum Pad
        </h3>
        
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
            className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${isPlaying ? 'bg-success text-zinc-950' : 'bg-surface-overlay text-ink hover:bg-surface-overlay/70'}`}
            aria-label={isPlaying ? 'Pausar ritmo' : 'Tocar ritmo'}
            aria-pressed={isPlaying}
          >
            {isPlaying ? <Pause className="w-5 h-5" aria-hidden /> : <Play className="w-5 h-5" aria-hidden />}
          </button>

          <button
            onClick={stopPlayback}
            className="flex h-12 w-12 items-center justify-center bg-surface-overlay text-ink hover:bg-surface-overlay/70 rounded-lg transition-colors"
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
          aria-label="Selecionar ritmo"
          className="px-3 min-h-12 bg-surface-overlay border rounded-lg text-sm text-ink min-w-[120px]"
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
          <span className="text-xs text-ink-muted">BPM</span>
          <input
            type="number"
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            min={BPM_MIN}
            max={BPM_MAX}
            aria-label="BPM do ritmo"
            className="w-16 px-1 min-h-12 bg-surface-overlay border rounded text-sm text-center text-ink"
          />
        </div>

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
            aria-label={`Tocar ${pad.label} (tecla ${pad.key})`}
            className={`relative p-4 min-h-16 rounded-xl font-medium text-white transition-all transform active:scale-95 ${
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

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { getSamplerUrls } from '@/lib/drum-samples';
import { Play, Pause, Square, Volume2, VolumeX, Music } from 'lucide-react';

interface DrumPadProps {
  readOnly?: boolean;
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

export function DrumPad({ readOnly = false }: DrumPadProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedGroove, setSelectedGroove] = useState<string>('rock-8');
  const [bpm, setBpm] = useState(120);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activePads, setActivePads] = useState<Set<string>>(new Set());
  const sequenceRef = useRef<Tone.Sequence | null>(null);
  const activePadsTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Inicializa o sampler
  useEffect(() => {
    const newSampler = new Tone.Sampler({
      urls: getSamplerUrls('kit1'),
      baseUrl: '',
      onload: () => {
        setIsLoaded(true);
      }
    }).toDestination();

    newSampler.volume.value = -10;
    setSampler(newSampler);

    return () => {
      newSampler.dispose();
    };
  }, []);

  // Atualiza volume
  useEffect(() => {
    if (sampler) {
      sampler.volume.value = isMuted ? -Infinity : Tone.gainToDb(volume);
    }
  }, [volume, isMuted, sampler]);

  // Carrega groove salvo (apenas inicializa com BPM padrão)
  useEffect(() => {
    if (PRESET_GROOVES[selectedGroove]) {
      setBpm(PRESET_GROOVES[selectedGroove].bpm);
    }
  }, []);

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

  const startPlayback = useCallback(() => {
    if (!sampler || !isLoaded) return;
    
    Tone.start();
    
    const pattern = PRESET_GROOVES[selectedGroove]?.pattern || PRESET_GROOVES['rock-8'].pattern;
    const currentBpm = bpm || PRESET_GROOVES[selectedGroove]?.bpm || 120;
    
    Tone.Transport.bpm.value = currentBpm;
    
    // Convert pattern to 16th note steps
    const steps: (string[] | null)[] = Array(16).fill(null).map(() => []);
    pattern.forEach(hit => {
      const step = Math.floor(hit.time * 2) % 16;
      if (!steps[step]) steps[step] = [];
      steps[step].push(hit.note);
    });

    const seq = new Tone.Sequence(
      (time, stepNotes) => {
        if (stepNotes) {
          stepNotes.forEach(note => {
            sampler.triggerAttackRelease(note, '16n', time);
            // Schedule visual update
            Tone.Draw.schedule(() => {
              setActivePads(prev => new Set(prev).add(note));
              setTimeout(() => {
                setActivePads(prev => {
                  const next = new Set(prev);
                  next.delete(note);
                  return next;
                });
              }, 150);
            }, time);
          });
        }
      },
      steps,
      '8n'
    );

    seq.start(0);
    Tone.Transport.start();
    sequenceRef.current = seq;
    setIsPlaying(true);
  }, [sampler, isLoaded, selectedGroove, bpm]);

  const stopPlayback = useCallback(() => {
    if (sequenceRef.current) {
      sequenceRef.current.stop();
      sequenceRef.current.dispose();
      sequenceRef.current = null;
    }
    Tone.Transport.stop();
    Tone.Transport.cancel();
    setIsPlaying(false);
    setActivePads(new Set());
  }, []);

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
    const newBpm = PRESET_GROOVES[grooveId]?.bpm || 120;
    setBpm(newBpm);
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    Tone.Transport.bpm.value = newBpm;
  };

  if (!isLoaded) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 text-slate-500">
          <Music className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Carregando samples...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2">
          <Music className="w-4 h-4 text-indigo-600" />
          Drum Pad
        </h3>
        
        <div className="flex items-center gap-2">
          {/* Volume */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 hover:bg-slate-100 rounded"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          
          {/* Play/Stop */}
          <button
            onClick={togglePlayback}
            className={`p-2 rounded-lg ${isPlaying ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          
          <button
            onClick={stopPlayback}
            className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Groove Selector */}
      <div className="flex items-center gap-3">
        <select
          value={selectedGroove}
          onChange={(e) => handleGrooveChange(e.target.value)}
          className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm"
        >
          {Object.entries(PRESET_GROOVES).map(([id, groove]) => (
            <option key={id} value={id}>{groove.name}</option>
          ))}
        </select>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">BPM</span>
          <input
            type="number"
            value={bpm}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            min={40}
            max={200}
            className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-sm text-center"
          />
        </div>
        
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={isMuted ? 0 : volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-20"
        />
      </div>

      {/* Drum Pads Grid */}
      <div className="grid grid-cols-3 gap-2">
        {DRUM_PADS.map((pad) => (
          <button
            key={pad.note}
            onClick={() => playPad(pad.note)}
            className={`relative p-4 rounded-xl font-medium text-white transition-all transform active:scale-95 ${
              activePads.has(pad.note) ? 'scale-95 brightness-110' : ''
            } ${pad.color} hover:brightness-110`}
          >
            <div className="text-xs opacity-75 absolute top-1 left-2">{pad.key}</div>
            <div className="text-sm">{pad.label}</div>
          </button>
        ))}
      </div>
      
      <p className="text-xs text-slate-400 text-center">
        Teclas: Q-R, A-G | Espaço: Play/Stop
      </p>
    </div>
  );
}

export { PRESET_GROOVES };
export type { GroovePattern, DrumHit };

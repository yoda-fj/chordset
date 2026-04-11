'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { Play, Pause, Minus, Plus } from 'lucide-react';

interface MetronomeProps {
  defaultBpm?: number;
  compact?: boolean;
}

export const Metronome = ({ defaultBpm = 100 }: MetronomeProps) => {
  const [bpm, setBpm] = useState(defaultBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const synthRef = useRef<Tone.MembraneSynth | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);

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
        }, '4n').start(0);
      }
      
      Tone.Transport.bpm.value = bpm;
      Tone.Transport.start();
      setIsPlaying(true);
    }
  };

  const adjustBpm = (delta: number) => {
    setBpm(prev => Math.max(40, Math.min(220, prev + delta)));
  };

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-200 p-2">
      <button 
        className={`p-2 rounded-lg transition-all ${isPlaying ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
        onClick={togglePlay}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
      </button>
      
      <div className="flex items-center gap-1">
        <button 
          className="p-1 text-slate-500 hover:text-slate-700"
          onClick={() => adjustBpm(-5)}
        >
          <Minus size={14} />
        </button>
        <span className="text-sm font-medium text-slate-700 w-12 text-center">
          {bpm} <span className="text-xs text-slate-400">BPM</span>
        </span>
        <button 
          className="p-1 text-slate-500 hover:text-slate-700"
          onClick={() => adjustBpm(5)}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};

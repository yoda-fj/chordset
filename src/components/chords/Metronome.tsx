'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Tone from 'tone';
import { Play, Pause, Plus, Minus } from 'lucide-react';

interface MetronomeProps {
  defaultBpm?: number;
  minBpm?: number;
  maxBpm?: number;
}

export const Metronome = ({ 
  defaultBpm = 100, 
  minBpm = 40, 
  maxBpm = 220 
}: MetronomeProps) => {
  const [bpm, setBpm] = useState(defaultBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const synthRef = useRef<Tone.MembraneSynth | null>(null);
  const loopRef = useRef<Tone.Loop | null>(null);

  useEffect(() => {
    // Initialize synth
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
    
    setIsReady(true);
    
    return () => {
      if (loopRef.current) {
        loopRef.current.dispose();
      }
      if (synthRef.current) {
        synthRef.current.dispose();
      }
    };
  }, []);

  const updateTempo = useCallback(() => {
    if (loopRef.current) {
      Tone.Transport.bpm.value = bpm;
    }
  }, [bpm]);

  useEffect(() => {
    updateTempo();
  }, [bpm, updateTempo]);

  const togglePlay = async () => {
    if (!isReady) return;
    
    if (isPlaying) {
      Tone.Transport.stop();
      if (loopRef.current) {
        loopRef.current.stop();
      }
      setIsPlaying(false);
    } else {
      await Tone.start();
      
      // Create loop if not exists
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
    setBpm(prev => Math.max(minBpm, Math.min(maxBpm, prev + delta)));
  };

  return (
    <div className="metronome bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="metronome-display flex justify-between items-center mb-4">
        <div className="bpm-value flex items-baseline gap-2">
          <span className="bpm-number text-3xl font-bold text-slate-900 dark:text-white font-mono">{bpm}</span>
          <span className="bpm-label text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider">BPM</span>
        </div>
        <div className={`beat-indicator w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center transition-all ${isPlaying ? 'beating' : ''}`}>
          <div className={`beat-dot w-3 h-3 rounded-full transition-all ${isPlaying ? 'bg-amber-400 scale-100 opacity-100' : 'bg-slate-400 scale-75 opacity-50'}`} 
               style={isPlaying ? { animation: `pulse ${60/bpm}s infinite` } : {}} />
        </div>
      </div>
      
      <div className="metronome-controls flex justify-center items-center gap-1 mb-3">
        <button 
          className="bpm-btn flex items-center justify-center gap-0.5 w-10 h-9 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          onClick={() => adjustBpm(-5)}
          disabled={bpm <= minBpm}
        >
          <Minus size={14} />
          <span>5</span>
        </button>
        <button 
          className="bpm-btn flex items-center justify-center gap-0.5 w-10 h-9 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          onClick={() => adjustBpm(-1)}
          disabled={bpm <= minBpm}
        >
          <Minus size={12} />
          <span>1</span>
        </button>
        
        <button 
          className={`play-btn flex items-center justify-center w-12 h-12 rounded-full transition-all hover:scale-105 ${isPlaying ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-emerald-500 hover:bg-emerald-600 text-white'} disabled:opacity-50 mx-1`}
          onClick={togglePlay}
          disabled={!isReady}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
        </button>
        
        <button 
          className="bpm-btn flex items-center justify-center gap-0.5 w-10 h-9 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          onClick={() => adjustBpm(1)}
          disabled={bpm >= maxBpm}
        >
          <Plus size={12} />
          <span>1</span>
        </button>
        <button 
          className="bpm-btn flex items-center justify-center gap-0.5 w-10 h-9 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors"
          onClick={() => adjustBpm(5)}
          disabled={bpm >= maxBpm}
        >
          <Plus size={14} />
          <span>5</span>
        </button>
      </div>
      
      <input
        type="range"
        min={minBpm}
        max={maxBpm}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        className="bpm-slider w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
      />
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.8); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
};

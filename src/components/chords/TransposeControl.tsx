'use client';

import { ChevronUp, ChevronDown, RotateCcw } from 'lucide-react';

interface TransposeControlProps {
  originalKey: string;
  currentKey: string;
  semitones: number;
  onTranspose: (delta: number) => void;
  onReset: () => void;
}

export const TransposeControl = ({
  originalKey,
  currentKey,
  semitones,
  onTranspose,
  onReset
}: TransposeControlProps) => {
  return (
    <div className="transpose-control bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="transpose-info flex items-center gap-2 flex-wrap text-sm mb-3">
        <span className="key-label text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Original:</span>
        <span className="key-value text-slate-900 dark:text-white font-semibold text-lg min-w-[24px] text-center">{originalKey || '-'}</span>
        <span className="separator text-slate-400">→</span>
        <span className="key-label text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wide">Atual:</span>
        <span className="key-value current text-emerald-600 dark:text-emerald-400 font-semibold text-lg min-w-[24px] text-center">{currentKey || '-'}</span>
        {semitones !== 0 && (
          <span className="semitones-badge bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-xs font-semibold">
            {semitones > 0 ? '+' : ''}{semitones}
          </span>
        )}
      </div>
      <div className="transpose-buttons flex gap-2">
        <button 
          className="transpose-btn flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition-all active:scale-95"
          onClick={() => onTranspose(-1)}
          title="Diminuir meio-tom"
        >
          <ChevronDown size={20} />
        </button>
        <button 
          className="transpose-btn flex items-center justify-center w-10 h-10 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-200 transition-all active:scale-95"
          onClick={() => onTranspose(1)}
          title="Aumentar meio-tom"
        >
          <ChevronUp size={20} />
        </button>
        {semitones !== 0 && (
          <button 
            className="transpose-btn reset flex items-center justify-center w-10 h-10 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 transition-all active:scale-95"
            onClick={onReset}
            title="Resetar transposição"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>
    </div>
  );
};

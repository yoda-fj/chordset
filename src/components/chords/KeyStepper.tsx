'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { getAllKeys } from '@/utils/chord-transposer';

interface KeyStepperProps {
  value: string;
  onChange: (key: string) => void;
  disabled?: boolean;
}

const KEYS = getAllKeys();

function step(value: string, delta: number): string {
  const idx = KEYS.indexOf(value);
  const base = idx === -1 ? 0 : idx;
  return KEYS[(((base + delta) % KEYS.length) + KEYS.length) % KEYS.length];
}

/**
 * Stepper de tom gigante (Fase 2.3): − [ G ] + com alvos ≥64px
 * e flip animado. Troca de tom com 1 dedo, sem abrir <select>.
 */
export function KeyStepper({ value, onChange, disabled = false }: KeyStepperProps) {
  return (
    <div
      className="flex items-center gap-1"
      role="group"
      aria-label={`Tom atual: ${value}`}
    >
      <button
        type="button"
        onClick={() => onChange(step(value, -1))}
        disabled={disabled}
        aria-label="Baixar meio tom"
        className="flex h-16 w-16 items-center justify-center rounded-xl2 bg-surface-overlay text-ink transition-all ease-spring hover:bg-surface-raised active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
      >
        <Minus className="h-7 w-7" aria-hidden />
      </button>

      <div
        className="flex h-16 min-w-16 items-center justify-center px-2"
        style={{ perspective: 400 }}
        aria-live="polite"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={value}
            initial={{ rotateX: 90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: -90, opacity: 0 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.45 }}
            className="font-chord text-stage-md font-bold leading-none text-brand"
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>

      <button
        type="button"
        onClick={() => onChange(step(value, 1))}
        disabled={disabled}
        aria-label="Subir meio tom"
        className="flex h-16 w-16 items-center justify-center rounded-xl2 bg-surface-overlay text-ink transition-all ease-spring hover:bg-surface-raised active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
      >
        <Plus className="h-7 w-7" aria-hidden />
      </button>
    </div>
  );
}

'use client';

import { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ChordViewer } from './ChordViewer';
import { Autoscroll } from './Autoscroll';
import { KeyStepper } from './KeyStepper';
import { transposeCifra } from '@/utils/chord-transposer';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Menu,
  X,
  Eye,
  EyeOff
} from 'lucide-react';

// 2.7: Tone.js (~243kB) só carrega quando o Metronome monta — fora do bundle inicial
const Metronome = dynamic(() => import('./Metronome').then((m) => m.Metronome), {
  ssr: false,
  loading: () => <div className="h-16 w-64 rounded-lg bg-surface-overlay animate-pulse" />,
});

// Ritmo da música na toolbar (play/stop compacto) — também lazy, traz o Tone junto
const RhythmPlayer = dynamic(() => import('./RhythmPlayer').then((m) => m.RhythmPlayer), {
  ssr: false,
  loading: () => <div className="h-12 w-12 rounded-lg bg-surface-overlay animate-pulse" />,
});

interface CifraViewerProps {
  cifra: string | null;
  titulo: string;
  artista: string;
  tomOriginal?: string | null;
  bpm?: number;
  groove?: string;  // ritmo salvo da música ('preset' ou 'db-<id>') pro RhythmPlayer
  volume?: number;
  showMetronome?: boolean;
  showControls?: boolean;
  className?: string;
  isFullscreen?: boolean;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

// Escala tipográfica de palco (Fase 2.2): mín 20px, default 24px, teto 64px
const FONT_MIN = 20;
const FONT_MAX = 64;
const FONT_STEP = 4;
const FONT_DEFAULT = 24;

// Alvo de toque mínimo de palco (Fase 2.5)
const ICON_BTN =
  'flex h-12 w-12 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface-overlay hover:text-ink';

export function CifraViewer({
  cifra,
  titulo,
  artista,
  tomOriginal,
  bpm,
  groove,
  volume,
  showMetronome = false,
  showControls = true,
  className = '',
  isFullscreen = false,
  onToggleSidebar,
  sidebarOpen = false,
}: CifraViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Transpose state - derived from props with useEffect sync
  const [currentTom, setCurrentTom] = useState(tomOriginal || 'C');
  const [originalTom] = useState(tomOriginal || null);
  const [currentCifra, setCurrentCifra] = useState(cifra);

  // Sync state when props change
  useEffect(() => {
    setCurrentTom(tomOriginal || 'C');
  }, [tomOriginal]);

  useEffect(() => {
    setCurrentCifra(cifra);
  }, [cifra]);

  // Display settings
  const [fontSize, setFontSize] = useState(FONT_DEFAULT);
  const [showTablatura, setShowTablatura] = useState(true);

  const handleTranspose = (newTom: string) => {
    if (!originalTom || !cifra) return;
    const transposed = transposeCifra(cifra, originalTom, newTom);
    setCurrentTom(newTom);
    setCurrentCifra(transposed);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      // ignore
    }
  };

  if (!cifra) {
    return (
      <div className={`bg-surface-raised rounded-xl p-8 border border-ink/10 text-center ${className}`}>
        <p className="text-ink-muted">Nenhuma cifra disponível para esta música.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full min-w-0 ${className}`}>
      {/* Controls Bar */}
      {showControls && (
        <div className={`min-w-0 bg-surface-raised rounded-xl p-2 border border-ink/10 shadow-sm mb-2 flex flex-wrap items-center gap-2 shrink-0 ${isFullscreen ? 'fixed top-4 left-4 right-4 z-50' : ''}`}>
        {/* Sidebar toggle */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className={ICON_BTN}
            aria-label={sidebarOpen ? 'Fechar lista de músicas' : 'Abrir lista de músicas'}
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" aria-hidden />
            ) : (
              <Menu className="w-5 h-5" aria-hidden />
            )}
          </button>
        )}

        {/* Tom — stepper gigante (Fase 2.3) */}
        {originalTom ? (
          <div className="flex items-center gap-2">
            <KeyStepper value={currentTom} onChange={handleTranspose} />
            {currentTom !== originalTom && (
              <span className="text-xs text-ink-faint whitespace-nowrap">
                original: {originalTom}
              </span>
            )}
          </div>
        ) : (
          <span className="px-2 font-chord text-stage-sm font-bold text-brand">
            {currentTom}
          </span>
        )}

        <div className="flex-1" />

        {/* Font size — escala de palco 20→64px */}
        <button
          onClick={() => setFontSize(Math.max(FONT_MIN, fontSize - FONT_STEP))}
          disabled={fontSize <= FONT_MIN}
          className={`${ICON_BTN} disabled:opacity-40 disabled:pointer-events-none`}
          aria-label="Diminuir fonte"
        >
          <ZoomOut className="w-5 h-5" aria-hidden />
        </button>
        <span className="text-xs text-ink-faint w-10 text-center" aria-live="polite">
          {fontSize}px
        </span>
        <button
          onClick={() => setFontSize(Math.min(FONT_MAX, fontSize + FONT_STEP))}
          disabled={fontSize >= FONT_MAX}
          className={`${ICON_BTN} disabled:opacity-40 disabled:pointer-events-none`}
          aria-label="Aumentar fonte"
        >
          <ZoomIn className="w-5 h-5" aria-hidden />
        </button>

        {/* Tablatura toggle */}
        <button
          onClick={() => setShowTablatura(!showTablatura)}
          className={ICON_BTN}
          aria-label={showTablatura ? 'Esconder tablatura' : 'Mostrar tablatura'}
          aria-pressed={showTablatura}
        >
          {showTablatura ? (
            <Eye className="w-5 h-5" aria-hidden />
          ) : (
            <EyeOff className="w-5 h-5 text-ink-faint" aria-hidden />
          )}
        </button>

        {/* Autoscroll - sempre visível; com bpm, velocidade segue a música */}
        <Autoscroll targetRef={scrollContainerRef} bpm={bpm} />

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className={ICON_BTN}
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'}
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5" aria-hidden />
          ) : (
            <Maximize className="w-5 h-5" aria-hidden />
          )}
        </button>
      </div>
      )}

      {/* Metrônomo visual (Fase 2.4) — fora do bundle inicial via next/dynamic */}
      {showMetronome && (
        <div className="mb-2 shrink-0 flex items-center gap-2">
          <RhythmPlayer
            groove={groove ?? 'rock-8'}
            bpm={bpm && bpm > 0 ? bpm : 120}
            volume={volume ?? 0.7}
          />
          <Metronome defaultBpm={bpm && bpm > 0 ? bpm : 100} />
        </div>
      )}

      {/* Cifra */}
      <div
        ref={scrollContainerRef}
        className="bg-surface-raised rounded-xl border border-ink/10 shadow-sm flex-1 min-h-0 overflow-auto"
        style={{
          ...(isFullscreen ? { maxHeight: 'calc(100vh - 80px)' } : {}),
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
      <ChordViewer
        chordProContent={currentCifra || cifra}
        title={titulo}
        artist={artista}
        fontSize={fontSize}
        isFullscreen={isFullscreen}
        showTablatura={showTablatura}
      />
      </div>
    </div>
  );
}

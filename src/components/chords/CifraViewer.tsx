'use client';

import { useState, useRef, useEffect } from 'react';
import { ChordViewer } from './ChordViewer';
import { Autoscroll } from './Autoscroll';
import { Metronome } from './Metronome';
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

interface CifraViewerProps {
  cifra: string | null;
  titulo: string;
  artista: string;
  tomOriginal?: string | null;
  showMetronome?: boolean;
  showControls?: boolean;
  compact?: boolean;
  className?: string;
  isFullscreen?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
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
  const [showSidebar] = useState(false);
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
    <div className={`flex flex-col h-full ${className}`}>
      {/* Controls Bar */}
      {showControls && (
        <div className={`bg-surface-raised rounded-xl p-2 border border-ink/10 shadow-sm mb-2 flex flex-wrap items-center gap-2 shrink-0 ${isFullscreen ? 'fixed top-4 left-4 right-4 z-50' : ''}`}>
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

        {/* Autoscroll - always visible */}
        <Autoscroll targetRef={scrollContainerRef} />

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

      {/* Inline tools row - only metronome now */}
      {showSidebar && (
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {showMetronome && <Metronome defaultBpm={100} compact />}
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

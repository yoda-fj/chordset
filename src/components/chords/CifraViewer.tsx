'use client';

import { useState, useRef, useEffect } from 'react';
import { ChordViewer } from './ChordViewer';
import { Autoscroll } from './Autoscroll';
import { Metronome } from './Metronome';
import { getAllKeys, transposeCifra } from '@/utils/chord-transposer';
import { 
  Music2, 
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

export function CifraViewer({
  cifra,
  titulo,
  artista,
  tomOriginal,
  showMetronome = false,
  showControls = true,
  compact = false,
  className = '',
  isFullscreen = false,
  onFullscreenChange,
  onToggleSidebar,
  sidebarOpen = false,
}: CifraViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Transpose state
  const [currentTom, setCurrentTom] = useState(tomOriginal || 'C');
  const [originalTom] = useState(tomOriginal || null);
  const [currentCifra, setCurrentCifra] = useState(cifra);
  
  // Display settings
  const [fontSize, setFontSize] = useState(16);
  const [showSidebar, setShowSidebar] = useState(false);
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
      <div className={`bg-slate-50 rounded-xl p-8 border border-slate-200 text-center ${className}`}>
        <p className="text-slate-500">Nenhuma cifra disponível para esta música.</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Controls Bar */}
      {showControls && (
        <div className={`bg-white rounded-xl p-2 border border-slate-200 shadow-sm mb-2 flex flex-wrap items-center gap-2 shrink-0 ${isFullscreen ? 'fixed top-4 left-4 right-4 z-50' : ''}`}>
        {/* Sidebar toggle */}
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="p-1.5 hover:bg-slate-100 rounded"
            title={sidebarOpen ? 'Fechar lista' : 'Abrir lista'}
          >
            {sidebarOpen ? (
              <X className="w-4 h-4 text-slate-600" />
            ) : (
              <Menu className="w-4 h-4 text-slate-600" />
            )}
          </button>
        )}
        
        {/* Tom */}
        <div className="flex items-center gap-1 px-2">
          <Music2 className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-medium text-slate-700">{currentTom}</span>
        </div>
        
        {/* Transpose */}
        {originalTom && (
          <select
            value={currentTom}
            onChange={(e) => handleTranspose(e.target.value)}
            className="px-2 py-1 bg-indigo-50 text-indigo-700 text-sm font-medium rounded border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500"
          >
            {getAllKeys().map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        )}
        
        <div className="flex-1" />
        
        {/* Font size */}
        <button
          onClick={() => setFontSize(Math.max(12, fontSize - 2))}
          className="p-1.5 hover:bg-slate-100 rounded"
          title="Diminuir fonte"
        >
          <ZoomOut className="w-4 h-4 text-slate-600" />
        </button>
        <span className="text-xs text-slate-500 w-10 text-center">{fontSize}px</span>
        <button
          onClick={() => setFontSize(Math.min(28, fontSize + 2))}
          className="p-1.5 hover:bg-slate-100 rounded"
          title="Aumentar fonte"
        >
          <ZoomIn className="w-4 h-4 text-slate-600" />
        </button>

        {/* Tablatura toggle */}
        <button
          onClick={() => setShowTablatura(!showTablatura)}
          className="p-1.5 hover:bg-slate-100 rounded"
          title={showTablatura ? 'Esconder tablatura' : 'Mostrar tablatura'}
        >
          {showTablatura ? (
            <Eye className="w-4 h-4 text-slate-600" />
          ) : (
            <EyeOff className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {/* Autoscroll - always visible */}
        <Autoscroll targetRef={scrollContainerRef} />
        
        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 hover:bg-slate-100 rounded"
          title={isFullscreen ? 'Sair fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? (
            <Minimize className="w-4 h-4 text-slate-600" />
          ) : (
            <Maximize className="w-4 h-4 text-slate-600" />
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
        className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 min-h-0 overflow-auto"
        style={{
          ...(isFullscreen ? { maxHeight: 'calc(100vh - 80px)' } : {}),
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
      <ChordViewer
        chordProContent={currentCifra || cifra}
        semitones={0}
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

'use client';

import { useState, useRef, forwardRef } from 'react';
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
  Play,
  Pause,
  ChevronDown,
  ChevronUp
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
}: CifraViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Transpose state
  const [currentTom, setCurrentTom] = useState(tomOriginal || 'C');
  const [originalTom] = useState(tomOriginal || null);
  const [currentCifra, setCurrentCifra] = useState(cifra);
  
  // Display settings
  const [fontSize, setFontSize] = useState(16);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!compact);

  const handleTranspose = (newTom: string) => {
    if (!originalTom || !cifra) return;
    const transposed = transposeCifra(cifra, originalTom, newTom);
    setCurrentTom(newTom);
    setCurrentCifra(transposed);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
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
    <div className={`flex flex-col lg:flex-row gap-4 ${className}`}>
      {/* Main Content */}
      <div className="flex-1 space-y-4">
        {/* Controls */}
        {showControls && (
          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Music2 className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-medium text-slate-700">Tom:</span>
                <span className="text-sm font-bold text-indigo-600">{currentTom}</span>
              </div>
              
              <div className="flex items-center gap-1">
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
                
                <button
                  onClick={toggleFullscreen}
                  className="p-1.5 hover:bg-slate-100 rounded ml-1"
                  title={isFullscreen ? 'Sair fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 text-slate-600" />
                  ) : (
                    <Maximize className="w-4 h-4 text-slate-600" />
                  )}
                </button>

                {compact && (
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-1.5 hover:bg-slate-100 rounded ml-1"
                  >
                    {sidebarOpen ? (
                      <ChevronUp className="w-4 h-4 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Transpose row */}
            {originalTom && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Transpor:</span>
                <select
                  value={currentTom}
                  onChange={(e) => handleTranspose(e.target.value)}
                  className="px-2 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500"
                >
                  {getAllKeys().map((key) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}

        {/* Cifra */}
        <div 
          ref={scrollContainerRef}
          className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
          style={{ maxHeight: isFullscreen ? 'calc(100vh - 200px)' : (compact ? '400px' : 'calc(100vh - 300px)') }}
        >
          <div style={{ fontSize: `${fontSize}px` }}>
            <ChordViewer 
              chordProContent={currentCifra || cifra}
              semitones={0}
              title={titulo}
              artist={artista}
            />
          </div>
        </div>
      </div>

      {/* Sidebar - only show if not compact or if open */}
      {(!compact || sidebarOpen) && (
        <div className="space-y-4">
          {showMetronome && (
            <Metronome defaultBpm={100} />
          )}
          
          <Autoscroll targetRef={scrollContainerRef} />
        </div>
      )}
    </div>
  );
}

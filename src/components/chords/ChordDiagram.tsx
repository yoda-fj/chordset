'use client';

import { useEffect, useRef, useState } from 'react';
import { draw } from 'vexchords';

// Acordes padrão (posições abertas)
const STANDARD_CHORDS: Record<string, any> = {
  // Maiores
  'C': { name: 'C', chord: [[1, 0], [2, 1, '1'], [3, 0], [4, 2, 2], [5, 3, 3], [6, 'x']], position: 1 },
  'C#': { name: 'C#', chord: [[1, 4, 4], [2, 6, 3], [3, 6, 3], [4, 6, 3], [5, 4, 4], [6, 4, 4]], position: 4 },
  'Db': { name: 'Db', chord: [[1, 4, 4], [2, 6, 3], [3, 6, 3], [4, 6, 3], [5, 4, 4], [6, 4, 4]], position: 4 },
  'D': { name: 'D', chord: [[1, 2, 2], [2, 3, 3], [3, 2, 2], [4, 0], [5, 'x'], [6, 'x']], position: 1 },
  'D#': { name: 'D#', chord: [[1, 6, 4], [2, 8, 3], [3, 8, 3], [4, 8, 3], [5, 6, 4], [6, 6, 4]], position: 6 },
  'Eb': { name: 'Eb', chord: [[1, 6, 4], [2, 8, 3], [3, 8, 3], [4, 8, 3], [5, 6, 4], [6, 6, 4]], position: 6 },
  'E': { name: 'E', chord: [[1, 0], [2, 0], [3, 1, 1], [4, 2, 2], [5, 2, 3], [6, 0]], position: 1 },
  'F': { name: 'F', chord: [[1, 1, 1], [2, 1, 1], [3, 2, 2], [4, 3, 3], [5, 3, 4], [6, 1, 1]], position: 1 },
  'F#': { name: 'F#', chord: [[1, 2, 1], [2, 2, 1], [3, 3, 2], [4, 4, 3], [5, 4, 4], [6, 2, 1]], position: 1 },
  'Gb': { name: 'Gb', chord: [[1, 2, 1], [2, 2, 1], [3, 3, 2], [4, 4, 3], [5, 4, 4], [6, 2, 1]], position: 1 },
  'G': { name: 'G', chord: [[1, 3, 2], [2, 0], [3, 0], [4, 0], [5, 2, 1], [6, 3, 3]], position: 1 },
  'G#': { name: 'G#', chord: [[1, 4, 1], [2, 6, 4], [3, 6, 3], [4, 5, 2], [5, 4, 1], [6, 4, 1]], position: 4 },
  'Ab': { name: 'Ab', chord: [[1, 4, 1], [2, 6, 4], [3, 6, 3], [4, 5, 2], [5, 4, 1], [6, 4, 1]], position: 4 },
  'A': { name: 'A', chord: [[1, 0], [2, 2, 3], [3, 2, 2], [4, 2, 1], [5, 0], [6, 'x']], position: 1 },
  'A#': { name: 'A#', chord: [[1, 1, 1], [2, 3, 4], [3, 3, 3], [4, 3, 2], [5, 1, 1], [6, 1, 1]], position: 1 },
  'Bb': { name: 'Bb', chord: [[1, 1, 1], [2, 3, 4], [3, 3, 3], [4, 3, 2], [5, 1, 1], [6, 1, 1]], position: 1 },
  'B': { name: 'B', chord: [[1, 2, 1], [2, 4, 4], [3, 4, 3], [4, 4, 2], [5, 2, 1], [6, 2, 1]], position: 1 },
  
  // Menores
  'Cm': { name: 'Cm', chord: [[1, 3, 1], [2, 4, 2], [3, 5, 4], [4, 5, 3], [5, 3, 1], [6, 3, 1]], position: 3 },
  'C#m': { name: 'C#m', chord: [[1, 4, 1], [2, 5, 2], [3, 6, 4], [4, 6, 3], [5, 4, 1], [6, 4, 1]], position: 4 },
  'Dm': { name: 'Dm', chord: [[1, 1, 1], [2, 3, 3], [3, 2, 2], [4, 0], [5, 'x'], [6, 'x']], position: 1 },
  'D#m': { name: 'D#m', chord: [[1, 6, 1], [2, 7, 2], [3, 8, 4], [4, 8, 3], [5, 6, 1], [6, 6, 1]], position: 6 },
  'Em': { name: 'Em', chord: [[1, 0], [2, 0], [3, 0], [4, 2, 3], [5, 2, 2], [6, 0]], position: 1 },
  'Fm': { name: 'Fm', chord: [[1, 1, 1], [2, 1, 1], [3, 1, 1], [4, 3, 3], [5, 3, 4], [6, 1, 1]], position: 1 },
  'F#m': { name: 'F#m', chord: [[1, 2, 1], [2, 2, 1], [3, 2, 1], [4, 4, 3], [5, 4, 4], [6, 2, 1]], position: 1 },
  'Gm': { name: 'Gm', chord: [[1, 3, 2], [2, 3, 3], [3, 3, 4], [4, 5, 1], [5, 5, 1], [6, 3, 2]], position: 3 },
  'G#m': { name: 'G#m', chord: [[1, 4, 1], [2, 4, 1], [3, 4, 1], [4, 6, 3], [5, 6, 4], [6, 4, 1]], position: 4 },
  'Am': { name: 'Am', chord: [[1, 0], [2, 1, 1], [3, 2, 2], [4, 2, 3], [5, 0], [6, 'x']], position: 1 },
  'A#m': { name: 'A#m', chord: [[1, 1, 1], [2, 2, 2], [3, 3, 4], [4, 3, 3], [5, 1, 1], [6, 1, 1]], position: 1 },
  'Bm': { name: 'Bm', chord: [[1, 2, 1], [2, 3, 2], [3, 4, 4], [4, 4, 3], [5, 2, 1], [6, 2, 1]], position: 1 },
  
  // Sétima
  'C7': { name: 'C7', chord: [[1, 0], [2, 1, 1], [3, 3, 4], [4, 2, 2], [5, 3, 3], [6, 'x']], position: 1 },
  'D7': { name: 'D7', chord: [[1, 2, 2], [2, 1, 1], [3, 2, 3], [4, 0], [5, 'x'], [6, 'x']], position: 1 },
  'E7': { name: 'E7', chord: [[1, 0], [2, 0], [3, 1, 1], [4, 0], [5, 2, 2], [6, 0]], position: 1 },
  'F7': { name: 'F7', chord: [[1, 1, 1], [2, 1, 1], [3, 2, 2], [4, 1, 1], [5, 3, 4], [6, 1, 1]], position: 1 },
  'G7': { name: 'G7', chord: [[1, 1, 1], [2, 0], [3, 0], [4, 0], [5, 2, 2], [6, 3, 3]], position: 1 },
  'A7': { name: 'A7', chord: [[1, 0], [2, 2, 3], [3, 0], [4, 2, 2], [5, 0], [6, 'x']], position: 1 },
  'B7': { name: 'B7', chord: [[1, 2, 1], [2, 0], [3, 2, 2], [4, 1, 1], [5, 2, 3], [6, 2, 4]], position: 1 },
  
  // Maior com sétima
  'Cmaj7': { name: 'Cmaj7', chord: [[1, 0], [2, 0], [3, 0], [4, 2, 2], [5, 3, 3], [6, 'x']], position: 1 },
  'Dmaj7': { name: 'Dmaj7', chord: [[1, 2, 1], [2, 2, 1], [3, 2, 1], [4, 0], [5, 'x'], [6, 'x']], position: 1 },
  'Emaj7': { name: 'Emaj7', chord: [[1, 0], [2, 0], [3, 1, 1], [4, 1, 1], [5, 0], [6, 0]], position: 1 },
  'Fmaj7': { name: 'Fmaj7', chord: [[1, 0], [2, 1, 1], [3, 2, 2], [4, 3, 3], [5, 'x'], [6, 'x']], position: 1 },
  'Gmaj7': { name: 'Gmaj7', chord: [[1, 2, 1], [2, 0], [3, 0], [4, 0], [5, 2, 2], [6, 3, 3]], position: 1 },
  'Amaj7': { name: 'Amaj7', chord: [[1, 0], [2, 2, 2], [3, 1, 1], [4, 2, 3], [5, 0], [6, 'x']], position: 1 },
  'Bmaj7': { name: 'Bmaj7', chord: [[1, 2, 1], [2, 4, 3], [3, 3, 2], [4, 4, 4], [5, 2, 1], [6, 2, 1]], position: 1 },
  
  // Menor com sétima
  'Cm7': { name: 'Cm7', chord: [[1, 3, 1], [2, 4, 2], [3, 3, 1], [4, 5, 4], [5, 3, 1], [6, 3, 1]], position: 3 },
  'Dm7': { name: 'Dm7', chord: [[1, 1, 1], [2, 1, 1], [3, 2, 2], [4, 0], [5, 'x'], [6, 'x']], position: 1 },
  'Em7': { name: 'Em7', chord: [[1, 0], [2, 0], [3, 0], [4, 0], [5, 2, 2], [6, 0]], position: 1 },
  'F#m7': { name: 'F#m7', chord: [[1, 2, 1], [2, 2, 1], [3, 2, 1], [4, 2, 1], [5, 4, 3], [6, 2, 1]], position: 1 },
  'Gm7': { name: 'Gm7', chord: [[1, 3, 2], [2, 3, 3], [3, 3, 4], [4, 3, 1], [5, 5, 1], [6, 3, 2]], position: 3 },
  'Am7': { name: 'Am7', chord: [[1, 0], [2, 1, 1], [3, 0], [4, 2, 2], [5, 0], [6, 'x']], position: 1 },
  'Bm7': { name: 'Bm7', chord: [[1, 2, 1], [2, 0], [3, 2, 2], [4, 0], [5, 2, 3], [6, 2, 4]], position: 1 },
  
  // Suspendidos
  'Csus4': { name: 'Csus4', chord: [[1, 1, 1], [2, 1, 1], [3, 0], [4, 3, 4], [5, 3, 3], [6, 'x']], position: 1 },
  'Dsus4': { name: 'Dsus4', chord: [[1, 3, 3], [2, 3, 3], [3, 2, 2], [4, 0], [5, 'x'], [6, 'x']], position: 1 },
  'Esus4': { name: 'Esus4', chord: [[1, 0], [2, 0], [3, 2, 3], [4, 2, 2], [5, 2, 1], [6, 0]], position: 1 },
  'Gsus4': { name: 'Gsus4', chord: [[1, 1, 1], [2, 0], [3, 0], [4, 0], [5, 3, 4], [6, 3, 3]], position: 1 },
  'Asus4': { name: 'Asus4', chord: [[1, 0], [2, 3, 3], [3, 2, 2], [4, 2, 1], [5, 0], [6, 'x']], position: 1 },
  
  // Power chords
  'C5': { name: 'C5', chord: [[1, 'x'], [2, 3, 1], [3, 5, 3], [4, 5, 3], [5, 3, 1], [6, 'x']], position: 3 },
  'D5': { name: 'D5', chord: [[1, 'x'], [2, 'x'], [3, 0], [4, 2, 2], [5, 3, 3], [6, 'x']], position: 1 },
  'E5': { name: 'E5', chord: [[1, 0], [2, 'x'], [3, 2, 3], [4, 2, 2], [5, 0], [6, 0]], position: 1 },
  'F5': { name: 'F5', chord: [[1, 'x'], [2, 'x'], [3, 0], [4, 2, 2], [5, 3, 3], [6, 1, 1]], position: 1 },
  'G5': { name: 'G5', chord: [[1, 'x'], [2, 'x'], [3, 0], [4, 0], [5, 2, 2], [6, 3, 3]], position: 1 },
  'A5': { name: 'A5', chord: [[1, 'x'], [2, 'x'], [3, 2, 2], [4, 2, 2], [5, 0], [6, 'x']], position: 1 },
  'B5': { name: 'B5', chord: [[1, 'x'], [2, 'x'], [3, 4, 4], [4, 4, 3], [5, 2, 1], [6, 'x']], position: 1 },
};

interface ChordDiagramProps {
  chordName: string;
  semitones?: number;
  width?: number;
  height?: number;
}

export const ChordDiagram = ({ 
  chordName, 
  semitones = 0,
  width = 100, 
  height = 120 
}: ChordDiagramProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState(false);

  // Extrai o nome base do acorde (sem basso)
  const getBaseChord = (name: string): string => {
    // Remove notas de baixo (ex: C/G -> C)
    const bassRemoved = name.split('/')[0];
    // Remove extensões para matching (ex: Cadd9 -> C, mas mantém m, 7, maj7, etc.)
    const clean = bassRemoved
      .replace('maj7', 'maj7')
      .replace('m7', 'm7')
      .replace('7', '7')
      .replace('maj', 'maj')
      .replace('sus4', 'sus4')
      .replace('m', 'm')
      .replace('5', '5');
    return clean;
  };

  // Transpõe o acorde
  const transposeChordName = (name: string, semis: number): string => {
    if (semis === 0) return name;
    
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    // Encontra a nota base
    let rootNote = '';
    let suffix = '';
    
    if (name.startsWith('C#') || name.startsWith('Db')) {
      rootNote = 'C#';
      suffix = name.slice(2);
    } else if (name.startsWith('D#') || name.startsWith('Eb')) {
      rootNote = 'D#';
      suffix = name.slice(2);
    } else if (name.startsWith('F#') || name.startsWith('Gb')) {
      rootNote = 'F#';
      suffix = name.slice(2);
    } else if (name.startsWith('G#') || name.startsWith('Ab')) {
      rootNote = 'G#';
      suffix = name.slice(2);
    } else if (name.startsWith('A#') || name.startsWith('Bb')) {
      rootNote = 'A#';
      suffix = name.slice(2);
    } else {
      rootNote = name[0];
      suffix = name.slice(1);
    }
    
    const currentIndex = notes.indexOf(rootNote);
    if (currentIndex === -1) return name;
    
    const newIndex = (currentIndex + semis + 12) % 12;
    return notes[newIndex] + suffix;
  };

  const transposedChord = transposeChordName(chordName, semitones);
  const chordData = STANDARD_CHORDS[transposedChord] || STANDARD_CHORDS[getBaseChord(transposedChord)];

  useEffect(() => {
    if (!containerRef.current || !chordData) {
      setError(true);
      return;
    }

    try {
      // Limpa o container
      containerRef.current.innerHTML = '';
      
      // Cria SVG do diagrama
      draw(containerRef.current, chordData.chord, {
        width: width,
        height: height,
        stringWidth: 1,
        fretWidth: 1.5,
        circleRadius: 4,
        numFrets: 4,
        showTuning: false,
        positionTextSize: 10,
        nutSize: 0.6,
        position: chordData.position,
      });
      
      setError(false);
    } catch (err) {
      console.error('Error rendering chord diagram:', err);
      setError(true);
    }
  }, [chordData, width, height]);

  if (error || !chordData) {
    return (
      <div className="chord-diagram-fallback flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-dashed border-slate-300 dark:border-slate-600" style={{ width, height }}>
        <span className="chord-name text-sm font-semibold text-slate-500 dark:text-slate-400">{transposedChord}</span>
      </div>
    );
  }

  return (
    <div className="chord-diagram-wrapper flex flex-col items-center p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
      <div ref={containerRef} className="chord-diagram-container flex justify-center items-center">
        <style jsx>{`
          .chord-diagram-container :global(svg circle) {
            fill: #10b981 !important;
          }
          .chord-diagram-container :global(svg line) {
            stroke: #6b7280 !important;
          }
          .chord-diagram-container :global(svg rect) {
            fill: none;
            stroke: #6b7280 !important;
          }
          .chord-diagram-container :global(svg text) {
            fill: #6b7280 !important;
            font-family: system-ui, -apple-system, sans-serif !important;
          }
        `}</style>
      </div>
      <span className="chord-diagram-name mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 text-center">{transposedChord}</span>
    </div>
  );
};

// Componente para mostrar múltiplos diagramas
interface ChordDiagramPanelProps {
  chords: string[];
  semitones?: number;
}

export const ChordDiagramPanel = ({ chords, semitones = 0 }: ChordDiagramPanelProps) => {
  // Remove duplicatas mantendo ordem
  const uniqueChords = Array.from(new Set(chords));

  return (
    <div className="chord-diagram-panel bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
      <h3 className="panel-title flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
        Diagramas de Acordes
      </h3>
      <div className="chord-diagrams-grid grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 max-h-[400px] overflow-y-auto pr-2">
        {uniqueChords.map((chord, index) => (
          <ChordDiagram 
            key={`${chord}-${index}`} 
            chordName={chord} 
            semitones={semitones}
            width={90}
            height={110}
          />
        ))}
      </div>
    </div>
  );
};

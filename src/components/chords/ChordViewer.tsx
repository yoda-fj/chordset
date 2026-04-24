'use client';

import { useMemo } from 'react';
import { transposeChord } from '@/utils/chords';

interface ChordViewerProps {
  chordProContent: string;
  semitones: number;
  title?: string;
  artist?: string;
  fontSize?: number;
  isFullscreen?: boolean;
  showTablatura?: boolean;
}

interface ChordPosition {
  chord: string;
  position: number;
  displayPosition: number;
}

export const ChordViewer = ({
  chordProContent,
  semitones,
  title,
  artist,
  fontSize = 16,
  isFullscreen = false,
  showTablatura = true
}: ChordViewerProps) => {
  
  // Detecta se uma linha é tablatura (e.g., e|--2-2---|)
  const isTabLine = (line: string): boolean => {
    const trimmed = line.trim();
    // Tab lines start with a string identifier (e, B, G, D, A, E) followed by |
    // and contain mostly tab characters (digits, -, |, /, \, h, ~)
    // Allow repeat annotations like (8x) at the end
    const tabPattern = /^[a-gA-G]\|[-|0-9\-~h\//\\\s]+\(?[0-9]*x?\)?.*$/i;
    return tabPattern.test(trimmed);
  };

  const parsedLines = useMemo(() => {
    const lines: { 
      type: 'section' | 'chords' | 'lyrics' | 'empty' | 'directive' | 'tab'; 
      content?: string; 
      chords?: ChordPosition[];
    }[] = [];
    
    const rawLines = chordProContent.split('\n');
    
    for (const line of rawLines) {
      const trimmedLine = line.trim();
      
      // Section header {verse}, {chorus}, etc.
      const sectionMatch = line.match(/^\{\s*(verse|chorus|bridge|intro|outro|solo|pre-chorus|interlude)/i);
      if (sectionMatch) {
        const sectionName = line.replace(/[{}]/g, '').trim().toUpperCase();
        lines.push({ type: 'section', content: sectionName });
        continue;
      }
      
      // Skip other directives {title, artist, key}
      if (line.startsWith('{')) {
        continue;
      }
      
      // Empty line
      if (!trimmedLine) {
        lines.push({ type: 'empty' });
        continue;
      }
      
      // Detect tablature lines
      if (isTabLine(line)) {
        if (!showTablatura) {
          // Se a linha anterior for acordes, removemos também (é a cifra do riff)
          const lastLine = lines.length > 0 ? lines[lines.length - 1] : null;
          if (lastLine && lastLine.type === 'chords') {
            lines.pop();
          }
          continue; // skip tab lines when hidden
        }
        lines.push({ type: 'tab', content: line });
        continue;
      }
      
      // Parse chord line
      const chords: ChordPosition[] = [];
      let plainText = '';
      let i = 0;
      
      while (i < line.length) {
        if (line[i] === '[') {
          const endBracket = line.indexOf(']', i);
          if (endBracket !== -1) {
            const chord = line.slice(i + 1, endBracket);
            const transposedChord = semitones !== 0 
              ? transposeChord(chord, semitones) 
              : chord;
            
            chords.push({
              chord: transposedChord,
              position: plainText.length,
              displayPosition: plainText.length
            });
            
            i = endBracket + 1;
            continue;
          }
        }
        
        plainText += line[i];
        i++;
      }
      
      // Ajusta posições de acordes consecutivos para evitar sobreposição
      if (chords.length > 1) {
        for (let j = 1; j < chords.length; j++) {
          const prevChord = chords[j - 1];
          const currChord = chords[j];

          // Calcula quanto espaço o acorde anterior ocupa
          const prevChordWidth = prevChord.chord.length;

          // Se a posição atual é próxima ou sobrepõe a posição acumulada do anterior,
          // ajusta para ficar logo após o acorde anterior
          if (currChord.position <= prevChord.position + prevChordWidth) {
            currChord.displayPosition = prevChord.displayPosition + prevChordWidth;
          }
        }
      }
      
      if (chords.length > 0) {
        lines.push({ 
          type: 'chords', 
          content: plainText,
          chords 
        });
      } else {
        lines.push({ type: 'lyrics', content: line });
      }
    }
    
    return lines;
  }, [chordProContent, semitones, showTablatura]);

  return (
    <div className={`chord-viewer bg-slate-50 dark:bg-slate-900 rounded-lg p-6 font-sans leading-relaxed ${isFullscreen ? 'min-h-full pt-16' : 'min-h-0'}`}>
      {(title || artist) && (
        <div className="song-header mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          {title && <h1 className="song-title text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>}
          {artist && <p className="song-artist text-lg text-slate-600 dark:text-slate-400">{artist}</p>}
        </div>
      )}
      
      <div className="chord-sheet leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
        {parsedLines.map((line, lineIndex) => {
          if (line.type === 'section') {
            return (
              <div key={lineIndex} className="section-header text-indigo-600 dark:text-indigo-400 font-bold text-sm uppercase tracking-wider my-6 py-2 border-b-2 border-indigo-200 dark:border-indigo-800">
                {line.content}
              </div>
            );
          }
          
          if (line.type === 'empty') {
            return <div key={lineIndex} className="h-4" />;
          }
          
          if (line.type === 'lyrics') {
            return (
              <div key={lineIndex} className="lyrics-line-only text-slate-700 dark:text-slate-300 py-0.5 whitespace-pre-wrap font-sans">
                {line.content}
              </div>
            );
          }
          
          if (line.type === 'tab') {
            return (
              <div key={lineIndex} className="relative group">
                <pre className="tab-line text-amber-600 dark:text-amber-400 py-0.5 font-mono text-sm leading-relaxed opacity-80">
                  {line.content}
                </pre>
                <span className="absolute -top-3 right-0 text-xs text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  ⏸ Tablatura - não transpõe
                </span>
              </div>
            );
          }
          
          if (line.type === 'chords' && line.chords && line.chords.length > 0) {
            const text = line.content || '';
            const CHAR_WIDTH = 8.5; // Approximate pixel width of a character (monospace)

            return (
              <div key={lineIndex} className="chord-line-container my-2 relative min-h-[3.2rem]">
                <div className="chords-row absolute top-0 left-0 right-0 h-5 font-mono pointer-events-none whitespace-nowrap">
                  {line.chords.map((chordPos, idx) => (
                    <span
                      key={idx}
                      className="chord-above absolute text-emerald-600 dark:text-emerald-400 font-bold text-sm whitespace-nowrap hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded px-0.5 cursor-pointer transition-colors"
                      style={{
                        left: `${chordPos.displayPosition * CHAR_WIDTH}px`
                      }}
                    >
                      {chordPos.chord}
                    </span>
                  ))}
                </div>
                <div className="lyrics-row text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed pt-5 font-mono text-sm">
                  {text}
                </div>
              </div>
            );
          }
          
          return null;
        })}
      </div>
    </div>
  );
};

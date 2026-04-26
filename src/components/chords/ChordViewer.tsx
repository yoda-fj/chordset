'use client';

import { useMemo } from 'react';
import { transposeChord } from '@/utils/chords';
import { isTextChordFormat } from '@/utils/chordpro-converter';

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

// Detecta se o conteúdo é formato ChordPro (tem [acordes] entre colchetes)
const isChordProFormat = (content: string): boolean => {
  return /\[[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9]|M|°|ø|\+)*(?:\/[A-G][#b]?)?\]/.test(content);
};

export const ChordViewer = ({
  chordProContent,
  semitones,
  title,
  artist,
  fontSize = 16,
  isFullscreen = false,
  showTablatura = true
}: ChordViewerProps) => {

  // Detecta formato da cifra
  const format = useMemo(() => {
    if (isChordProFormat(chordProContent)) return 'chordpro';
    if (isTextChordFormat(chordProContent)) return 'text';
    return 'chordpro'; // fallback
  }, [chordProContent]);

  // Detecta se uma linha é tablatura (e.g., e|--2-2---|)
  const isTabLine = (line: string): boolean => {
    const trimmed = line.trim();
    const tabPattern = /^[a-gA-G]\|[-|0-9\-~h\//\\\s]+\(?[0-9]*x?\)?.*$/i;
    return tabPattern.test(trimmed);
  };

  // Detecta se uma linha é de palhetadas (e.g., ↓ ↓ ↑ ↓ ↑ ↓ ↓ ↓ ↑ ↓ ↑)
  const isStrummingLine = (line: string): boolean => {
    const trimmed = line.trim();
    const strumPattern = /^[↓↑→←↓↑→←\s]+$/;
    return strumPattern.test(trimmed) && /[↓↑→←↓↑→←]/.test(trimmed);
  };

  // ======== PARSER FORMATO TEXTO (Cifra Club nativo) ========
  const parsedTextLines = useMemo(() => {
    if (format !== 'text') return [];

    const lines: {
      type: 'section' | 'chords' | 'lyrics' | 'empty' | 'tab';
      content: string;
    }[] = [];

    const rawLines = chordProContent.split('\n');

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmedLine = line.trim();

      // Empty line
      if (!trimmedLine) {
        lines.push({ type: 'empty', content: '' });
        continue;
      }

      // Section header [Intro], [Primeira Parte], etc.
      const sectionMatch = line.match(/^\[(.+?)\]\s*$/);
      if (sectionMatch) {
        lines.push({ type: 'section', content: sectionMatch[1] });
        continue;
      }

      // Tablature
      if (isTabLine(line)) {
        if (!showTablatura) continue;
        lines.push({ type: 'tab', content: line });
        continue;
      }

      // Check if this is a chord line (mostly chords and spaces)
      const chordLineRegex = /^[\s]*[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9]|M|°|ø|\+)*(?:\/[A-G][#b]?)?(?:\s+[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9]|M|°|ø|\+)*(?:\/[A-G][#b]?)?)*\s*$/;
      const isChordLine = chordLineRegex.test(line);

      if (isChordLine && semitones !== 0) {
        // Transpose chords in the line
        const transposedLine = line.replace(/[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|[0-9]|M|°|ø|\+)*(?:\/[A-G][#b]?)?/g, (match) => {
          if (!match.trim()) return match;
          return transposeChord(match.trim(), semitones);
        });
        lines.push({ type: 'chords', content: transposedLine });
      } else if (isChordLine) {
        lines.push({ type: 'chords', content: line });
      } else {
        lines.push({ type: 'lyrics', content: line });
      }
    }

    return lines;
  }, [chordProContent, format, semitones, showTablatura]);

  // ======== PARSER FORMATO CHORDPRO (colchetes) ========
  const parsedChordProLines = useMemo(() => {
    if (format !== 'chordpro') return [];

    const lines: { 
      type: 'section' | 'chords' | 'lyrics' | 'empty' | 'directive' | 'tab'; 
      content?: string; 
      chords?: ChordPosition[];
    }[] = [];

    const rawLines = chordProContent.split('\n');

    // Pré-análise: descobrir quais linhas fazem parte de blocos de tablatura
    const linesToSkip = new Set<number>();

    if (!showTablatura) {
      for (let i = 0; i < rawLines.length; i++) {
        if (isTabLine(rawLines[i])) {
          // Encontrou tablatura - marca o bloco inteiro

          // 1. Verifica se a linha anterior é acordes (cifra do riff)
          if (i > 0) {
            const prevLine = rawLines[i - 1].trim();
            const hasChords = /\[[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|4|5|6|7add9|7sus4)*\]/.test(prevLine) ||
                              /^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|4|5|6|7add9|7sus4)*(?:\s+[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|4|5|6|7add9|7sus4)*)*$/.test(prevLine);
            if (hasChords) {
              linesToSkip.add(i - 1);
            }
          }

          // 2. Marca todas as linhas de tablatura consecutivas
          let j = i;
          while (j < rawLines.length && isTabLine(rawLines[j])) {
            linesToSkip.add(j);
            j++;
          }

          // 3. Marca a linha de palhetadas que vem depois (se houver)
          if (j < rawLines.length && isStrummingLine(rawLines[j])) {
            linesToSkip.add(j);
          }

          // Avança o índice para depois do bloco
          i = j;
        }
      }
    }

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmedLine = line.trim();

      // Se esta linha deve ser pulada (parte do bloco de tablatura escondido)
      if (linesToSkip.has(i)) {
        continue;
      }

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

      // Detect tablature lines (normalmente já pego pelo linesToSkip, mas mantém pra segurança)
      if (isTabLine(line)) {
        if (!showTablatura) {
          continue;
        }
        lines.push({ type: 'tab', content: line });
        continue;
      }

      // Parse chord line
      const chords: ChordPosition[] = [];
      let plainText = '';
      let idx = 0;

      while (idx < line.length) {
        if (line[idx] === '[') {
          const endBracket = line.indexOf(']', idx);
          if (endBracket !== -1) {
            const chord = line.slice(idx + 1, endBracket);
            const transposedChord = semitones !== 0
              ? transposeChord(chord, semitones)
              : chord;

            chords.push({
              chord: transposedChord,
              position: plainText.length,
              displayPosition: plainText.length
            });

            idx = endBracket + 1;
            continue;
          }
        }

        plainText += line[idx];
        idx++;
      }

      // Ajusta posições de acordes consecutivos para evitar sobreposição
      if (chords.length > 1) {
        for (let j = 1; j < chords.length; j++) {
          const prevChord = chords[j - 1];
          const currChord = chords[j];

          const prevChordWidth = prevChord.chord.length;

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
  }, [chordProContent, semitones, showTablatura, format]);

  return (
    <div className={`chord-viewer bg-slate-50 dark:bg-slate-900 rounded-lg p-6 font-sans leading-relaxed ${isFullscreen ? 'min-h-full pt-16' : 'min-h-0'}`}>
      {(title || artist) && (
        <div className="song-header mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
          {title && <h1 className="song-title text-2xl font-bold text-slate-900 dark:text-white mb-2">{title}</h1>}
          {artist && <p className="song-artist text-lg text-slate-600 dark:text-slate-400">{artist}</p>}
        </div>
      )}

      {/* ======== RENDERIZAÇÃO FORMATO TEXTO ======== */}
      {format === 'text' && (
        <pre
          className="chord-sheet leading-relaxed font-mono text-slate-800 dark:text-slate-200"
          style={{
            fontSize: `${fontSize}px`,
            whiteSpace: 'pre',
          }}
        >
          {parsedTextLines.map((line, lineIndex) => {
            if (line.type === 'section') {
              return (
                <div key={lineIndex} className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider my-4 py-2 border-b-2 border-indigo-200 dark:border-indigo-800">
                  [{line.content}]
                </div>
              );
            }

            if (line.type === 'empty') {
              return <div key={lineIndex} className="h-4" />;
            }

            if (line.type === 'tab') {
              return (
                <div key={lineIndex} className="text-amber-600 dark:text-amber-400 opacity-80">
                  {line.content}
                </div>
              );
            }

            if (line.type === 'chords') {
              return (
                <div key={lineIndex} className="text-emerald-600 dark:text-emerald-400 font-bold whitespace-pre">
                  {line.content}
                </div>
              );
            }

            // lyrics
            return (
              <div key={lineIndex} className="whitespace-pre">
                {line.content}
              </div>
            );
          })}
        </pre>
      )}

      {/* ======== RENDERIZAÇÃO FORMATO CHORDPRO ======== */}
      {format === 'chordpro' && (
        <div className="chord-sheet leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
          {parsedChordProLines.map((line, lineIndex) => {
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
              const CHAR_WIDTH = 8.5;

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
      )}
    </div>
  );
};

'use client';

import { useMemo } from 'react';
import {
  parseTextCifra,
  parseChordProCifra,
  type ChordSegment,
  type ParsedCifraLine,
} from './chord-parser';
import { isTextChordFormat } from '@/utils/chordpro-converter';

interface ChordViewerProps {
  chordProContent: string;
  title?: string;
  artist?: string;
  fontSize?: number;
  isFullscreen?: boolean;
  showTablatura?: boolean;
}

// Detecta se o conteúdo é formato ChordPro (tem [acordes] entre colchetes)
const isChordProFormat = (content: string): boolean => {
  return /\[[A-G][#b]?(?:maj|min|dim|aug|sus|add|[0-9]|m|M|°|ø|\+)*(?:\/[A-G][#b]?)?\]/.test(content);
};

/**
 * Segmento empilhado: acorde sobre a sílaba (padrão ChordSheetJS).
 * Como acorde e letra vivem na mesma coluna inline-flex, o zoom
 * (fontSize) escala os dois juntos e o alinhamento NUNCA quebra —
 * não há medida em px (fim do CHAR_WIDTH=8.5).
 */
function StackedSegment({ segment }: { segment: ChordSegment }) {
  return (
    <span className="inline-flex flex-col align-bottom">
      <span className="whitespace-pre font-bold leading-none text-chord pb-1">
        {segment.chord || ' '}
      </span>
      <span className="whitespace-pre leading-snug text-ink">
        {segment.lyric || ' '}
      </span>
    </span>
  );
}

function CifraLine({ line, textFormat }: { line: ParsedCifraLine; textFormat: boolean }) {
  switch (line.type) {
    case 'section':
      return (
        <div className="my-4 border-b-2 border-section/30 py-2 font-bold uppercase tracking-wider text-section">
          {textFormat ? `[${line.content}]` : line.content}
        </div>
      );

    case 'empty':
      return <div className="h-4" />;

    case 'tab':
      return (
        <div className="group relative">
          <pre className="tab-line font-chord leading-relaxed text-tab opacity-80">
            {line.content}
          </pre>
          <span className="pointer-events-none absolute -top-3 right-0 rounded bg-surface-overlay px-1 text-xs text-tab opacity-0 transition-opacity group-hover:opacity-100">
            ⏸ Tablatura — não transpõe
          </span>
        </div>
      );

    case 'chords':
      return (
        <div className="chord-line my-3 font-chord">
          {line.segments?.map((seg, segIndex) => (
            <StackedSegment key={segIndex} segment={seg} />
          ))}
        </div>
      );

    default:
      return (
        <div className="lyrics-line whitespace-pre-wrap py-0.5 text-ink">
          {line.content}
        </div>
      );
  }
}

export const ChordViewer = ({
  chordProContent,
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

  // Parser puro (testado em chord-parser.test.ts) — ambos os formatos
  // viram segmentos { chord, lyric } renderizados empilhados.
  const lines = useMemo<ParsedCifraLine[]>(() => {
    return format === 'text'
      ? parseTextCifra(chordProContent, showTablatura)
      : parseChordProCifra(chordProContent, showTablatura);
  }, [chordProContent, format, showTablatura]);

  return (
    <div className={`chord-viewer print-cifra rounded-lg bg-surface-raised p-6 leading-relaxed ${isFullscreen ? 'min-h-full pt-16' : 'min-h-0'}`}>
      {(title || artist) && (
        <div className="song-header mb-6 border-b pb-4">
          {title && <h1 className="song-title mb-2 font-display text-2xl font-bold text-ink">{title}</h1>}
          {artist && <p className="song-artist text-lg text-ink-muted">{artist}</p>}
        </div>
      )}

      <div className="chord-sheet" style={{ fontSize: `${fontSize}px` }}>
        {lines.map((line, lineIndex) => (
          <CifraLine key={lineIndex} line={line} textFormat={format === 'text'} />
        ))}
      </div>
    </div>
  );
};

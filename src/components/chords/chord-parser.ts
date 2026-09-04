// =====================================
// PARSER PURO DE CIFRAS (sem React)
// Converte linhas de cifra em segmentos { chord, lyric }
// para render empilhado (acorde sobre sílaba) — o zoom
// (fontSize) nunca desalinha porque não há medida em px.
// =====================================

import { isTabLine, isStrummingLine } from '@/utils/chord-transposer';

export interface ChordSegment {
  /** Acorde sobre o trecho ('' = trecho só de letra) */
  chord: string;
  /** Texto da letra sob o acorde (pode conter espaços — preservar) */
  lyric: string;
}

export type CifraLineType = 'section' | 'chords' | 'lyrics' | 'empty' | 'tab';

export interface ParsedCifraLine {
  type: CifraLineType;
  /** section: nome da seção | tab: linha crua | lyrics: texto */
  content?: string;
  /** type === 'chords': segmentos acorde/sílaba empilhados */
  segments?: ChordSegment[];
}

// Token de acorde. ATENÇÃO: a alternância vai da mais longa pra mais
// curta (maj/min antes de m) — matchAll é global e NÃO faz backtracking
// quando o match parcial já é válido ("Cmaj7" casaria como "Cm").
const CHORD_TOKEN_RE = /[A-G][#b]?(?:maj|min|dim|aug|sus|add|[0-9]|m|M|°|ø|\+)*(?:\/[A-G][#b]?)?/g;

// Linha inteira só de acordes espaçados (formato texto, estilo Cifra Club)
const CHORD_LINE_RE = /^\s*[A-G][#b]?(?:maj|min|dim|aug|sus|add|[0-9]|m|M|°|ø|\+)*(?:\/[A-G][#b]?)?(?:\s+[A-G][#b]?(?:maj|min|dim|aug|sus|add|[0-9]|m|M|°|ø|\+)*(?:\/[A-G][#b]?)?)*\s*$/;

const SECTION_LINE_RE = /^\[(.+?)\]\s*$/;

/** Linha (formato texto) composta apenas por acordes separados por espaços */
export const isSpacedChordLine = (line: string): boolean =>
  line.trim().length > 0 && CHORD_LINE_RE.test(line);

/** Linha de seção tipo "[Intro]", "[Primeira Parte]" */
export const isSectionLine = (line: string): boolean => SECTION_LINE_RE.test(line);

/**
 * Par acorde/sílaba a partir de uma linha de acordes espaçada
 * e a linha de letra logo abaixo (formato texto / Cifra Club).
 * Cada acorde ancora na coluna em que aparece; a letra é fatiada
 * entre as âncoras. Se a letra for mais curta, é preenchida com espaços.
 */
export function parseSpacedPair(chordLine: string, lyricLine: string): ChordSegment[] {
  const tokens = [...chordLine.matchAll(CHORD_TOKEN_RE)];
  if (tokens.length === 0) {
    return lyricLine ? [{ chord: '', lyric: lyricLine }] : [];
  }

  const segments: ChordSegment[] = [];
  const firstOffset = tokens[0].index ?? 0;

  // Texto da letra antes do primeiro acorde (sem acorde sobre ele)
  if (firstOffset > 0) {
    segments.push({ chord: '', lyric: lyricLine.slice(0, firstOffset) });
  }

  // Letra mais curta que a posição do acorde: preenche com espaços
  const paddedLyric = (from: number) =>
    lyricLine.length < from ? lyricLine.padEnd(from) : lyricLine;

  for (let i = 0; i < tokens.length; i++) {
    const start = tokens[i].index ?? 0;
    const end = i + 1 < tokens.length ? (tokens[i + 1].index ?? undefined) : undefined;
    const lyric =
      end === undefined
        ? paddedLyric(start).slice(start)
        : (lyricLine.length < end ? lyricLine.padEnd(end) : lyricLine).slice(start, end);
    segments.push({ chord: tokens[i][0], lyric });
  }

  return segments;
}

/**
 * Linha só de acordes (riff/intro sem letra). Os espaços entre
 * acordes viram "lyric" de espaçamento para manter o respiro visual.
 */
export function parseSpacedChordLine(chordLine: string): ChordSegment[] {
  const tokens = [...chordLine.matchAll(CHORD_TOKEN_RE)];
  if (tokens.length === 0) return [];

  const segments: ChordSegment[] = [];
  const firstOffset = tokens[0].index ?? 0;
  if (firstOffset > 0) {
    segments.push({ chord: '', lyric: ' '.repeat(firstOffset) });
  }

  for (let i = 0; i < tokens.length; i++) {
    const chord = tokens[i][0];
    const start = tokens[i].index ?? 0;
    const nextStart = i + 1 < tokens.length ? (tokens[i + 1].index ?? null) : null;
    const gap = nextStart === null ? 0 : Math.max(1, nextStart - (start + chord.length));
    segments.push({ chord, lyric: ' '.repeat(gap) });
  }

  return segments;
}

/**
 * Linha no formato ChordPro: "Eu [Am]sei que [G]vou te [F]amar"
 * → segmentos com o acorde ancorado no texto que o segue.
 */
export function parseChordProLine(line: string): ChordSegment[] {
  const segments: ChordSegment[] = [];
  let current: ChordSegment = { chord: '', lyric: '' };
  let idx = 0;

  while (idx < line.length) {
    if (line[idx] === '[') {
      const endBracket = line.indexOf(']', idx);
      if (endBracket !== -1) {
        if (current.chord || current.lyric) segments.push(current);
        current = { chord: line.slice(idx + 1, endBracket), lyric: '' };
        idx = endBracket + 1;
        continue;
      }
    }
    current.lyric += line[idx];
    idx++;
  }

  if (current.chord || current.lyric) segments.push(current);
  return segments;
}

/**
 * Cifra completa no formato texto (acordes em linha própria acima da letra).
 * Emparelha cada linha de acordes com a linha de letra seguinte.
 */
export function parseTextCifra(content: string, showTablatura = true): ParsedCifraLine[] {
  const out: ParsedCifraLine[] = [];
  const rawLines = content.split('\n');

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      out.push({ type: 'empty', content: '' });
      continue;
    }

    const sectionMatch = line.match(SECTION_LINE_RE);
    if (sectionMatch) {
      out.push({ type: 'section', content: sectionMatch[1] });
      continue;
    }

    if (isTabLine(line)) {
      if (showTablatura) out.push({ type: 'tab', content: line });
      continue;
    }

    if (isSpacedChordLine(line)) {
      const next = rawLines[i + 1];
      const nextIsLyric =
        next !== undefined &&
        next.trim() !== '' &&
        !isSpacedChordLine(next) &&
        !isTabLine(next) &&
        !isSectionLine(next);

      if (nextIsLyric) {
        out.push({ type: 'chords', segments: parseSpacedPair(line, next) });
        i++; // consome a linha de letra
      } else {
        out.push({ type: 'chords', segments: parseSpacedChordLine(line) });
      }
      continue;
    }

    out.push({ type: 'lyrics', content: line });
  }

  return out;
}

/**
 * Cifra completa no formato ChordPro (acordes entre [colchetes]).
 * Preserva: diretivas {section}, blocos de tablatura (com cifra do riff
 * e linha de palhetada) escondidos quando showTablatura = false.
 */
export function parseChordProCifra(content: string, showTablatura = true): ParsedCifraLine[] {
  const out: ParsedCifraLine[] = [];
  const rawLines = content.split('\n');

  // Pré-análise: linhas que fazem parte de blocos de tablatura a esconder
  const linesToSkip = new Set<number>();

  if (!showTablatura) {
    for (let i = 0; i < rawLines.length; i++) {
      if (isTabLine(rawLines[i])) {
        // 1. Linha anterior pode ser a cifra do riff
        if (i > 0) {
          const prevLine = rawLines[i - 1].trim();
          const hasChords =
            /\[[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|4|5|6|7add9|7sus4)*\]/.test(prevLine) ||
            /^[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|4|5|6|7add9|7sus4)*(?:\s+[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|4|5|6|7add9|7sus4)*)*$/.test(prevLine);
          if (hasChords) linesToSkip.add(i - 1);
        }

        // 2. Linhas de tablatura consecutivas
        let j = i;
        while (j < rawLines.length && isTabLine(rawLines[j])) {
          linesToSkip.add(j);
          j++;
        }

        // 3. Linha de palhetadas logo depois (se houver)
        if (j < rawLines.length && isStrummingLine(rawLines[j])) {
          linesToSkip.add(j);
        }

        i = j;
      }
    }
  }

  for (let i = 0; i < rawLines.length; i++) {
    const line = rawLines[i];
    const trimmed = line.trim();

    if (linesToSkip.has(i)) continue;

    // {verse}, {chorus}, etc.
    const sectionMatch = line.match(/^\{\s*(verse|chorus|bridge|intro|outro|solo|pre-chorus|interlude)/i);
    if (sectionMatch) {
      out.push({ type: 'section', content: line.replace(/[{}]/g, '').trim().toUpperCase() });
      continue;
    }

    // Outras diretivas {title, artist, key} são ignoradas
    if (line.startsWith('{')) continue;

    if (!trimmed) {
      out.push({ type: 'empty' });
      continue;
    }

    if (isTabLine(line)) {
      if (showTablatura) out.push({ type: 'tab', content: line });
      continue;
    }

    const segments = parseChordProLine(line);
    const hasChords = segments.some((s) => s.chord !== '');

    if (hasChords) {
      out.push({ type: 'chords', segments });
    } else {
      out.push({ type: 'lyrics', content: line });
    }
  }

  return out;
}

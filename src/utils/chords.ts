import { Chord, Note, Interval } from '@tonaljs/tonal';

export const transposeChord = (chord: string, semitones: number): string => {
  const parsed = Chord.get(chord);
  if (!parsed || parsed.empty) return chord;

  const interval = Interval.fromSemitones(semitones);
  const transposedRoot = Note.transpose(parsed.tonic || 'C', interval);
  const transposedChord = Chord.getChord(parsed.aliases[0] || 'major', transposedRoot);
  
  return transposedChord.symbol || chord;
};

// Extrai acordes de conteúdo ChordPro
export const extractChords = (chordProContent: string): string[] => {
  const chords: string[] = [];
  const chordPattern = /\[([^\]]+)\]/g;
  let match;
  
  while ((match = chordPattern.exec(chordProContent)) !== null) {
    chords.push(match[1]);
  }
  
  return Array.from(new Set(chords)); // Remove duplicatas
};

// Extrai tom da cifra (procura por "Tom:" ou diretivas {key})
export const extractKey = (content: string): string | null => {
  // Procura por diretiva ChordPro {key: X}
  const keyMatch = content.match(/\{key:\s*([^}]+)\}/i);
  if (keyMatch) return keyMatch[1].trim();
  
  // Procura por linha com "Tom:"
  const tomMatch = content.match(/[Tt]om[:\s]+([A-G][#b]?m?)/);
  if (tomMatch) return tomMatch[1].trim();
  
  return null;
};

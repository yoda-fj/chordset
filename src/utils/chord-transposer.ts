// =====================================
// UTILITÁRIO DE TRANSPOSIÇÃO DE ACORDES
// =====================================

// Notas cromáticas em ordem
const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTAS_BEMOL = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// Mapa de equivalência sustenido → bemol
const SHARP_TO_FLAT: Record<string, string> = {
  'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb',
};

// Mapa de equivalência bemol → sustenido
const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
};

/**
 * Normaliza o nome da nota pra formato de sustenido
 */
function normalizeNote(nota: string): string {
  // Se tem bemol, converte pra sustenido
  if (nota.includes('b') && !nota.includes('#')) {
    // É um bemol simples (ex: Db, Eb)
    const bemol = nota.replace('b', '').toUpperCase();
    const idx = NOTAS_BEMOL.indexOf(nota);
    if (idx !== -1) {
      return NOTAS[idx];
    }
  }
  
  // Retorna a nota em maiúsculas
  const match = nota.match(/^([A-G][#b]?)/i);
  if (match) {
    const base = match[1].toUpperCase();
    // Normaliza pra formato consistente
    if (FLAT_TO_SHARP[base]) {
      return FLAT_TO_SHARP[base];
    }
    return base;
  }
  return nota.toUpperCase();
}

/**
 * Extrai o índice da nota no círculo cromático
 */
function getNoteIndex(nota: string): number {
  const normalized = normalizeNote(nota);
  return NOTAS.indexOf(normalized);
}

/**
 * Transpõe uma nota por um número de semitons
 */
function transposeNote(nota: string, semitons: number): string {
  const idx = getNoteIndex(nota);
  if (idx === -1) return nota;
  
  const newIdx = ((idx + semitons) % 12 + 12) % 12;
  return NOTAS[newIdx];
}

/**
 * Transpõe um acorde completo (ex: Am7, D#m, G7)
 */
function transposeChord(chord: string, semitons: number): string {
  // Regex pra capturar nota base + qualidade do acorde
  // Exemplos: A, Am, Am7, D#m, G7, Cmaj7, Bdim, etc.
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  
  const [, nota, qualidade] = match;
  const transposedNota = transposeNote(nota, semitons);
  
  return transposedNota + qualidade;
}

/**
 * Transpõe uma linha de cifra inteira
 * Lida com padrões como:
 * - Acordes isolados: Am  G  F
 * - Acordes com cifra: Am                    G
 * - Linhas sem acordes
 * - NÃO transpõe linhas de tablatura
 */
export function transposeLine(line: string, semitons: number): string {
  if (semitons === 0) return line;
  
  // Pula linhas de tablatura (e.g., e|--2-2---|)
  // Linhas de tab começam com letra de corda seguida de |
  if (/^[a-gA-G]\|[-|0-9\-~h\//\\\s]+\(?[0-9]*x?\)?.*$/i.test(line.trim())) {
    return line;
  }
  
  // Padrão pra encontrar acordes na linha
  // Um acorde pode estar no início da linha ou depois de espaços
  // Exemplos: "Am G F", "        Am", "Am                   G"
  const chordPattern = /([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|Maj|min|m)*\d*)/g;
  
  return line.replace(chordPattern, (match) => {
    return transposeChord(match, semitons);
  });
}

// Pula linha se for tablatura
const isTabLine = (line: string): boolean => {
  const trimmed = line.trim();
  return /^[a-gA-G]\|[-|0-9\-~h\//\\\s]+\(?[0-9]*x?\)?.*$/i.test(trimmed);
};

// Pula linha se for só acorde(s) na mesma linha (sem letra)
const isChordOnlyLine = (line: string): boolean => {
  const trimmed = line.trim();
  // Se a linha só contém acordes separados por espaços (sem letras minúsculas que seriam letra)
  // Ex: "A D/A", "Am G Dm"
  const chordOnlyPattern = /^(?:[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|Maj|min|m)*\d*(?:\/[A-G][#b]?)?\s+)*[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|Maj|min|m)*\d*(?:\/[A-G][#b]?)?$/;
  return chordOnlyPattern.test(trimmed);
};

/**
 * Transpõe toda a cifra
 */
export function transposeCifra(cifra: string, fromKey: string, toKey: string): string {
  if (fromKey === toKey) return cifra;
  
  const fromIdx = getNoteIndex(fromKey);
  const toIdx = getNoteIndex(toKey);
  
  if (fromIdx === -1 || toIdx === -1) return cifra;
  
  const semitons = toIdx - fromIdx;
  const lines = cifra.split('\n');
  const result: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : '';
    
    // Se a linha atual é só acorde E a próxima é tablatura, não transpõe
    if (isChordOnlyLine(line) && nextLine && isTabLine(nextLine)) {
      result.push(line); // mantém como está
    } else {
      result.push(transposeLine(line, semitons));
    }
  }
  
  return result.join('\n');
}

/**
 * Calcula a diferença de semitons entre duas notas
 */
export function getSemitoneDifference(fromKey: string, toKey: string): number {
  const fromIdx = getNoteIndex(fromKey);
  const toIdx = getNoteIndex(toKey);
  
  if (fromIdx === -1 || toIdx === -1) return 0;
  
  return toIdx - fromIdx;
}

/**
 * Lista todas as notas disponíveis pra seleção
 */
export function getAllKeys(): string[] {
  return [...NOTAS];
}

/**
 * Formata o nome da nota pro padrão brasileiro
 */
export function formatKeyName(key: string): string {
  const map: Record<string, string> = {
    'C': 'Dó',
    'C#': 'Dó#',
    'D': 'Ré',
    'D#': 'Ré#',
    'E': 'Mi',
    'F': 'Fá',
    'F#': 'Fá#',
    'G': 'Sol',
    'G#': 'Sol#',
    'A': 'Lá',
    'A#': 'Lá#',
    'B': 'Si',
  };
  return map[key] || key;
}

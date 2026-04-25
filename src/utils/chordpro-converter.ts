// =====================================
// CONVERSOR: Formato texto (Cifra Club) → ChordPro
// =====================================
//
// Converte cifras do Cifra Club que usam espaços para posicionar acordes
// para o formato ChordPro com acordes entre colchetes.
//
// Exemplo de entrada:
//      D              F#m/C#
// And now the end is near
//
// Resultado:
// And [D]now the [F#m/C#]end is near
// =====================================

interface ChordInLine {
  chord: string;
  position: number; // posição (coluna) onde o acorde começa
}

/**
 * Extrai acordes e suas posições de uma linha de acordes
 */
function extractChordsFromLine(line: string): ChordInLine[] {
  const chords: ChordInLine[] = [];
  const chordRegex = /[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|4|5|6|M|°|ø|\+)*(?:\/[A-G][#b]?)?/g;
  
  let match;
  while ((match = chordRegex.exec(line)) !== null) {
    // Só conta se o match não é só espaço (regex pode pegar vazio)
    if (match[0].trim()) {
      chords.push({
        chord: match[0],
        position: match.index,
      });
    }
  }
  
  return chords;
}

/**
 * Verifica se uma linha é uma linha de acordes (só contém acordes e espaços)
 */
function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  
  // Se tem letras minúsculas comuns (excluindo 'm' que é parte de acordes), é letra
  if (/[a-ce-gi-ln-oq-sux-z]/.test(line)) return false;
  
  // Se é uma seção tipo [Intro], não é chord line
  if (/^\[.+\]$/.test(trimmed)) return false;
  
  // Se tem pelo menos um acorde válido e só caracteres permitidos
  const hasChord = /[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|4|5|6|M|°|ø|\+)*(?:\/[A-G][#b]?)?/.test(line);
  const onlyChordsAndSpaces = /^[\sA-G#b\/mjsuadgi1791134560°ø+M-]*$/.test(line);
  
  return hasChord && onlyChordsAndSpaces;
}

/**
 * Verifica se uma linha é uma linha de letras (tem texto com letras minúsculas)
 */
function isLyricsLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  // Se tem letras minúsculas ou é texto normal
  return /[a-z]/.test(line) || /^[A-Z][a-z]/.test(line);
}

/**
 * Verifica se é uma linha de seção [Intro], [Primeira Parte], etc.
 */
function isSectionLine(line: string): boolean {
  return /^\[.+\]\s*$/.test(line.trim());
}

/**
 * Insere acordes entre colchetes em uma linha de letras.
 * Distribui os acordes entre as palavras da linha de letras.
 */
function insertChordsIntoLyrics(lyricsLine: string, chords: ChordInLine[]): string {
  if (chords.length === 0) return lyricsLine;
  
  // Remove espaços iniciais para calcular posições relativas
  const leadingSpaces = lyricsLine.match(/^(\s*)/)?.[1] || '';
  const trimmedLyrics = lyricsLine.trimStart();
  
  // Divide em palavras preservando espaços
  const words = trimmedLyrics.split(/(\s+)/);
  const nonSpaceWords = words.filter(w => w.trim());
  
  if (nonSpaceWords.length === 0) {
    // Se não tem palavras, junta todos os acordes no início
    return leadingSpaces + chords.map(c => `[${c.chord}]`).join(' ') + trimmedLyrics;
  }
  
  // Se tem mais acordes que palavras, distribui o máximo possível
  // e os extras vão no final
  const resultWords: string[] = [];
  let chordIdx = 0;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    resultWords.push(word);
    
    // Se é uma palavra (não espaço), adiciona acorde antes dela
    if (word.trim() && chordIdx < chords.length) {
      resultWords.push(`[${chords[chordIdx].chord}]`);
      chordIdx++;
    }
  }
  
  // Acordes restantes vão no final
  while (chordIdx < chords.length) {
    resultWords.push(`[${chords[chordIdx].chord}]`);
    chordIdx++;
  }
  
  return leadingSpaces + resultWords.join('');
}

/**
 * Converte uma cifra no formato texto do Cifra Club para ChordPro
 */
export function convertTextToChordPro(cifraText: string): string {
  const lines = cifraText.split('\n');
  const result: string[] = [];
  
  let i = 0;
  while (i < lines.length) {
    const currentLine = lines[i];
    const nextLine = i + 1 < lines.length ? lines[i + 1] : null;
    
    // Linha vazia
    if (!currentLine.trim()) {
      result.push(currentLine);
      i++;
      continue;
    }
    
    // Seção [Intro], [Refrão], etc.
    if (isSectionLine(currentLine)) {
      result.push(currentLine);
      i++;
      continue;
    }
    
    // Se a linha atual é de acordes e a próxima é de letras → converte
    if (isChordLine(currentLine) && nextLine && isLyricsLine(nextLine)) {
      const chords = extractChordsFromLine(currentLine);
      const mergedLine = insertChordsIntoLyrics(nextLine, chords);
      result.push(mergedLine);
      i += 2; // pula as duas linhas (acorde + letra)
      continue;
    }
    
    // Se a linha atual é de acordes mas a próxima não é letra → converte para formato ChordPro inline
    if (isChordLine(currentLine) && (!nextLine || !isLyricsLine(nextLine))) {
      // Converte acordes soltos para formato [Acorde]
      const chordProLine = currentLine.replace(
        /[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|4|5|6|M|°|ø|\+)*(?:\/[A-G][#b]?)?/g,
        (match) => {
          if (!match.trim()) return match;
          return `[${match.trim()}]`;
        }
      ).trim();
      result.push(chordProLine);
      i++;
      continue;
    }
    
    // Linha de letras sozinha (sem acorde acima)
    result.push(currentLine);
    i++;
  }
  
  return result.join('\n');
}

/**
 * Verifica se uma cifra está no formato texto (com espaços entre acordes e letras)
 */
export function isTextChordFormat(cifraText: string): boolean {
  const lines = cifraText.split('\n');
  let chordLyricsPairs = 0;
  
  for (let i = 0; i < lines.length - 1; i++) {
    if (isChordLine(lines[i]) && isLyricsLine(lines[i + 1])) {
      chordLyricsPairs++;
    }
  }
  
  // Se tem pelo menos 2 pares de (acordes + letras), provavelmente é formato texto
  return chordLyricsPairs >= 2;
}

/**
 * Converte uma cifra para ChordPro se necessário.
 * Se já estiver em ChordPro, retorna como está.
 */
export function ensureChordProFormat(cifraText: string): string {
  // Se já tem colchetes de ChordPro, assume que está no formato correto
  if (/\[[A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|4|5|6|M|°|ø|\+)*(?:\/[A-G][#b]?)?\]/.test(cifraText)) {
    // Mas verifica se também tem formato texto misturado
    if (isTextChordFormat(cifraText)) {
      return convertTextToChordPro(cifraText);
    }
    return cifraText;
  }
  
  // Se é formato texto, converte
  if (isTextChordFormat(cifraText)) {
    return convertTextToChordPro(cifraText);
  }
  
  // Fallback: retorna como está
  return cifraText;
}

// =====================================
// DETECTOR DE TOM A PARTIR DOS ACORDES
// =====================================
//
// Infere o tom de uma cifra analisando o conjunto de acordes:
// pontua cada tom candidato (maior/menor) pelos acordes diatônicos
// e dá bônus ao 1º e ao último acorde (tendência de tônica).

import { isChordLine } from './chordpro-converter'
import { chordTokenRegex } from './chord-pattern'

const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTAS_BEMOL = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const FLAT_TO_SHARP: Record<string, string> = {
  'Db': 'C#', 'Eb': 'D#', 'Gb': 'F#', 'Ab': 'G#', 'Bb': 'A#',
};

type Qualidade = 'maj' | 'min' | 'dim';

// Graus diatônicos (offset em semitons da tônica) e qualidade esperada
const ESCALA_MAIOR: Array<[number, Qualidade]> = [
  [0, 'maj'], [2, 'min'], [4, 'min'], [5, 'maj'], [7, 'maj'], [9, 'min'], [11, 'dim'],
];
const ESCALA_MENOR: Array<[number, Qualidade]> = [
  [0, 'min'], [2, 'dim'], [3, 'maj'], [5, 'min'], [7, 'min'], [8, 'maj'], [10, 'maj'],
];

function qualidadeDoAcorde(sufixo: string): Qualidade {
  if (/dim|°|º|ø/.test(sufixo)) return 'dim';
  if (/^m(?!aj)/.test(sufixo)) return 'min';
  return 'maj';
}

function parseToken(token: string): { rootIndex: number; qualidade: Qualidade } | null {
  const m = token.match(/^([A-G][#b]?)([^/]*)/);
  if (!m) return null;
  let root = m[1];
  if (FLAT_TO_SHARP[root]) root = FLAT_TO_SHARP[root];
  const rootIndex = NOTAS.indexOf(root);
  if (rootIndex === -1) return null;
  return { rootIndex, qualidade: qualidadeDoAcorde(m[2]) };
}

/**
 * Extrai os acordes em ordem: linhas de acordes + linhas rotuladas
 * estilo "INTRO: C# F#m" (remove o rótulo antes de testar).
 */
function extractChordTokens(cifra: string): string[] {
  const tokens: string[] = [];

  for (const line of cifra.split('\n')) {
    let target = line;
    if (!isChordLine(target)) {
      const labeled = target.match(/^\s*[A-ZÀ-Ü0-9][^:]{0,25}:\s+(.+)$/);
      if (labeled && isChordLine(labeled[1])) {
        target = labeled[1];
      } else {
        continue;
      }
    }
    for (const m of target.matchAll(chordTokenRegex())) {
      if (m[0].trim()) tokens.push(m[0]);
    }
  }

  return tokens;
}

/**
 * Detecta o tom provável da cifra (ex.: "D", "Ebm").
 * Retorna null se não encontrar acordes.
 */
export function detectKeyFromCifra(cifra: string): string | null {
  const tokens = extractChordTokens(cifra);
  if (tokens.length === 0) return null;

  const parsed = tokens.map(parseToken).filter((p): p is NonNullable<typeof p> => p !== null);
  if (parsed.length === 0) return null;

  const first = parsed[0];
  const last = parsed[parsed.length - 1];

  let bestKey: string | null = null;
  let bestScore = 0;

  for (let t = 0; t < 12; t++) {
    for (const modo of ['maj', 'min'] as const) {
      const escala = modo === 'maj' ? ESCALA_MAIOR : ESCALA_MENOR;
      let score = 0;

      for (const acorde of parsed) {
        const grau = (acorde.rootIndex - t + 12) % 12;
        const diatonico = escala.find(([off]) => off === grau);
        if (diatonico) {
          score += diatonico[1] === acorde.qualidade ? 2 : 0.5;
        } else if (modo === 'min' && grau === 7 && acorde.qualidade === 'maj') {
          // V maior da menor harmônica (ex.: E maior em Am)
          score += 1.5;
        }
      }

      // Bônus de tônica: 1º e último acorde costumam ser o tom
      const tonicaQualidade: Qualidade = modo === 'maj' ? 'maj' : 'min';
      if (first.rootIndex === t && first.qualidade === tonicaQualidade) score += 3;
      if (last.rootIndex === t && last.qualidade === tonicaQualidade) score += 3;

      if (score > bestScore) {
        bestScore = score;
        const preferFlats = tokens.some((tok) => /^[A-G]b/.test(tok));
        const nome = preferFlats ? NOTAS_BEMOL[t] : NOTAS[t];
        bestKey = modo === 'maj' ? nome : `${nome}m`;
      }
    }
  }

  return bestKey;
}

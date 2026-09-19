// =====================================
// VOCABULÁRIO CANÔNICO DE ACORDES
// =====================================
//
// Fonte única do que é um "token de acorde" (ex.: Am, F#m7, Bº, C/E).
// Consumido por chordpro-converter, key-detector e chord-transposer —
// antes cada um tinha sua própria regex e elas divergiam.
//
// Ordem das alternâncias importa: sufixos longos antes dos curtos
// ("maj" antes de "m"), senão "Cmaj7" casa só "Cm" (shadowing).

export const CHORD_ROOT = '[A-G][#b]?';
export const CHORD_SUFFIX = '(?:maj|min|dim|aug|sus|add|°|º|ø|\\+|M|m|13|11|9|7|6|5|4)';
export const CHORD_BASS = '(?:\\/[A-G][#b]?)';

/** Acorde sem baixo invertido — para transposição, onde raiz e baixo são transpostos como tokens independentes */
export const CHORD_CORE = `${CHORD_ROOT}${CHORD_SUFFIX}*`;

/** Um token de acorde completo: raiz + sufixos + baixo invertido opcional */
export const CHORD_TOKEN = `${CHORD_CORE}${CHORD_BASS}?`;

/** Acorde entre colchetes, formato ChordPro ("[F#m7]", "[D/F#]") */
export const CHORDPRO_BRACKETED = `\\[${CHORD_TOKEN}\\]`;

/**
 * Regex fresca de token de acorde. Factory, não instância compartilhada:
 * RegExp com flag `g` mantém lastIndex entre chamadas de .test()/.exec(),
 * o que causaria falsos negativos intermitentes se fosse reutilizada.
 */
export function chordTokenRegex(flags = 'g'): RegExp {
  return new RegExp(CHORD_TOKEN, flags);
}

/** Linha composta só por tokens de acorde e espaços ("D  A7  D/F#") */
export const CHORD_ONLY_LINE_REGEX = new RegExp(`^(?:${CHORD_TOKEN}\\s+)*${CHORD_TOKEN}$`);

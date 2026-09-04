import { describe, it, expect } from 'vitest'
import {
  parseSpacedPair,
  parseSpacedChordLine,
  parseChordProLine,
  parseTextCifra,
  parseChordProCifra,
  isSpacedChordLine,
} from './chord-parser'

// =====================================
// FIXTURES REAIS — cifra BR típica
// (estilo Cifra Club: acordes espaçados acima da letra)
// Linhas de acorde montadas com padStart para deixar a coluna explícita.
// =====================================

// G ancorado na sílaba "amar" (índice 18 de "Eu sei que vou te amar";
// 'Am' ocupa as colunas 0-1, então padStart(17) coloca o G na coluna 18)
const CHORD_LINE_1 = 'Am' + 'G'.padStart(17)
const LYRIC_LINE_1 = 'Eu sei que vou te amar'

// Em ancorado em "minha" (índice 11 de "Por toda a minha vida";
// 'D' ocupa a coluna 0, então padStart(12) coloca o Em na coluna 11)
const CHORD_LINE_2 = 'D' + 'Em'.padStart(12)
const LYRIC_LINE_2 = 'Por toda a minha vida'

const FIXTURE_TEXTO = [
  '[Intro]',
  'Am  G  D',
  'e|-----------------|',
  'B|-----1---0-------|',
  '',
  '[Primeira Parte]',
  CHORD_LINE_1,
  LYRIC_LINE_1,
  CHORD_LINE_2,
  LYRIC_LINE_2,
  'Sozinho no escuro',
].join('\n')

const FIXTURE_CHORDPRO = `{verse}
Eu [Am]sei que [G]vou te amar
[F]Por toda a minha [E]vida
{chorus}
[C]Oh, oh, [G]oh`

describe('parseSpacedPair', () => {
  it('ancora o acorde na sílaba correta', () => {
    //  Am                G
    //  Eu sei que vou te amar
    const segments = parseSpacedPair(CHORD_LINE_1, LYRIC_LINE_1)

    expect(segments[0]).toEqual({ chord: 'Am', lyric: 'Eu sei que vou te ' })
    expect(segments[1]).toEqual({ chord: 'G', lyric: 'amar' })
  })

  it('coloca letra anterior ao primeiro acorde num segmento sem acorde', () => {
    //        Am
    //  Eu sei que vou
    const segments = parseSpacedPair('       Am', 'Eu sei que vou')

    expect(segments[0]).toEqual({ chord: '', lyric: 'Eu sei ' })
    expect(segments[1]).toEqual({ chord: 'Am', lyric: 'que vou' })
  })

  it('preserva múltiplos espaços internos da letra', () => {
    //  C          G
    //  Oh,  oh,   oh
    const segments = parseSpacedPair('C         G', 'Oh,  oh,  oh')

    expect(segments[0].chord).toBe('C')
    expect(segments[0].lyric).toContain('  ') // espaços duplos preservados
    expect(segments[1]).toEqual({ chord: 'G', lyric: 'oh' })
  })

  it('preenche com espaços quando a letra é mais curta que a posição do acorde', () => {
    //  A          D
    //  Hey
    const segments = parseSpacedPair('A         D', 'Hey')

    expect(segments[0].lyric).toBe('Hey       ')
    expect(segments[1]).toEqual({ chord: 'D', lyric: '' })
  })

  it('lida com acordes complexos (baixo invertido, maj7, múltiplos espaços)', () => {
    //  Cmaj7  D/F# Em7
    //  Tudo   vai   ficar bem
    // (Em7 ancorado na coluna 12 — um espaço antes de "ficar")
    const segments = parseSpacedPair('Cmaj7  D/F# Em7', 'Tudo   vai   ficar bem')

    expect(segments.map((s) => s.chord)).toEqual(['Cmaj7', 'D/F#', 'Em7'])
    expect(segments[2].lyric).toBe(' ficar bem')
  })
})

describe('parseSpacedChordLine', () => {
  it('linha só de acordes (riff) mantém espaçamento como lyric de espaços', () => {
    const segments = parseSpacedChordLine('Am  G  D')

    expect(segments.map((s) => s.chord)).toEqual(['Am', 'G', 'D'])
    expect(segments[0].lyric).toBe('  ')
    expect(segments[2].lyric).toBe('')
  })
})

describe('parseChordProLine', () => {
  it('ancora acorde no texto seguinte', () => {
    const segments = parseChordProLine('Eu [Am]sei que [G]vou te amar')

    expect(segments).toEqual([
      { chord: '', lyric: 'Eu ' },
      { chord: 'Am', lyric: 'sei que ' },
      { chord: 'G', lyric: 'vou te amar' },
    ])
  })

  it('acordes consecutivos geram segmentos com lyric vazia', () => {
    const segments = parseChordProLine('[F][G]Oh')

    expect(segments).toEqual([
      { chord: 'F', lyric: '' },
      { chord: 'G', lyric: 'Oh' },
    ])
  })

  it('linha sem acordes retorna segmento único sem acorde', () => {
    expect(parseChordProLine('Sozinho no escuro')).toEqual([
      { chord: '', lyric: 'Sozinho no escuro' },
    ])
  })
})

describe('parseTextCifra (fixture BR completa)', () => {
  const lines = parseTextCifra(FIXTURE_TEXTO)

  it('detecta linhas de seção tipo [Intro]', () => {
    const sections = lines.filter((l) => l.type === 'section')
    expect(sections.map((s) => s.content)).toEqual(['Intro', 'Primeira Parte'])
  })

  it('mantém tablatura intocada', () => {
    const tabs = lines.filter((l) => l.type === 'tab')
    expect(tabs).toHaveLength(2)
    expect(tabs[0].content).toBe('e|-----------------|')
    expect(tabs[1].content).toBe('B|-----1---0-------|')
  })

  it('esconde tablatura quando showTablatura = false', () => {
    const semTab = parseTextCifra(FIXTURE_TEXTO, false)
    expect(semTab.filter((l) => l.type === 'tab')).toHaveLength(0)
  })

  it('emparelha linha de acordes com a letra abaixo em segmentos', () => {
    const chordsLines = lines.filter((l) => l.type === 'chords')
    // 3 linhas com acordes: riff do intro + 2 pares acorde/letra
    expect(chordsLines).toHaveLength(3)

    const par = chordsLines[1]
    expect(par.segments?.[0]).toEqual({ chord: 'Am', lyric: 'Eu sei que vou te ' })
    expect(par.segments?.[1]).toEqual({ chord: 'G', lyric: 'amar' })

    const par2 = chordsLines[2]
    expect(par2.segments?.[0].chord).toBe('D')
    expect(par2.segments?.[1]).toEqual({ chord: 'Em', lyric: 'minha vida' })
  })

  it('linha sem acordes vira lyrics puro', () => {
    const lyrics = lines.filter((l) => l.type === 'lyrics')
    expect(lyrics.map((l) => l.content)).toContain('Sozinho no escuro')
    // a letra emparelhada NÃO aparece duplicada como lyrics
    expect(lyrics.map((l) => l.content)).not.toContain(LYRIC_LINE_1)
  })

  it('preserva linhas vazias', () => {
    expect(lines.filter((l) => l.type === 'empty').length).toBe(1)
  })
})

describe('parseChordProCifra (fixture BR completa)', () => {
  const lines = parseChordProCifra(FIXTURE_CHORDPRO)

  it('detecta seções {verse}/{chorus} em maiúsculas', () => {
    const sections = lines.filter((l) => l.type === 'section')
    expect(sections.map((s) => s.content)).toEqual(['VERSE', 'CHORUS'])
  })

  it('converte linhas com [acordes] em segmentos empilhados', () => {
    const chordsLines = lines.filter((l) => l.type === 'chords')
    expect(chordsLines).toHaveLength(3)
    expect(chordsLines[0].segments?.[1]).toEqual({ chord: 'Am', lyric: 'sei que ' })
  })

  it('linha de acordes antes de tablatura some quando showTablatura = false', () => {
    const comTab = '[E]\ne|--0--0--|\n↓ ↓ ↑ ↓ ↑'
    const semTab = parseChordProCifra(comTab, false)
    expect(semTab.filter((l) => l.type === 'tab')).toHaveLength(0)
    expect(semTab.some((l) => l.content?.includes('↓'))).toBe(false)
    expect(semTab.some((l) => l.segments?.some((s) => s.chord === 'E'))).toBe(false)
  })
})

describe('isSpacedChordLine', () => {
  it('reconhece linhas de acordes com múltiplos espaços', () => {
    expect(isSpacedChordLine('Am                   G')).toBe(true)
    expect(isSpacedChordLine('  C  G/B  Am7  F')).toBe(true)
  })

  it('rejeita linhas de letra', () => {
    expect(isSpacedChordLine('Eu sei que vou te amar')).toBe(false)
    expect(isSpacedChordLine('')).toBe(false)
  })
})

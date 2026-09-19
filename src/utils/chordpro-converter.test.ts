import { describe, it, expect } from 'vitest'
import { ensureChordProFormat, isChordLine } from './chordpro-converter'

describe('ensureChordProFormat com letras em CAIXA ALTA (Músicas para Missa)', () => {
  const mpmCifra = [
    'D                A         G        A',
    'OUVI, SENHOR, AS PRECES DO VOSSO SERVO ',
    '     G           A     A7',
    'E DO VOSSO POVO ELEITO:',
  ].join('\n')

  it('detecta e converte pares acorde/letra em caixa alta', () => {
    const result = ensureChordProFormat(mpmCifra)
    expect(result).toContain('[D]')
    expect(result).toContain('[G]')
    expect(result).not.toContain('OUVI, SENHOR, AS PRECES DO VOSSO SERVO \n')
  })

  it('linha de acordes com bemol seguida de letra em caixa alta vira par', () => {
    // "INTRO:" não é linha de acordes nem de letras → passa intacta
    const intro = [
      'INTRO: Eb G# Eb Bb',
      '',
      '   Eb Bº               Cm   Cm/A#',
      'TU, TE ABEIRASTE DA PRAIA',
      '       G#   Fm               Bb7',
      'NÃO BUSCASTE  NEM SÁBIOS NEM RICOS,',
    ].join('\n')
    const result = ensureChordProFormat(intro)
    expect(result).toContain('INTRO: Eb G# Eb Bb')
    expect(result).toContain('[Eb]')
    expect(result).toContain('[Bb7]')
  })

  it('formato misto (caixa baixa) continua convertendo como antes', () => {
    const text = [
      '     D              F#m/C#',
      'And now the end is near',
      '     G              A',
      'And so I face the final curtain',
    ].join('\n')
    const result = ensureChordProFormat(text)
    expect(result).toContain('[D]')
    expect(result).toContain('[F#m/C#]')
    expect(result).toContain('[G]')
  })
})

describe('isChordLine', () => {
  it('reconhece linha só de acordes', () => {
    expect(isChordLine('D                A         G        A')).toBe(true)
    expect(isChordLine('   Eb Bº               Cm   Cm/A#')).toBe(true)
    expect(isChordLine('Bb7  Eb')).toBe(true)
  })

  it('rejeita letras e títulos', () => {
    expect(isChordLine('OUVI, SENHOR, AS PRECES DO VOSSO SERVO')).toBe(false)
    expect(isChordLine('INTRO: Eb G# Eb Bb')).toBe(false)
  })
})

describe('alinhamento dos acordes na conversão', () => {
  it('insere o acorde na coluna correta da sílaba (regressão: acorde deslocado)', () => {
    // "D" na coluna 0 → acima de "OUVI"; "A" na coluna 17 → acima de "PRECES"
    const text = [
      'D                A',
      'OUVI, SENHOR, AS PRECES',
      'G           A',
      'E DO VOSSO POVO ELEITO:',
    ].join('\n')
    const result = ensureChordProFormat(text)
    const line1 = result.split('\n')[0]
    // O acorde D deve vir ANTES de "OUVI" (coluna 0), não depois da palavra
    expect(line1.startsWith('[D]OUVI')).toBe(true)
    // O acorde A deve ficar acima de "PRECES" (coluna 17)
    expect(line1.indexOf('[A]PRECES')).toBeGreaterThan(-1)
  })

  it('acorde no meio da palavra respeita a coluna', () => {
    const text = [
      '  C        G',
      'PARA QUE OS VOSSOS',
      '  C        G',
      'PROFETAS SEJAM VERDADEIROS.',
    ].join('\n')
    const result = ensureChordProFormat(text)
    // "C" coluna 2 → dentro de "PARA" (PA[C]RA); "G" coluna 11 → espaço antes de "VOSSOS"
    expect(result.split('\n')[0]).toBe('PA[C]RA QUE OS[G] VOSSOS')
  })

  it('acordes além do fim da letra vão para o final', () => {
    const text = [
      'C                                G',
      'OI',
      'C                                G',
      'TCHAU',
    ].join('\n')
    const result = ensureChordProFormat(text)
    expect(result.split('\n')[0]).toBe('[C]OI[G]')
  })
})

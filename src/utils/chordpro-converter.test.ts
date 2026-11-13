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

describe('zero-width chars do Cifra Club (regressão: importação saía sem converter)', () => {
  it('linha de acordes com ZWSP é reconhecida e converte o par acorde/letra', () => {
    const zwsp = '​'
    const cifra = [
      `${zwsp}[Intro] Bm  D`,
      '',
      `${zwsp}        Bm  G  A  A4  A`,
      `${zwsp}Não sei dizer o que mudou`,
      `${zwsp}   G    D`,
      `${zwsp}Mas nada está igual`,
    ].join('\n')

    const result = ensureChordProFormat(cifra)
    // colunas fiéis ao original: Bm cai sobre 'dizer' (col 8), G entre 'Mas' e 'nada'
    expect(result).toContain('Não sei [Bm]dize[G]r o[A] qu[A4]e mu[A]dou')
    expect(result).toContain('Mas[G] nada[D] está igual')
    // nenhum ZWSP sobrou no resultado
    expect(result).not.toContain('​')
    // Nenhuma linha de acordes solta deve sobrar
    expect(result.split('\n').filter((l) => isChordLine(l) && l.trim())).toHaveLength(0)
  })

  it('acorde com parênteses (D5(9)) é tratado como acorde', () => {
    expect(isChordLine('   D5(9)')).toBe(true)
    const result = ensureChordProFormat(
      ['D5(9)      G', 'Quem espera que a vida', '   G    A', 'Seja feita de ilusão'].join('\n')
    )
    expect(result).toContain('[D5(9)]Quem espera')
    expect(result).toContain('Sej[G]a fei[A]ta')
  })

  it('linha de letra com parênteses não vira linha de acordes', () => {
    expect(isChordLine('Não quero dinheiro (só quero amar)')).toBe(false)
  })
})

import { describe, it, expect } from 'vitest'
import {
  transposeLine,
  transposeCifra,
  getSemitoneDifference,
  getAllKeys,
  formatKeyName,
  isTabLine,
  isStrummingLine,
  cleanChordText,
  extractKeyFromChord,
} from './chord-transposer'

describe('transposeLine', () => {
  it('retorna a linha intacta com 0 semitons', () => {
    expect(transposeLine('Am G F', 0)).toBe('Am G F')
  })

  it('transpõe acordes simples', () => {
    expect(transposeLine('Am G F', 2)).toBe('Bm A G')
  })

  it('transpõe para baixo com semitons negativos', () => {
    expect(transposeLine('C', -2)).toBe('A#')
  })

  it('normaliza bemóis para sustenidos', () => {
    expect(transposeLine('Bb', 2)).toBe('C')
    expect(transposeLine('Db', 0)).toBe('Db') // 0 semitons: sem alteração
    expect(transposeLine('Db', 1)).toBe('D')
  })

  it('preserva a qualidade do acorde', () => {
    expect(transposeLine('Am7', 2)).toBe('Bm7')
    expect(transposeLine('Cmaj7', 2)).toBe('Dmaj7')
  })

  it('não transpõe linhas de tablatura', () => {
    const tab = 'e|--2-2---3---|'
    expect(transposeLine(tab, 5)).toBe(tab)
  })
})

describe('transposeCifra', () => {
  it('retorna a cifra intacta quando fromKey === toKey', () => {
    const cifra = 'A B C'
    expect(transposeCifra(cifra, 'A', 'A')).toBe(cifra)
  })

  it('retorna a cifra intacta com tom inválido', () => {
    const cifra = 'A B C'
    expect(transposeCifra(cifra, 'X', 'A')).toBe(cifra)
  })

  it('transpõe todas as linhas de acordes', () => {
    expect(transposeCifra('A B', 'A', 'B')).toBe('B C#')
  })

  it('mantém linha de acordes que precede tablatura (riff)', () => {
    const cifra = 'A D/A\ne|--0--2--|'
    // +2 semitons: linha de acordes do riff e a tab ficam intactas
    expect(transposeCifra(cifra, 'A', 'B')).toBe('A D/A\ne|--0--2--|')
  })
})

describe('getSemitoneDifference', () => {
  it('calcula diferenças simples', () => {
    expect(getSemitoneDifference('C', 'D')).toBe(2)
    expect(getSemitoneDifference('D', 'C')).toBe(-2)
  })

  it('não normaliza para o caminho mais curto (subtração direta)', () => {
    // B(11) → C(0) retorna -11, enarmônico de +1 — transposeNote lida via mod 12
    expect(getSemitoneDifference('B', 'C')).toBe(-11)
    // C(0) → B(11) retorna +11, enarmônico de -1
    expect(getSemitoneDifference('C', 'B')).toBe(11)
  })

  it('retorna 0 para tons inválidos', () => {
    expect(getSemitoneDifference('X', 'C')).toBe(0)
    expect(getSemitoneDifference('C', 'H')).toBe(0)
  })
})

describe('getAllKeys', () => {
  it('retorna as 12 notas cromáticas', () => {
    const keys = getAllKeys()
    expect(keys).toHaveLength(12)
    expect(keys[0]).toBe('C')
    expect(keys[11]).toBe('B')
  })
})

describe('formatKeyName', () => {
  it('formata para o padrão brasileiro', () => {
    expect(formatKeyName('C')).toBe('Dó')
    expect(formatKeyName('F#')).toBe('Fá#')
    expect(formatKeyName('B')).toBe('Si')
  })

  it('retorna o próprio valor para desconhecidos', () => {
    expect(formatKeyName('X')).toBe('X')
  })
})

describe('isTabLine', () => {
  it('detecta linhas de tablatura', () => {
    expect(isTabLine('e|--2-2---|')).toBe(true)
    expect(isTabLine('  B|--3---|')).toBe(true)
  })

  it('rejeita linhas normais', () => {
    expect(isTabLine('Am G F')).toBe(false)
    expect(isTabLine('Lá vai você')).toBe(false)
  })
})

describe('isStrummingLine', () => {
  it('detecta linhas de palhetada', () => {
    expect(isStrummingLine('↓ ↓ ↑ ↓ ↑')).toBe(true)
  })

  it('rejeita linhas sem setas', () => {
    expect(isStrummingLine('abc')).toBe(false)
    expect(isStrummingLine('   ')).toBe(false)
  })
})

describe('cleanChordText', () => {
  it('retorna string vazia para null', () => {
    expect(cleanChordText(null)).toBe('')
  })

  it('normaliza \\r\\n para \\n', () => {
    expect(cleanChordText('a\r\nb')).toBe('a\nb')
  })

  it('colapsa 3+ quebras de linha em 2 e faz trim', () => {
    expect(cleanChordText('  a\n\n\n\nb  ')).toBe('a\n\nb')
  })
})

describe('extractKeyFromChord', () => {
  it('extrai tom de "Tom:"', () => {
    expect(extractKeyFromChord('Tom: G')).toBe('G')
    expect(extractKeyFromChord('Tom: Am')).toBe('Am')
    expect(extractKeyFromChord('intro\nTom: Bb\nresto')).toBe('Bb')
  })

  it('retorna null sem tom ou com entrada null', () => {
    expect(extractKeyFromChord('sem tom aqui')).toBe(null)
    expect(extractKeyFromChord(null)).toBe(null)
  })
})

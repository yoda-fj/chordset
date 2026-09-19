import { describe, it, expect } from 'vitest'
import { normalizeImportedSong } from './import-pipeline'

const OUVI_LINES = [
  'D                A         G        A',
  'OUVI, SENHOR, AS PRECES DO VOSSO SERVO ',
  '     G           A     A7',
  'E DO VOSSO POVO ELEITO:',
]

function baseInput(overrides: Partial<Parameters<typeof normalizeImportedSong>[0]> = {}) {
  return {
    titulo: 'OUVI, SENHOR',
    artista: 'Ruzye',
    url: 'https://musicasparamissa.com.br/musica/ouvi/',
    provider: 'musicasparamissa',
    cifraLines: OUVI_LINES,
    ...overrides,
  }
}

describe('normalizeImportedSong', () => {
  it('converte cifra texto para ChordPro alinhado por coluna', () => {
    const song = normalizeImportedSong(baseInput())
    expect(song.cifra.split('\n')[0]).toContain('[D]OUVI')
    expect(song.cifra.split('\n')[0]).toContain('[A]PRECES')
  })

  it('tom: metadado da página tem prioridade sobre texto e detector', () => {
    const song = normalizeImportedSong(baseInput({ scrapedKey: 'G' }))
    expect(song.tom_original).toBe('G')
  })

  it('tom: sem metadado, usa "Tom:" do texto quando presente', () => {
    const song = normalizeImportedSong(baseInput({ cifraLines: ['Tom: F#', ...OUVI_LINES] }))
    expect(song.tom_original).toBe('F#')
  })

  it('tom: sem metadado nem "Tom:", detecta pelos acordes', () => {
    const song = normalizeImportedSong(baseInput())
    expect(song.tom_original).toBe('D')
  })

  it('propaga titulo/artista/url/provider', () => {
    const song = normalizeImportedSong(baseInput())
    expect(song).toMatchObject({
      titulo: 'OUVI, SENHOR',
      artista: 'Ruzye',
      url: 'https://musicasparamissa.com.br/musica/ouvi/',
      provider: 'musicasparamissa',
    })
  })
})

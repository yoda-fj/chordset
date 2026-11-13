import { describe, it, expect } from 'vitest'
import { parseCifraClubUrl, resolveReimportTarget, buildReimportUpdate } from './reimport'

function searchDoc(overrides: Partial<{ artist: string; artist_slug: string; song: string; song_slug: string }> = {}) {
  return {
    artist: 'Coldplay',
    artist_slug: 'coldplay',
    song: 'The Scientist',
    song_slug: 'the-scientist',
    ...overrides,
  }
}

describe('parseCifraClubUrl', () => {
  it('extrai artista e música da URL base', () => {
    expect(parseCifraClubUrl('https://www.cifraclub.com.br/coldplay/the-scientist')).toEqual({
      artist: 'coldplay',
      song: 'the-scientist',
      version: undefined,
    })
  })

  it('extrai versão alternativa quando presente', () => {
    expect(parseCifraClubUrl('https://www.cifraclub.com.br/coldplay/the-scientist/simplificada/')).toEqual({
      artist: 'coldplay',
      song: 'the-scientist',
      version: 'simplificada',
    })
  })

  it('retorna null para URL sem artista/música', () => {
    expect(parseCifraClubUrl('https://www.cifraclub.com.br/coldplay')).toBeNull()
  })
})

describe('resolveReimportTarget', () => {
  it('URL salva na música tem prioridade sobre resultados de busca', () => {
    const result = resolveReimportTarget('https://www.cifraclub.com.br/foo/bar', [searchDoc()])
    expect(result).toEqual({ kind: 'url', url: 'https://www.cifraclub.com.br/foo/bar' })
  })

  it('sem URL salva e 1 resultado: usa a URL do resultado', () => {
    const result = resolveReimportTarget(null, [searchDoc()])
    expect(result).toEqual({
      kind: 'url',
      url: 'https://www.cifraclub.com.br/coldplay/the-scientist',
    })
  })

  it('sem URL salva e 0 resultados: notFound', () => {
    expect(resolveReimportTarget(null, [])).toEqual({ kind: 'notFound' })
  })

  it('sem URL salva e mais de 1 resultado: needChoice com candidates {titulo, artista, url}', () => {
    const result = resolveReimportTarget(null, [
      searchDoc(),
      searchDoc({ song: 'The Scientist (acústica)', song_slug: 'the-scientist/acustica' }),
    ])
    expect(result.kind).toBe('needChoice')
    if (result.kind === 'needChoice') {
      expect(result.candidates).toHaveLength(2)
      expect(result.candidates[0]).toEqual({
        titulo: 'The Scientist',
        artista: 'Coldplay',
        url: 'https://www.cifraclub.com.br/coldplay/the-scientist',
      })
    }
  })
})

describe('buildReimportUpdate', () => {
  it('sempre substitui cifra e grava a URL usada', () => {
    const update = buildReimportUpdate(
      { tom_original: 'G' },
      { cifra: '[G]Nova cifra', tom_original: 'C' },
      'https://www.cifraclub.com.br/foo/bar'
    )
    expect(update).toEqual({
      cifra: '[G]Nova cifra',
      cifra_url: 'https://www.cifraclub.com.br/foo/bar',
    })
  })

  it('preenche tom_original quando o anterior era null', () => {
    const update = buildReimportUpdate(
      { tom_original: null },
      { cifra: '[C]Nova cifra', tom_original: 'C' },
      'https://www.cifraclub.com.br/foo/bar'
    )
    expect(update.tom_original).toBe('C')
  })

  it('não sobrescreve tom já definido (nem inclui tom_atual no update)', () => {
    const update = buildReimportUpdate(
      { tom_original: 'G' },
      { cifra: '[C]Nova cifra', tom_original: 'C' },
      'https://www.cifraclub.com.br/foo/bar'
    )
    expect(update).not.toHaveProperty('tom_original')
    expect(update).not.toHaveProperty('tom_atual')
  })

  it('não grava tom null quando a cifra nova não tem tom detectado', () => {
    const update = buildReimportUpdate(
      { tom_original: null },
      { cifra: 'cifra sem acordes', tom_original: null },
      'https://www.cifraclub.com.br/foo/bar'
    )
    expect(update).not.toHaveProperty('tom_original')
  })
})

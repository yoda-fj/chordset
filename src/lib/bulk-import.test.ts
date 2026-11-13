import { describe, it, expect } from 'vitest'
import { parseBulkImportLines, BULK_IMPORT_MAX_LINES } from './bulk-import'

describe('parseBulkImportLines', () => {
  it('converte URL do Cifra Club em item {url}', () => {
    const items = parseBulkImportLines('https://www.cifraclub.com.br/coldplay/the-scientist')
    expect(items).toEqual([
      { kind: 'url', url: 'https://www.cifraclub.com.br/coldplay/the-scientist', raw: 'https://www.cifraclub.com.br/coldplay/the-scientist' },
    ])
  })

  it('remove query string, hash e barra final da URL', () => {
    const items = parseBulkImportLines('https://www.cifraclub.com.br/coldplay/the-scientist/?foo=bar#topo')
    expect(items[0]).toMatchObject({
      kind: 'url',
      url: 'https://www.cifraclub.com.br/coldplay/the-scientist',
    })
  })

  it('aceita http:// e domínio sem www', () => {
    const items = parseBulkImportLines('http://cifraclub.com.br/artista/musica')
    expect(items[0]).toMatchObject({ kind: 'url', url: 'http://cifraclub.com.br/artista/musica' })
  })

  it('mantém URL de outro domínio como {url} (API rejeita com mensagem clara)', () => {
    const items = parseBulkImportLines('https://exemplo.com.br/foo')
    expect(items[0]).toMatchObject({ kind: 'url', url: 'https://exemplo.com.br/foo' })
  })

  it('converte texto livre em item {query}', () => {
    const items = parseBulkImportLines('coldplay the scientist')
    expect(items).toEqual([
      { kind: 'query', query: 'coldplay the scientist', raw: 'coldplay the scientist' },
    ])
  })

  it('ignora linhas vazias e espaços em branco', () => {
    const items = parseBulkImportLines('\n  \ncoldplay the scientist\n\n   \nhttps://www.cifraclub.com.br/u2/one\n')
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ kind: 'query', query: 'coldplay the scientist' })
    expect(items[1]).toMatchObject({ kind: 'url' })
  })

  it('faz trim de cada linha', () => {
    const items = parseBulkImportLines('   coldplay the scientist   ')
    expect(items[0]).toMatchObject({ query: 'coldplay the scientist' })
  })

  it('aceita CRLF como quebra de linha', () => {
    const items = parseBulkImportLines('u2 one\r\nhttps://www.cifraclub.com.br/u2/one\r\n')
    expect(items).toHaveLength(2)
    expect(items[0]).toMatchObject({ kind: 'query', query: 'u2 one' })
    expect(items[1]).toMatchObject({ kind: 'url' })
  })

  it('retorna lista vazia para texto sem linhas válidas', () => {
    expect(parseBulkImportLines('')).toEqual([])
    expect(parseBulkImportLines('\n\n   \n')).toEqual([])
  })

  it('limita o total de linhas a BULK_IMPORT_MAX_LINES', () => {
    const text = Array.from({ length: BULK_IMPORT_MAX_LINES + 10 }, (_, i) => `musica ${i}`).join('\n')
    const items = parseBulkImportLines(text)
    expect(items).toHaveLength(BULK_IMPORT_MAX_LINES)
  })
})

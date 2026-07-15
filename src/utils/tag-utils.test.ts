import { describe, it, expect } from 'vitest'
import { parseTags, stringifyTags } from './tag-utils'

describe('parseTags', () => {
  it('retorna [] para null/undefined', () => {
    expect(parseTags(null)).toEqual([])
    expect(parseTags(undefined)).toEqual([])
  })

  it('faz parse de JSON string', () => {
    expect(parseTags('["a","b"]')).toEqual(['a', 'b'])
    expect(parseTags('[]')).toEqual([])
  })

  it('passa arrays direto, filtrando não-strings', () => {
    expect(parseTags(['a', 'b'])).toEqual(['a', 'b'])
    expect(parseTags(['a', 1, 'b', null])).toEqual(['a', 'b'])
  })

  it('filtra não-strings dentro de JSON parseado', () => {
    expect(parseTags('["a",1,"b"]')).toEqual(['a', 'b'])
  })

  it('retorna [] para JSON inválido ou não-array', () => {
    expect(parseTags('não é json')).toEqual([])
    expect(parseTags('{"a":1}')).toEqual([])
    expect(parseTags('"só string"')).toEqual([])
  })
})

describe('stringifyTags', () => {
  it('serializa arrays', () => {
    expect(stringifyTags(['a', 'b'])).toBe('["a","b"]')
  })

  it('retorna [] serializado para undefined/array vazio', () => {
    expect(stringifyTags(undefined)).toBe('[]')
    expect(stringifyTags([])).toBe('[]')
  })
})

describe('roundtrip', () => {
  it('parseTags(stringifyTags(x)) === x', () => {
    const tags = ['louvor', 'natal', 'estudo']
    expect(parseTags(stringifyTags(tags))).toEqual(tags)
  })
})

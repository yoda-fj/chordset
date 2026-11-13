import { describe, it, expect } from 'vitest'
import { normalizeSearchQuery } from './search'

describe('normalizeSearchQuery', () => {
  it('substitui travessão/en-dash (–) por espaço', () => {
    expect(normalizeSearchQuery('Do Seu Lado – Jota Quest')).toBe('Do Seu Lado Jota Quest')
  })

  it('substitui em-dash (—) e outros hífens unicode', () => {
    expect(normalizeSearchQuery('Whisky — Roupa Nova')).toBe('Whisky Roupa Nova')
    expect(normalizeSearchQuery('a‐b―c‒d')).toBe('a b c d')
  })

  it('preserva hífen comum dentro de palavras (Go-Go, ao-vivo)', () => {
    expect(normalizeSearchQuery('Whisky a Go-Go')).toBe('Whisky a Go-Go')
  })

  it('colapsa espaços múltiplos e remove bordas', () => {
    expect(normalizeSearchQuery('  Tempos   Modernos\t Lulu Santos  ')).toBe('Tempos Modernos Lulu Santos')
  })
})

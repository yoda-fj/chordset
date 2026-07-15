import { describe, it, expect } from 'vitest'
import { jsonError, parseId } from './api-helpers'

describe('parseId', () => {
  it('faz parse de inteiros válidos', () => {
    expect(parseId('3')).toBe(3)
    expect(parseId('42')).toBe(42)
    expect(parseId('0')).toBe(0)
  })

  it('retorna null para valores inválidos', () => {
    expect(parseId('abc')).toBe(null)
    expect(parseId('')).toBe(null)
  })

  it('segue semântica do parseInt (trunca decimais)', () => {
    expect(parseId('3.7')).toBe(3)
  })
})

describe('jsonError', () => {
  it('retorna resposta com status e corpo { error }', async () => {
    const res = jsonError('Não encontrado', 404)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Não encontrado' })
  })

  it('inclui details quando fornecido', async () => {
    const res = jsonError('Falha', 500, 'stack aqui')
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Falha', details: 'stack aqui' })
  })
})

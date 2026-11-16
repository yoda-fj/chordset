import { describe, it, expect } from 'vitest'
import {
  decideReimportResponse,
  resolveRetryAfterSec,
  DEFAULT_RETRY_AFTER_SEC,
} from './reimport-batch'

describe('resolveRetryAfterSec', () => {
  it('usa retryAfterSec do body quando é número positivo', () => {
    expect(resolveRetryAfterSec({ retryAfterSec: 12.2 }, 30)).toBe(13)
  })

  it('ignora valor inválido e usa o fallback', () => {
    expect(resolveRetryAfterSec({ retryAfterSec: 'abc' }, 30)).toBe(30)
    expect(resolveRetryAfterSec({ retryAfterSec: -5 }, 30)).toBe(30)
    expect(resolveRetryAfterSec({ retryAfterSec: 0 }, 30)).toBe(30)
    expect(resolveRetryAfterSec(null, 30)).toBe(30)
    expect(resolveRetryAfterSec({}, 30)).toBe(30)
  })
})

describe('decideReimportResponse', () => {
  it('200 com success → success com tom e linhas', () => {
    expect(decideReimportResponse(200, { success: true, tom: 'G', linhas: 42 })).toEqual({
      kind: 'success',
      tom: 'G',
      linhas: 42,
    })
  })

  it('200 com success e tom ausente → tom null e linhas 0', () => {
    expect(decideReimportResponse(200, { success: true })).toEqual({
      kind: 'success',
      tom: null,
      linhas: 0,
    })
  })

  it('200 com needChoice e candidates → needChoice', () => {
    const candidates = [{ titulo: 'Borboletas', artista: 'Victor & Leo', url: 'https://x/y' }]
    expect(decideReimportResponse(200, { needChoice: true, candidates })).toEqual({
      kind: 'needChoice',
      candidates,
    })
  })

  it('429 → rateLimited com retryAfterSec do body', () => {
    expect(decideReimportResponse(429, { error: 'Muitas requisições', retryAfterSec: 20 })).toEqual({
      kind: 'rateLimited',
      retryAfterSec: 20,
    })
  })

  it('429 sem retryAfterSec válido → rateLimited com fallback', () => {
    expect(decideReimportResponse(429, {})).toEqual({
      kind: 'rateLimited',
      retryAfterSec: DEFAULT_RETRY_AFTER_SEC,
    })
  })

  it('404 com error → error com a mensagem da API', () => {
    expect(decideReimportResponse(404, { error: 'Nenhum resultado no Cifra Club' })).toEqual({
      kind: 'error',
      message: 'Nenhum resultado no Cifra Club',
    })
  })

  it('erro sem mensagem → mensagem genérica com o status', () => {
    expect(decideReimportResponse(500, {})).toEqual({
      kind: 'error',
      message: 'Erro inesperado (HTTP 500)',
    })
  })

  it('200 sem success nem needChoice → error (resposta fora do contrato)', () => {
    expect(decideReimportResponse(200, { something: 'else' }).kind).toBe('error')
  })

  it('body null/undefined não quebra (usa {} interno)', () => {
    expect(decideReimportResponse(429, null).kind).toBe('rateLimited')
    expect(decideReimportResponse(502, undefined)).toEqual({
      kind: 'error',
      message: 'Erro inesperado (HTTP 502)',
    })
  })
})

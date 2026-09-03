import { describe, it, expect } from 'vitest'
import { createRateLimiter } from './rate-limit'

describe('createRateLimiter', () => {
  it('permite requisições até o limite', () => {
    const now = 1_000_000
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => now })

    expect(limiter.check('ip-1').allowed).toBe(true)
    expect(limiter.check('ip-1').allowed).toBe(true)
    expect(limiter.check('ip-1').allowed).toBe(true)
  })

  it('estoura no limite e informa retryAfterSec', () => {
    const now = 1_000_000
    const limiter = createRateLimiter({ limit: 3, windowMs: 60_000, now: () => now })

    limiter.check('ip-1')
    limiter.check('ip-1')
    limiter.check('ip-1')

    const result = limiter.check('ip-1')
    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    // A requisição mais antiga entrou em now=1_000_000 e a janela é de 60s,
    // então deve pedir para tentar de novo em ~60s.
    expect(result.retryAfterSec).toBe(60)
  })

  it('reseta após a janela deslizante passar', () => {
    let now = 1_000_000
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => now })

    expect(limiter.check('ip-1').allowed).toBe(true)
    expect(limiter.check('ip-1').allowed).toBe(true)
    expect(limiter.check('ip-1').allowed).toBe(false)

    // Avança o relógio além da janela: as requisições antigas expiram
    now += 61_000
    expect(limiter.check('ip-1').allowed).toBe(true)
  })

  it('libera espaço parcial conforme a janela desliza', () => {
    let now = 1_000_000
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000, now: () => now })

    expect(limiter.check('ip-1').allowed).toBe(true) // t = 1_000_000
    now += 30_000
    expect(limiter.check('ip-1').allowed).toBe(true) // t = 1_030_000
    expect(limiter.check('ip-1').allowed).toBe(false)

    // Só a primeira requisição expirou: 1 vaga livre
    now += 31_000 // t = 1_061_000
    expect(limiter.check('ip-1').allowed).toBe(true)
    expect(limiter.check('ip-1').allowed).toBe(false)
  })

  it('conta limites separadamente por chave (IP)', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000 })

    expect(limiter.check('ip-1').allowed).toBe(true)
    expect(limiter.check('ip-1').allowed).toBe(false)
    expect(limiter.check('ip-2').allowed).toBe(true)
  })
})

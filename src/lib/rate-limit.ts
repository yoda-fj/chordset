import { NextRequest, NextResponse } from 'next/server'

/**
 * Rate limiter em memória por IP (janela deslizante simples).
 *
 * Política de confiança do IP:
 * - Lemos o IP de `x-forwarded-for` (PRIMEIRO IP da lista), com fallback
 *   para 'unknown'.
 * - Isso é seguro porque o deploy é atrás de proxy (Coolify/Traefik), que
 *   sobrescreve/normaliza o header x-forwarded-for com o IP real do cliente.
 * - NUNCA rode este app exposto diretamente na internet sem proxy: sem proxy,
 *   um cliente poderia forjar x-forwarded-for e escapar do rate limit.
 *
 * Limitação conhecida: o estado é em memória por instância do servidor.
 * Se houver múltiplas réplicas atrás do proxy, cada réplica conta separado.
 * Para multi-réplica, trocar por store compartilhado (ex: Redis).
 */

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  retryAfterSec: number
}

interface RateLimiterOptions {
  /** Máximo de requisições permitidas na janela. */
  limit: number
  /** Tamanho da janela em milissegundos. */
  windowMs: number
  /** Relógio injetável (para testes). Padrão: Date.now. */
  now?: () => number
}

export interface RateLimiter {
  check: (key: string) => RateLimitResult
}

export function createRateLimiter({
  limit,
  windowMs,
  now = () => Date.now(),
}: RateLimiterOptions): RateLimiter {
  // key -> timestamps das requisições dentro da janela
  const hits = new Map<string, number[]>()

  return {
    check(key: string): RateLimitResult {
      const current = now()
      const windowStart = current - windowMs

      let timestamps = hits.get(key) ?? []
      // Janela deslizante: descarta requisições fora da janela
      timestamps = timestamps.filter((t) => t > windowStart)

      if (timestamps.length >= limit) {
        const oldest = timestamps[0]
        const retryAfterSec = Math.max(
          1,
          Math.ceil((oldest + windowMs - current) / 1000)
        )
        if (timestamps.length === 0) {
          hits.delete(key)
        } else {
          hits.set(key, timestamps)
        }
        return { allowed: false, limit, remaining: 0, retryAfterSec }
      }

      timestamps.push(current)
      hits.set(key, timestamps)
      return {
        allowed: true,
        limit,
        remaining: limit - timestamps.length,
        retryAfterSec: 0,
      }
    },
  }
}

/** Limite padrão: 20 requisições por minuto por IP. */
export const API_RATE_LIMIT = 20
export const API_RATE_WINDOW_MS = 60_000

/** Instância compartilhada usada pelo middleware. */
export const apiRateLimiter = createRateLimiter({
  limit: API_RATE_LIMIT,
  windowMs: API_RATE_WINDOW_MS,
})

/**
 * Extrai o IP do cliente a partir do header x-forwarded-for
 * (primeiro IP da lista). Fallback: 'unknown'.
 * Ver política de confiança no comentário do topo do arquivo.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  return 'unknown'
}

/**
 * Aplica o rate limit para a requisição. Retorna uma NextResponse 429 (JSON)
 * quando o limite é excedido, ou null quando está dentro do limite.
 */
export function applyRateLimit(
  request: NextRequest,
  limiter: RateLimiter = apiRateLimiter
): NextResponse | null {
  const ip = getClientIp(request)
  const result = limiter.check(ip)

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Muitas requisições. Tente novamente em breve.',
        retryAfterSec: result.retryAfterSec,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfterSec),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    )
  }

  return null
}

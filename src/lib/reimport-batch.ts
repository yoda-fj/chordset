// =====================================
// RE-IMPORTAÇÃO EM MASSA DE CIFRAS
// =====================================
//
// Lógica pura da página /musicas/reimportar: interpretar a resposta de
// POST /api/musicas/reimportar durante o processamento sequencial do lote
// (sucesso, escolha de versão, rate limit com retry e erro).

import type { ReimportCandidate } from './reimport'

/** Tentativas por música quando a API responde 429. */
export const REIMPORT_BATCH_MAX_ATTEMPTS = 3

/** retryAfterSec do body 429 quando ausente/inválido. */
export const DEFAULT_RETRY_AFTER_SEC = 30

export type ReimportBatchDecision =
  | { kind: 'success'; tom: string | null; linhas: number }
  | { kind: 'needChoice'; candidates: ReimportCandidate[] }
  | { kind: 'rateLimited'; retryAfterSec: number }
  | { kind: 'error'; message: string }

/** Extrai retryAfterSec do body 429, caindo no fallback quando inválido. */
export function resolveRetryAfterSec(data: unknown, fallbackSec: number): number {
  const value = (data as Record<string, unknown> | null)?.retryAfterSec
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.ceil(parsed) : fallbackSec
}

/**
 * Converte (status HTTP, body json) da rota de reimportação na decisão do lote.
 * A rota responde 200 com { success, tom, linhas } ou { needChoice, candidates };
 * erros de validação/busca/scrape vêm em 4xx/5xx com { error }; 429 é do middleware.
 */
export function decideReimportResponse(status: number, data: unknown): ReimportBatchDecision {
  const body = (data ?? {}) as Record<string, unknown>

  if (status === 429) {
    return { kind: 'rateLimited', retryAfterSec: resolveRetryAfterSec(body, DEFAULT_RETRY_AFTER_SEC) }
  }

  if (status === 200 && body.success === true) {
    return {
      kind: 'success',
      tom: typeof body.tom === 'string' ? body.tom : null,
      linhas: typeof body.linhas === 'number' ? body.linhas : 0,
    }
  }

  if (status === 200 && body.needChoice === true && Array.isArray(body.candidates)) {
    return { kind: 'needChoice', candidates: body.candidates as ReimportCandidate[] }
  }

  return {
    kind: 'error',
    message: typeof body.error === 'string' ? body.error : `Erro inesperado (HTTP ${status})`,
  }
}

// =====================================
// BULK IMPORT DO CIFRA CLUB
// =====================================

/**
 * Pausa entre requisições no modo de importação em lote.
 * O Cifra Club usa proteção anti-robô (Akamai) que bloqueia rajadas
 * de requisições; manter ~1.5s entre pedidos evita o bloqueio.
 */
export const BULK_IMPORT_DELAY_MS = 1500

/** Limite de linhas aceitas por lote (proteção contra paste acidental gigante). */
export const BULK_IMPORT_MAX_LINES = 100

export type BulkImportItem =
  | { kind: 'url'; url: string; raw: string }
  | { kind: 'query'; query: string; raw: string }

/**
 * Converte o texto da textarea (uma música por linha) em itens de importação.
 *
 * - Linha começando com http:// ou https:// é tratada como URL (a validação
 *   do domínio acontece na API, que rejeita URLs fora do cifraclub.com.br).
 * - Qualquer outra linha não-vazia é tratada como busca livre "artista música".
 *
 * Query strings e hashes são removidos das URLs; barras finais também.
 */
export function parseBulkImportLines(text: string): BulkImportItem[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, BULK_IMPORT_MAX_LINES)
    .map((line) => {
      if (/^https?:\/\//i.test(line)) {
        return { kind: 'url' as const, url: normalizeUrl(line), raw: line }
      }
      return { kind: 'query' as const, query: line, raw: line }
    })
}

function normalizeUrl(line: string): string {
  try {
    const parsed = new URL(line)
    return `${parsed.origin}${parsed.pathname}`.replace(/\/+$/, '')
  } catch {
    return line
  }
}

/**
 * Dorme `ms`, mas verifica `shouldCancel` a cada 250ms para que o
 * cancelamento responda mesmo em esperas longas (ex: retry de 429).
 * Retorna true se completou a espera; false se foi cancelado.
 */
export function sleepCancellable(ms: number, shouldCancel: () => boolean): Promise<boolean> {
  return new Promise((resolve) => {
    const startedAt = Date.now()
    const tick = () => {
      if (shouldCancel()) return resolve(false)
      if (Date.now() - startedAt >= ms) return resolve(true)
      setTimeout(tick, 250)
    }
    tick()
  })
}

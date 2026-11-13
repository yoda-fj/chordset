// Testes de contrato do scraper contra um servidor HTTP local —
// o Cifra Club real não é acessado (ver comentário sobre 403 nos testes).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import http from 'http'
import type { AddressInfo } from 'net'
import type { CifraClubScraper } from './cifraclub'

// Fixture mínima com a estrutura que o scraper espera (pre[data-chord-content])
const FIXTURE_HTML = `<!doctype html><html><body>
<h1>É Preciso Saber Viver</h1>
<pre data-chord-content><div><b data-chord-name="D">D</b>Quem espera que a vida</div>
<div>Seja feita de ilusão</div></pre>
</body></html>`

let server: http.Server
let baseUrl: string
let scraper: CifraClubScraper
let lastPaths: string[] = []

beforeAll(async () => {
  server = http.createServer((req, res) => {
    lastPaths.push(req.url ?? '')
    if (req.url?.startsWith('/bloqueado')) {
      res.writeHead(403, { 'content-type': 'text/html' })
      res.end('<html><head><title>Access Denied</title></head><body>Access Denied</body></html>')
      return
    }
    res.writeHead(200, { 'content-type': 'text/html' })
    res.end(FIXTURE_HTML)
  })
  await new Promise<void>((resolve) => server.listen(0, resolve))
  const { port } = server.address() as AddressInfo
  baseUrl = `http://127.0.0.1:${port}/`
  process.env.CIFRACLUB_BASE_URL = baseUrl
  const mod = await import('./cifraclub')
  scraper = mod.getScraper()
})

afterAll(async () => {
  await scraper.close()
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

describe('CifraClubScraper', () => {
  it('HTTP 403 (IP bloqueado) falha rápido com mensagem clara, sem timeout de 15s', async () => {
    const started = Date.now()
    const result = await scraper.scrape('bloqueado', 'qualquer')
    const elapsed = Date.now() - started

    expect('error' in result ? result.error : '').toContain('Cifra Club recusou o acesso (HTTP 403)')
    expect(elapsed).toBeLessThan(10_000)
  }, 30_000)

  it('página válida: extrai título e linhas da cifra', async () => {
    const result = await scraper.scrape('titas', 'e-preciso-saber-viver')

    expect('error' in result ? result.error : 'ok').toBe('ok')
    if ('error' in result) return
    expect(result.cifra?.join('\n')).toContain('Quem espera que a vida')
    expect(result.cifra?.some((l) => l.includes('É Preciso Saber Viver'))).toBe(false)
  }, 30_000)

  it('versão alternativa: URL SEMPRE com barra final (sem ela o CC devolve 404)', async () => {
    lastPaths = []
    const result = await scraper.scrape('titas', 'e-preciso-saber-viver', 'simplificada')

    expect('error' in result ? result.error : 'ok').toBe('ok')
    const requested = lastPaths.find((p) => p.includes('simplificada'))
    expect(requested).toBe('/titas/e-preciso-saber-viver/simplificada/')
  }, 30_000)
})

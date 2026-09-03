import { NextRequest, NextResponse } from 'next/server'
import { applyRateLimit } from '@/lib/rate-limit'

/**
 * Extensões de assets estáticos que não exigem autenticação.
 * Só são consideradas para paths FORA de /api/ (rotas de API nunca
 * são tratadas como asset estático).
 */
const STATIC_ASSET_EXTENSIONS = new Set([
  'js',
  'css',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'svg',
  'ico',
  'woff',
  'woff2',
  'mp3',
  'wav',
  'ogg',
  'json',
  'map',
  'txt',
  'webmanifest',
])

/**
 * Rotas de API com rate limit por IP (além de Basic Auth).
 * Scraping (cifraclub), importação e OCR são caros/abusáveis.
 */
const RATE_LIMITED_PREFIXES = ['/api/cifraclub/', '/api/import-song', '/api/ocr/']

/**
 * Exceções públicas explícitas (bypass de autenticação).
 * Manter esta lista o mais curta possível.
 *
 * TODO (Fase 4B.1): adicionar bypass público para
 * '/eventos/compartilhado/[token]' — implementar como matcher de
 * prefixo/padrão aqui, NÃO reintroduzir bypass genérico por extensão.
 */
function isPublicPath(pathname: string): boolean {
  // Internos do Next.js (o matcher abaixo já exclui _next/static e
  // _next/image; isto cobre o restante, ex.: _next/data)
  if (pathname.startsWith('/_next')) return true

  // Health check usado por proxy/monitoramento (Coolify/Traefik)
  if (pathname.startsWith('/api/health')) return true

  if (pathname === '/favicon.ico') return true

  // Assets estáticos: allowlist explícita de extensões, apenas fora de /api/
  if (!pathname.startsWith('/api/') && isStaticAssetPath(pathname)) {
    return true
  }

  return false
}

function isStaticAssetPath(pathname: string): boolean {
  const lastSegment = pathname.split('/').pop() ?? ''
  const dotIndex = lastSegment.lastIndexOf('.')
  if (dotIndex <= 0) return false // sem extensão (ou arquivo oculto tipo ".well-known")
  const ext = lastSegment.slice(dotIndex + 1).toLowerCase()
  return STATIC_ASSET_EXTENSIONS.has(ext)
}

export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname

  // Rotas públicas (assets, internals do Next, health check) — sem auth nem rate limit
  if (isPublicPath(url)) {
    return NextResponse.next()
  }

  // Rate limit por IP nas rotas caras/abusáveis (antes do auth,
  // para barrar hammering não autenticado)
  if (RATE_LIMITED_PREFIXES.some((prefix) => url.startsWith(prefix))) {
    const limited = applyRateLimit(request)
    if (limited) return limited
  }

  const authUser = process.env.BASIC_AUTH_USER
  const authPassword = process.env.BASIC_AUTH_PASSWORD

  // If no auth configured, allow access
  if (!authUser || !authPassword) {
    return NextResponse.next()
  }

  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    const [user, password] = Buffer.from(authHeader.split(' ')[1], 'base64')
      .toString()
      .split(':')

    if (user === authUser && password === authPassword) {
      return NextResponse.next()
    }
  }

  return new NextResponse('Autenticação necessária', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="ChordSet"',
      'Content-Type': 'text/plain',
    },
  })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - api/health (health check)
     */
    '/((?!_next/static|_next/image|api/health).*)',
  ],
}

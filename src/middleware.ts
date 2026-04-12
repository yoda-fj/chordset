import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const url = request.nextUrl.pathname

  // Rotas internas de scraping (usadas pelo frontend)
  if (url.startsWith('/api/cifraclub/')) {
    return NextResponse.next()
  }

  // Skip for API health checks and static files
  if (
    url.startsWith('/_next') ||
    url.startsWith('/api/health') ||
    url === '/favicon.ico' ||
    url.includes('.')
  ) {
    return NextResponse.next()
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

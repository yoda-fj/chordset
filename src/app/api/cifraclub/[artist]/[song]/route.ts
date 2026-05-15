import { NextRequest, NextResponse } from 'next/server'
import { getScraper } from '@/lib/cifraclub-scraper/cifraclub'

// Força runtime Node.js (não Edge) pra Playwright funcionar
export const runtime = 'nodejs'

// GET /api/cifraclub/[artist]/[song]?version=simplificada
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ artist: string; song: string }> }
) {
  try {
    const { artist, song } = await params
    
    if (!artist || !song) {
      return NextResponse.json(
        { error: 'Artist e song são obrigatórios' },
        { status: 400 }
      )
    }

    // Pega a versão da query string
    const { searchParams } = new URL(request.url)
    const version = searchParams.get('version') || undefined

    const scraper = getScraper()
    const result = await scraper.scrape(artist, song, version)

    if ('error' in result) {
      return NextResponse.json(result, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('[CifraClub Scrape] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar cifra' },
      { status: 502 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

// Força runtime Node.js (não Edge) pra Playwright funcionar
export const runtime = 'nodejs'

// GET /api/cifraclub/[artist]/[song]
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

    // Import dinâmico do scraper (evita bundling do Playwright pelo webpack)
    const { getScraper } = await import('@/lib/cifraclub-scraper/cifraclub')
    const scraper = getScraper()
    const result = await scraper.scrape(artist, song)

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

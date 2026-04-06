import { NextRequest, NextResponse } from 'next/server'
import { search } from '@/lib/cifraclub-scraper/search'

// GET /api/cifraclub/search?q=query
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get('q')

    if (!q) {
      return NextResponse.json(
        { error: 'Parâmetro "q" é obrigatório' },
        { status: 400 }
      )
    }

    const result = await search(q)
    return NextResponse.json(result)
  } catch (error) {
    console.error('[CifraClub Search] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar músicas' },
      { status: 502 }
    )
  }
}

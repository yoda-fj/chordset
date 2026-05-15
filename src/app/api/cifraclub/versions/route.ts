import { NextRequest, NextResponse } from 'next/server'
import { discoverVersions } from '@/lib/cifraclub-scraper/versions'

// GET /api/cifraclub/versions?artist=artista&song=musica
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artist = searchParams.get('artist')
    const song = searchParams.get('song')

    if (!artist || !song) {
      return NextResponse.json(
        { error: 'Parâmetros "artist" e "song" são obrigatórios' },
        { status: 400 }
      )
    }

    const versions = await discoverVersions(artist, song)

    return NextResponse.json({
      success: true,
      artist,
      song,
      versions,
      total: versions.length,
    })
  } catch (error) {
    console.error('[CifraClub Versions API] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar versões' },
      { status: 502 }
    )
  }
}

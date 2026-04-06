import { NextRequest, NextResponse } from 'next/server'
import { musicasDb } from '@/lib/musicas-db'

// GET /api/musicas - Listar todas as músicas
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const tag = searchParams.get('tag') || ''
    
    let musicas
    if (search || tag) {
      musicas = musicasDb.search(search, tag || undefined)
    } else {
      musicas = musicasDb.getAll()
    }
    
    return NextResponse.json(musicas)
  } catch (error) {
    console.error('Erro ao buscar músicas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar músicas' },
      { status: 500 }
    )
  }
}

// POST /api/musicas - Criar nova música
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validação
    if (!body.titulo || !body.artista) {
      return NextResponse.json(
        { error: 'Título e artista são obrigatórios' },
        { status: 400 }
      )
    }
    
    const musica = musicasDb.create({
      titulo: body.titulo,
      artista: body.artista,
      tom_original: body.tom_original,
      cifra: body.cifra,
      tags: body.tags || []
    })
    
    return NextResponse.json(musica, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar música:', error)
    return NextResponse.json(
      { error: 'Erro ao criar música' },
      { status: 500 }
    )
  }
}

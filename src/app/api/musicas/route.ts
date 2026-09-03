import { NextRequest, NextResponse } from 'next/server'
import { musicasDb } from '@/lib/musicas-db'
import { jsonError } from '@/lib/api-helpers'
import { musicaCreateSchema } from '@/lib/validation'

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
    return jsonError('Erro ao buscar músicas', 500)
  }
}

// POST /api/musicas - Criar nova música
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsedBody = musicaCreateSchema.safeParse(body)
    if (!parsedBody.success) {
      return jsonError('Payload inválido', 400, parsedBody.error.issues)
    }

    const musica = musicasDb.create({
      titulo: parsedBody.data.titulo,
      artista: parsedBody.data.artista ?? '',
      tom_original: parsedBody.data.tom_original ?? undefined,
      cifra: parsedBody.data.cifra ?? undefined,
      tags: parsedBody.data.tags ?? []
    })
    
    return NextResponse.json(musica, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar música:', error)
    return jsonError('Erro ao criar música', 500)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { musicasDb } from '@/lib/musicas-db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/musicas/[id] - Buscar música específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const musica = musicasDb.getById(parseInt(id))
    
    if (!musica) {
      return NextResponse.json(
        { error: 'Música não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(musica)
  } catch (error) {
    console.error('Erro ao buscar música:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar música' },
      { status: 500 }
    )
  }
}

// PUT /api/musicas/[id] - Atualizar música
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const musica = musicasDb.update(parseInt(id), {
      titulo: body.titulo,
      artista: body.artista,
      tom_original: body.tom_original,
      cifra: body.cifra,
      tags: body.tags,
      observacao: body.observacao,
      groove: body.groove,
      drum_pattern_id: body.drum_pattern_id
    })
    
    return NextResponse.json(musica)
  } catch (error) {
    console.error('Erro ao atualizar música:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar música' },
      { status: 500 }
    )
  }
}

// DELETE /api/musicas/[id] - Deletar música
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    musicasDb.delete(parseInt(id))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar música:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar música' },
      { status: 500 }
    )
  }
}

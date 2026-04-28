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

    const updateData: Record<string, any> = {}
    if (body.titulo !== undefined) updateData.titulo = body.titulo
    if (body.artista !== undefined) updateData.artista = body.artista
    if (body.tom_original !== undefined) updateData.tom_original = body.tom_original
    if (body.cifra !== undefined) updateData.cifra = body.cifra
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.observacao !== undefined) updateData.observacao = body.observacao
    if (body.groove !== undefined) updateData.groove = body.groove
    if (body.drum_pattern_id !== undefined) updateData.drum_pattern_id = body.drum_pattern_id
    if (body.bpm !== undefined) updateData.bpm = body.bpm
    if (body.volume !== undefined) updateData.volume = body.volume

    const musica = musicasDb.update(parseInt(id), updateData)

    return NextResponse.json(musica)
  } catch (error) {
    console.error('Erro ao atualizar música:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar música', details: String(error) },
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

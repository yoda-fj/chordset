import { NextRequest, NextResponse } from 'next/server'
import { musicasDb } from '@/lib/musicas-db'

// PUT /api/musicas/[id]/transpose - Atualizar tom da música
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const musicaId = parseInt(id)
    
    if (isNaN(musicaId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    if (!body.tom_original) {
      return NextResponse.json(
        { error: 'tom_original é obrigatório' },
        { status: 400 }
      )
    }
    
    // Atualiza o tom original da música
    const updated = musicasDb.update(musicaId, {
      tom_original: body.tom_original
    })
    
    if (!updated) {
      return NextResponse.json(
        { error: 'Música não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error('[Transpose] Error:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar tom' },
      { status: 500 }
    )
  }
}

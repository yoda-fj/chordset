import { NextRequest, NextResponse } from 'next/server'
import { setlistsDb } from '@/lib/setlists-db'

// PUT /api/eventos/[id]/musicas/[musicaId] - Atualizar musica do evento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; musicaId: string }> }
) {
  try {
    const { id, musicaId } = await params
    const eventoMusicaId = parseInt(musicaId)
    
    if (isNaN(eventoMusicaId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    const updated = setlistsDb.update(eventoMusicaId, {
      ordem: body.ordem,
      tom_evento: body.tom_evento,
      observacoes: body.observacoes,
      confirmada: body.confirmada,
      responsavel: body.responsavel
    })
    
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar evento_musica:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar evento_musica' },
      { status: 500 }
    )
  }
}

// DELETE /api/eventos/[id]/musicas/[musicaId] - Remover musica do evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; musicaId: string }> }
) {
  try {
    const { musicaId } = await params
    const eventoMusicaId = parseInt(musicaId)
    
    if (isNaN(eventoMusicaId)) {
      return NextResponse.json(
        { error: 'ID inválido' },
        { status: 400 }
      )
    }
    
    setlistsDb.delete(eventoMusicaId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar evento_musica:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar evento_musica' },
      { status: 500 }
    )
  }
}

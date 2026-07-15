import { NextRequest, NextResponse } from 'next/server'
import { setlistsDb } from '@/lib/setlists-db'
import { jsonError, parseId } from '@/lib/api-helpers'

// PUT /api/eventos/[id]/musicas/[musicaId] - Atualizar musica do evento
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; musicaId: string }> }
) {
  try {
    const { musicaId } = await params
    const eventoMusicaId = parseId(musicaId)
    
    if (eventoMusicaId === null) {
      return jsonError('ID inválido', 400)
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
    return jsonError('Erro ao atualizar evento_musica', 500)
  }
}

// DELETE /api/eventos/[id]/musicas/[musicaId] - Remover musica do evento
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; musicaId: string }> }
) {
  try {
    const { musicaId } = await params
    const eventoMusicaId = parseId(musicaId)
    
    if (eventoMusicaId === null) {
      return jsonError('ID inválido', 400)
    }
    
    setlistsDb.delete(eventoMusicaId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar evento_musica:', error)
    return jsonError('Erro ao deletar evento_musica', 500)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { setlistsDb } from '@/lib/setlists-db'
import { jsonError, parseId } from '@/lib/api-helpers'

// GET /api/eventos/[id]/musicas - Listar musicas do evento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventoId = parseId(id)
    
    if (eventoId === null) {
      return jsonError('ID do evento inválido', 400)
    }
    
    const musicas = setlistsDb.getByEventoId(eventoId)
    return NextResponse.json(musicas)
  } catch (error) {
    console.error('Erro ao buscar musicas do evento:', error)
    return jsonError('Erro ao buscar musicas do evento', 500)
  }
}

// POST /api/eventos/[id]/musicas - Adicionar musica ao evento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventoId = parseId(id)
    
    if (eventoId === null) {
      return jsonError('ID do evento inválido', 400)
    }
    
    const body = await request.json()
    
    // Validação
    if (!body.musica_id) {
      return jsonError('musica_id é obrigatório', 400)
    }
    
    // Se não informar ordem, coloca no final
    let ordem = body.ordem
    if (!ordem) {
      const existingMusicas = setlistsDb.getByEventoId(eventoId)
      ordem = existingMusicas.length + 1
    }
    
    const eventoMusica = setlistsDb.create({
      evento_id: eventoId,
      musica_id: body.musica_id,
      ordem: ordem,
      tom_evento: body.tom_evento,
      observacoes: body.observacoes,
      confirmada: body.confirmada || false,
      responsavel: body.responsavel
    })
    
    return NextResponse.json(eventoMusica, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar evento_musica:', error)
    return jsonError('Erro ao criar evento_musica', 500)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { setlistsDb } from '@/lib/setlists-db'

// GET /api/eventos/[id]/musicas - Listar musicas do evento
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventoId = parseInt(id)
    
    if (isNaN(eventoId)) {
      return NextResponse.json(
        { error: 'ID do evento inválido' },
        { status: 400 }
      )
    }
    
    const musicas = setlistsDb.getByEventoId(eventoId)
    return NextResponse.json(musicas)
  } catch (error) {
    console.error('Erro ao buscar musicas do evento:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar musicas do evento' },
      { status: 500 }
    )
  }
}

// POST /api/eventos/[id]/musicas - Adicionar musica ao evento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventoId = parseInt(id)
    
    if (isNaN(eventoId)) {
      return NextResponse.json(
        { error: 'ID do evento inválido' },
        { status: 400 }
      )
    }
    
    const body = await request.json()
    
    // Validação
    if (!body.musica_id) {
      return NextResponse.json(
        { error: 'musica_id é obrigatório' },
        { status: 400 }
      )
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
    return NextResponse.json(
      { error: 'Erro ao criar evento_musica' },
      { status: 500 }
    )
  }
}

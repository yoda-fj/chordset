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

    // Adição em lote: { musica_ids: number[] }
    if (body.musica_ids !== undefined) {
      if (!Array.isArray(body.musica_ids) || body.musica_ids.length === 0) {
        return jsonError('musica_ids deve ser um array não vazio', 400)
      }

      if (body.musica_ids.length > 200) {
        return jsonError('Máximo de 200 músicas por requisição', 400)
      }

      if (!body.musica_ids.every((id: unknown) => typeof id === 'number' && Number.isInteger(id) && id > 0)) {
        return jsonError('musica_ids deve conter apenas IDs inteiros positivos', 400)
      }

      const quantidade = setlistsDb.createMany(eventoId, body.musica_ids)

      // Últimas N entradas ordenadas = as recém-criadas (ordem crescente)
      const todas = setlistsDb.getByEventoId(eventoId)
      const criadas = quantidade > 0 ? todas.slice(todas.length - quantidade) : []

      return NextResponse.json({ success: true, quantidade, musicas: criadas }, { status: 201 })
    }

    // Adição única: { musica_id }
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

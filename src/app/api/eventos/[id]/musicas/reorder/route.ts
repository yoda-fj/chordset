import { NextRequest, NextResponse } from 'next/server'
import { setlistsDb } from '@/lib/setlists-db'
import { jsonError, parseId } from '@/lib/api-helpers'

// POST /api/eventos/[id]/musicas/reorder - Reordenar musicas do evento
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
    
    if (!body.orderedIds || !Array.isArray(body.orderedIds)) {
      return jsonError('orderedIds é obrigatório e deve ser um array', 400)
    }
    
    setlistsDb.reorder(eventoId, body.orderedIds)
    
    const musicas = setlistsDb.getByEventoId(eventoId)
    return NextResponse.json(musicas)
  } catch (error) {
    console.error('Erro ao reordenar musicas:', error)
    return jsonError('Erro ao reordenar musicas', 500)
  }
}

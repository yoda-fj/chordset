import { NextRequest, NextResponse } from 'next/server'
import { setlistsDb } from '@/lib/setlists-db'

// POST /api/eventos/[id]/musicas/reorder - Reordenar musicas do evento
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
    
    if (!body.orderedIds || !Array.isArray(body.orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds é obrigatório e deve ser um array' },
        { status: 400 }
      )
    }
    
    setlistsDb.reorder(eventoId, body.orderedIds)
    
    const musicas = setlistsDb.getByEventoId(eventoId)
    return NextResponse.json(musicas)
  } catch (error) {
    console.error('Erro ao reordenar musicas:', error)
    return NextResponse.json(
      { error: 'Erro ao reordenar musicas' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { eventosDb } from '@/lib/eventos-db'
import { setlistsDb } from '@/lib/setlists-db'

// POST /api/eventos/[id]/clone - Clonar evento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventoId = parseInt(id)
    
    if (isNaN(eventoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    
    const body = await request.json()
    const novoNome = body.nome
    
    if (!novoNome) {
      return NextResponse.json({ error: 'Nome do novo evento é obrigatório' }, { status: 400 })
    }
    
    // Buscar evento original
    const eventoOriginal = eventosDb.getById(eventoId)
    if (!eventoOriginal) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })
    }
    
    // Buscar músicas do evento original
    const musicasOriginais = setlistsDb.getByEventoId(eventoId)
    
    // Criar novo evento
    const novoEvento = eventosDb.create({
      nome: novoNome,
      data: body.data || null,
      local: body.local || eventoOriginal.local || null,
      observacoes: body.observacoes || eventoOriginal.observacoes || null,
    })
    
    // Copiar músicas
    let musicasCopiadas = []
    for (const musica of musicasOriginais) {
      const created = setlistsDb.create({
        evento_id: novoEvento.id,
        musica_id: musica.musica_id,
        ordem: musica.ordem,
        tom_evento: musica.tom_evento || undefined,
        observacoes: musica.observacoes || undefined,
      })
      musicasCopiadas.push(created)
    }
    
    return NextResponse.json({
      sucesso: true,
      evento: novoEvento,
      musicas: musicasCopiadas,
      quantidade: musicasCopiadas.length
    })
  } catch (error) {
    console.error('Erro ao clonar evento:', error)
    return NextResponse.json({ error: 'Erro ao clonar evento' }, { status: 500 })
  }
}

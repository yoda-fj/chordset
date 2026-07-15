import { NextRequest, NextResponse } from 'next/server'
import { eventosDb } from '@/lib/eventos-db'
import { setlistsDb } from '@/lib/setlists-db'
import { jsonError, parseId } from '@/lib/api-helpers'

// POST /api/eventos/[id]/clone - Clonar evento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventoId = parseId(id)

    if (eventoId === null) {
      return jsonError('ID inválido', 400)
    }

    const body = await request.json()
    const novoNome = body.nome

    if (!novoNome) {
      return jsonError('Nome do novo evento é obrigatório', 400)
    }

    // Buscar evento original
    const eventoOriginal = eventosDb.getById(eventoId)
    if (!eventoOriginal) {
      return jsonError('Evento não encontrado', 404)
    }

    // Criar novo evento
    const novoEvento = eventosDb.create({
      nome: novoNome,
      data: body.data || new Date().toISOString().split('T')[0],
      local: body.local || eventoOriginal.local || undefined,
      observacoes: body.observacoes || eventoOriginal.observacoes || undefined,
    })

    // Copiar músicas (transacional)
    const quantidade = setlistsDb.copyFromEvento(eventoId, novoEvento.id)

    return NextResponse.json({
      sucesso: true,
      evento: novoEvento,
      quantidade,
    })
  } catch (error) {
    console.error('Erro ao clonar evento:', error)
    return jsonError('Erro ao clonar evento', 500)
  }
}

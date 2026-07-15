import { NextRequest, NextResponse } from 'next/server'
import { eventosDb } from '@/lib/eventos-db'
import { jsonError, parseId } from '@/lib/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/eventos/[id] - Buscar evento específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const eventoId = parseId(id)
    if (eventoId === null) {
      return jsonError('ID inválido', 400)
    }
    const evento = eventosDb.getById(eventoId)
    
    if (!evento) {
      return jsonError('Evento não encontrado', 404)
    }
    
    return NextResponse.json(evento)
  } catch (error) {
    console.error('Erro ao buscar evento:', error)
    return jsonError('Erro ao buscar evento', 500)
  }
}

// PUT /api/eventos/[id] - Atualizar evento
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const eventoId = parseId(id)
    if (eventoId === null) {
      return jsonError('ID inválido', 400)
    }
    const body = await request.json()
    
    // Se isStudyList for true, zera campos que não se aplicam
    const updateData = {
      nome: body.nome,
      data: body.isStudyList ? null : body.data,
      hora: body.isStudyList ? null : body.hora,
      local: body.isStudyList ? null : body.local,
      status: body.isStudyList ? null : body.status,
      template_id: body.template_id,
      tags: body.isStudyList ? [] : body.tags,
      observacoes: body.observacoes
    }
    
    const evento = eventosDb.update(eventoId, updateData)
    
    return NextResponse.json(evento)
  } catch (error) {
    console.error('Erro ao atualizar evento:', error)
    return jsonError('Erro ao atualizar evento', 500)
  }
}

// DELETE /api/eventos/[id] - Deletar evento
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const eventoId = parseId(id)
    if (eventoId === null) {
      return jsonError('ID inválido', 400)
    }
    eventosDb.delete(eventoId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar evento:', error)
    return jsonError('Erro ao deletar evento', 500)
  }
}

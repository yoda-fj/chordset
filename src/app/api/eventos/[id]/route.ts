import { NextRequest, NextResponse } from 'next/server'
import { eventosDb } from '@/lib/eventos-db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/eventos/[id] - Buscar evento específico
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const evento = eventosDb.getById(parseInt(id))
    
    if (!evento) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(evento)
  } catch (error) {
    console.error('Erro ao buscar evento:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar evento' },
      { status: 500 }
    )
  }
}

// PUT /api/eventos/[id] - Atualizar evento
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const evento = eventosDb.update(parseInt(id), {
      nome: body.nome,
      data: body.data,
      hora: body.hora,
      local: body.local,
      status: body.status,
      template_id: body.template_id,
      tags: body.tags,
      observacoes: body.observacoes
    })
    
    return NextResponse.json(evento)
  } catch (error) {
    console.error('Erro ao atualizar evento:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar evento' },
      { status: 500 }
    )
  }
}

// DELETE /api/eventos/[id] - Deletar evento
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    eventosDb.delete(parseInt(id))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar evento:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar evento' },
      { status: 500 }
    )
  }
}

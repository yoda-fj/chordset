import { NextRequest, NextResponse } from 'next/server'
import { practiceSessionsDb } from '@/lib/practice-sessions-db'
import { jsonError, parseId } from '@/lib/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/practice-sessions/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const sessionId = parseId(id)
    if (sessionId === null) {
      return jsonError('ID inválido', 400)
    }
    const session = practiceSessionsDb.getById(sessionId)
    
    if (!session) {
      return jsonError('Sessão não encontrada', 404)
    }
    
    return NextResponse.json(session)
  } catch (error) {
    console.error('Erro ao buscar sessão:', error)
    return jsonError('Erro ao buscar sessão', 500)
  }
}

// PUT /api/practice-sessions/[id] - Atualizar sessão
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const sessionId = parseId(id)
    if (sessionId === null) {
      return jsonError('ID inválido', 400)
    }
    const body = await request.json()
    
    const session = practiceSessionsDb.update(sessionId, {
      status: body.status,
      difficulty: body.difficulty,
      total_practice_time_seconds: body.total_practice_time_seconds,
      last_practiced_at: body.last_practiced_at,
      notes: body.notes,
    })
    
    if (!session) {
      return jsonError('Sessão não encontrada', 404)
    }
    
    return NextResponse.json(session)
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error)
    return jsonError('Erro ao atualizar sessão', 500)
  }
}

// DELETE /api/practice-sessions/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const sessionId = parseId(id)
    if (sessionId === null) {
      return jsonError('ID inválido', 400)
    }
    practiceSessionsDb.delete(sessionId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar sessão:', error)
    return jsonError('Erro ao deletar sessão', 500)
  }
}

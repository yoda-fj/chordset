import { NextRequest, NextResponse } from 'next/server'
import { practiceSessionsDb } from '@/lib/practice-sessions-db'
import { jsonError, parseId } from '@/lib/api-helpers'
import { practiceSessionUpdateSchema } from '@/lib/validation'

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

    const parsedBody = practiceSessionUpdateSchema.safeParse(body)
    if (!parsedBody.success) {
      return jsonError('Payload inválido', 400, parsedBody.error.issues)
    }

    const session = practiceSessionsDb.update(sessionId, {
      status: parsedBody.data.status,
      difficulty: parsedBody.data.difficulty,
      total_practice_time_seconds: parsedBody.data.total_practice_time_seconds,
      last_practiced_at: parsedBody.data.last_practiced_at,
      notes: parsedBody.data.notes,
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

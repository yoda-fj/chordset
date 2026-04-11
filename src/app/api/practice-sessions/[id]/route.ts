import { NextRequest, NextResponse } from 'next/server'
import { practiceSessionsDb } from '@/lib/practice-sessions-db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/practice-sessions/[id]
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const session = practiceSessionsDb.getById(parseInt(id))
    
    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(session)
  } catch (error) {
    console.error('Erro ao buscar sessão:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar sessão' },
      { status: 500 }
    )
  }
}

// PUT /api/practice-sessions/[id] - Atualizar sessão
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    
    const session = practiceSessionsDb.update(parseInt(id), {
      status: body.status,
      difficulty: body.difficulty,
      total_practice_time_seconds: body.total_practice_time_seconds,
      last_practiced_at: body.last_practiced_at,
      notes: body.notes,
    })
    
    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(session)
  } catch (error) {
    console.error('Erro ao atualizar sessão:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar sessão' },
      { status: 500 }
    )
  }
}

// DELETE /api/practice-sessions/[id]
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    practiceSessionsDb.delete(parseInt(id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar sessão:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar sessão' },
      { status: 500 }
    )
  }
}

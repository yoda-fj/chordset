import { NextRequest, NextResponse } from 'next/server'
import { practiceSessionsDb } from '@/lib/practice-sessions-db'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/practice-sessions/[id]/add-time
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    
    if (typeof body.seconds !== 'number') {
      return NextResponse.json(
        { error: 'seconds é obrigatório e deve ser um número' },
        { status: 400 }
      )
    }
    
    const session = practiceSessionsDb.addPracticeTime(parseInt(id), body.seconds)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Sessão não encontrada' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(session)
  } catch (error) {
    console.error('Erro ao adicionar tempo de prática:', error)
    return NextResponse.json(
      { error: 'Erro ao adicionar tempo de prática' },
      { status: 500 }
    )
  }
}

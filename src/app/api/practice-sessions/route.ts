import { NextRequest, NextResponse } from 'next/server'
import { practiceSessionsDb } from '@/lib/practice-sessions-db'
import { jsonError } from '@/lib/api-helpers'
import { practiceSessionSchema } from '@/lib/validation'

// GET /api/practice-sessions - Listar todas as sessões
export async function GET() {
  try {
    const sessions = practiceSessionsDb.getAll()
    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Erro ao buscar sessões de prática:', error)
    return jsonError('Erro ao buscar sessões de prática', 500)
  }
}

// POST /api/practice-sessions - Criar nova sessão
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsedBody = practiceSessionSchema.safeParse(body)
    if (!parsedBody.success) {
      return jsonError('Payload inválido', 400, parsedBody.error.issues)
    }

    const session = practiceSessionsDb.create({
      musica_id: parsedBody.data.musica_id,
      status: parsedBody.data.status || 'needs_practice',
      difficulty: parsedBody.data.difficulty || 'medium',
      total_practice_time_seconds: parsedBody.data.total_practice_time_seconds ?? 0,
      last_practiced_at: parsedBody.data.last_practiced_at ?? null,
      notes: parsedBody.data.notes ?? null,
    })
    
    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar sessão de prática:', error)
    return jsonError('Erro ao criar sessão de prática', 500)
  }
}

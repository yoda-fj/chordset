import { NextRequest, NextResponse } from 'next/server'
import { practiceSessionsDb } from '@/lib/practice-sessions-db'
import { jsonError } from '@/lib/api-helpers'

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
    
    if (!body.musica_id) {
      return jsonError('musica_id é obrigatório', 400)
    }
    
    const session = practiceSessionsDb.create({
      musica_id: body.musica_id,
      status: body.status || 'needs_practice',
      difficulty: body.difficulty || 'medium',
      total_practice_time_seconds: body.total_practice_time_seconds || 0,
      last_practiced_at: body.last_practiced_at || null,
      notes: body.notes || null,
    })
    
    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar sessão de prática:', error)
    return jsonError('Erro ao criar sessão de prática', 500)
  }
}

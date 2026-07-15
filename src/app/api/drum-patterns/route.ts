import { NextRequest, NextResponse } from 'next/server'
import { drumPatternsDb } from '@/lib/drum-patterns-db'
import { jsonError } from '@/lib/api-helpers'

// GET /api/drum-patterns - Listar ritmos
export async function GET() {
  try {
    const patterns = drumPatternsDb.getAll()
    return NextResponse.json(patterns)
  } catch (error) {
    console.error('[drum-patterns GET]', error)
    return jsonError('Erro ao buscar ritmos', 500)
  }
}

// POST /api/drum-patterns - Criar ritmo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nome, bpm, kit, steps } = body

    if (!nome || !steps) {
      return jsonError('Nome e steps são obrigatórios', 400)
    }

    const pattern = drumPatternsDb.create({ nome, bpm, kit, steps })
    return NextResponse.json(pattern, { status: 201 })
  } catch (error) {
    console.error('[drum-patterns POST]', error)
    return jsonError('Erro ao criar ritmo', 500)
  }
}

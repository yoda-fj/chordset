import { NextRequest, NextResponse } from 'next/server'
import { drumPatternsDb } from '@/lib/drum-patterns-db'
import { jsonError, parseId } from '@/lib/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/drum-patterns/[id] - Obter ritmo por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const patternId = parseId(id)
    if (patternId === null) {
      return jsonError('ID inválido', 400)
    }

    const pattern = drumPatternsDb.getById(patternId)
    if (!pattern) {
      return jsonError('Ritmo não encontrado', 404)
    }
    return NextResponse.json(pattern)
  } catch (error) {
    console.error('[drum-patterns id GET]', error)
    return jsonError('Erro ao buscar ritmo', 500)
  }
}

// PUT /api/drum-patterns/[id] - Atualizar ritmo
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const patternId = parseId(id)
    if (patternId === null) {
      return jsonError('ID inválido', 400)
    }

    const body = await request.json()
    const { nome, bpm, kit, steps } = body

    const pattern = drumPatternsDb.update(patternId, { nome, bpm, kit, steps })
    return NextResponse.json(pattern)
  } catch (error) {
    if (error instanceof Error && error.message === 'Ritmo não encontrado') {
      return jsonError('Ritmo não encontrado', 404)
    }
    console.error('[drum-patterns id PUT]', error)
    return jsonError('Erro ao atualizar ritmo', 500)
  }
}

// DELETE /api/drum-patterns/[id] - Excluir ritmo
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const patternId = parseId(id)
    if (patternId === null) {
      return jsonError('ID inválido', 400)
    }

    const exists = drumPatternsDb.getById(patternId)
    if (!exists) {
      return jsonError('Ritmo não encontrado', 404)
    }

    // Safe delete: check if any music is using this pattern
    if (drumPatternsDb.countUsage(patternId) > 0) {
      return jsonError('Este ritmo está em uso por uma ou mais músicas. Desassocie-o primeiro.', 409)
    }

    drumPatternsDb.delete(patternId)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[drum-patterns id DELETE]', error)
    return jsonError('Erro ao excluir ritmo', 500)
  }
}

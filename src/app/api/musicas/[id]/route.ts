import { NextRequest, NextResponse } from 'next/server'
import { musicasDb } from '@/lib/musicas-db'
import { jsonError, parseId } from '@/lib/api-helpers'
import { musicaUpdateSchema } from '@/lib/validation'
import type { UpdateMusicaInput } from '@/types/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/musicas/[id] - Buscar música específica
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const musicaId = parseId(id)
    if (musicaId === null) {
      return jsonError('ID inválido', 400)
    }
    const musica = musicasDb.getById(musicaId)
    
    if (!musica) {
      return jsonError('Música não encontrada', 404)
    }
    
    return NextResponse.json(musica)
  } catch (error) {
    console.error('Erro ao buscar música:', error)
    return jsonError('Erro ao buscar música', 500)
  }
}

// PUT /api/musicas/[id] - Atualizar música
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const musicaId = parseId(id)
    if (musicaId === null) {
      return jsonError('ID inválido', 400)
    }
    const body = await request.json()

    const parsedBody = musicaUpdateSchema.safeParse(body)
    if (!parsedBody.success) {
      return jsonError('Payload inválido', 400, parsedBody.error.issues)
    }

    const data = parsedBody.data
    const updateData: UpdateMusicaInput = {}
    if (data.titulo !== undefined) updateData.titulo = data.titulo
    if (data.artista !== undefined) updateData.artista = data.artista
    if (data.tom_original !== undefined) updateData.tom_original = data.tom_original
    if (data.cifra !== undefined) updateData.cifra = data.cifra
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.observacao !== undefined) updateData.observacao = data.observacao
    if (data.groove !== undefined) updateData.groove = data.groove
    if (data.drum_pattern_id !== undefined) updateData.drum_pattern_id = data.drum_pattern_id
    if (data.bpm !== undefined) updateData.bpm = data.bpm
    if (data.volume !== undefined) updateData.volume = data.volume

    const musica = musicasDb.update(musicaId, updateData)

    return NextResponse.json(musica)
  } catch (error) {
    console.error('Erro ao atualizar música:', error)
    return jsonError('Erro ao atualizar música', 500, String(error))
  }
}

// DELETE /api/musicas/[id] - Deletar música
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const musicaId = parseId(id)
    if (musicaId === null) {
      return jsonError('ID inválido', 400)
    }
    musicasDb.delete(musicaId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao deletar música:', error)
    return jsonError('Erro ao deletar música', 500)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { musicasDb } from '@/lib/musicas-db'
import { jsonError, parseId } from '@/lib/api-helpers'
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

    const updateData: UpdateMusicaInput = {}
    if (body.titulo !== undefined) updateData.titulo = body.titulo
    if (body.artista !== undefined) updateData.artista = body.artista
    if (body.tom_original !== undefined) updateData.tom_original = body.tom_original
    if (body.cifra !== undefined) updateData.cifra = body.cifra
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.observacao !== undefined) updateData.observacao = body.observacao
    if (body.groove !== undefined) updateData.groove = body.groove
    if (body.drum_pattern_id !== undefined) updateData.drum_pattern_id = body.drum_pattern_id
    if (body.bpm !== undefined) updateData.bpm = body.bpm
    if (body.volume !== undefined) updateData.volume = body.volume

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

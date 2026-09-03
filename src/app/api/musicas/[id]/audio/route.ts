import { NextRequest, NextResponse } from 'next/server'
import { musicasDb } from '@/lib/musicas-db'
import { jsonError, parseId, saveAudioUpload, deleteAudioFile } from '@/lib/api-helpers'
import { isAudioSizeExceeded } from '@/lib/validation'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/musicas/[id]/audio - Upload audio file
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const musicaId = parseId(id)
    if (musicaId === null) {
      return jsonError('ID inválido', 400)
    }

    // Rejeita cedo payloads grandes (content-length) antes de parsear o FormData
    const contentLength = Number(request.headers.get('content-length'))
    if (isAudioSizeExceeded(contentLength)) {
      return jsonError('Arquivo de áudio excede o limite de 15MB', 413)
    }

    // Verify musica exists
    const musica = musicasDb.getById(musicaId)
    if (!musica) {
      return jsonError('Música não encontrada', 404)
    }

    const result = await saveAudioUpload(request, 'musicas-audio', 'musica', musicaId)
    if (!result.ok) {
      return result.error
    }

    // Delete old audio file only after the new one was saved
    await deleteAudioFile(musica.audio_url)

    // Update database with audio_url
    musicasDb.update(musicaId, { audio_url: result.audioUrl })

    const updatedMusica = musicasDb.getById(musicaId)
    return NextResponse.json(updatedMusica)
  } catch (error) {
    console.error('Erro ao fazer upload de áudio:', error)
    return jsonError('Erro ao fazer upload de áudio', 500)
  }
}

// DELETE /api/musicas/[id]/audio - Delete audio file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    if (musica.audio_url) {
      await deleteAudioFile(musica.audio_url)

      // Clear from database
      musicasDb.update(musicaId, { audio_url: null })
    }

    const updatedMusica = musicasDb.getById(musicaId)
    return NextResponse.json(updatedMusica)
  } catch (error) {
    console.error('Erro ao deletar áudio:', error)
    return jsonError('Erro ao deletar áudio', 500)
  }
}

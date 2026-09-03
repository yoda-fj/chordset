import { NextRequest, NextResponse } from 'next/server'
import { eventosDb } from '@/lib/eventos-db'
import { jsonError, parseId, saveAudioUpload, deleteAudioFile } from '@/lib/api-helpers'
import { isAudioSizeExceeded } from '@/lib/validation'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/eventos/[id]/audio - Upload audio file
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const eventoId = parseId(id)
    if (eventoId === null) {
      return jsonError('ID inválido', 400)
    }

    // Rejeita cedo payloads grandes (content-length) antes de parsear o FormData
    const contentLength = Number(request.headers.get('content-length'))
    if (isAudioSizeExceeded(contentLength)) {
      return jsonError('Arquivo de áudio excede o limite de 15MB', 413)
    }

    // Verify evento exists
    const evento = eventosDb.getById(eventoId)
    if (!evento) {
      return jsonError('Evento não encontrado', 404)
    }

    const result = await saveAudioUpload(request, 'eventos-audio', 'evento', eventoId)
    if (!result.ok) {
      return result.error
    }

    // Delete old audio file only after the new one was saved
    await deleteAudioFile(evento.audio_url)

    // Update database with audio_url
    eventosDb.update(eventoId, { audio_url: result.audioUrl })

    const updatedEvento = eventosDb.getById(eventoId)
    return NextResponse.json(updatedEvento)
  } catch (error) {
    console.error('Erro ao fazer upload de áudio:', error)
    return jsonError('Erro ao fazer upload de áudio', 500)
  }
}

// DELETE /api/eventos/[id]/audio - Delete audio file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const eventoId = parseId(id)
    if (eventoId === null) {
      return jsonError('ID inválido', 400)
    }

    const evento = eventosDb.getById(eventoId)
    if (!evento) {
      return jsonError('Evento não encontrado', 404)
    }

    if (evento.audio_url) {
      await deleteAudioFile(evento.audio_url)

      // Clear from database
      eventosDb.update(eventoId, { audio_url: null })
    }

    const updatedEvento = eventosDb.getById(eventoId)
    return NextResponse.json(updatedEvento)
  } catch (error) {
    console.error('Erro ao deletar áudio:', error)
    return jsonError('Erro ao deletar áudio', 500)
  }
}

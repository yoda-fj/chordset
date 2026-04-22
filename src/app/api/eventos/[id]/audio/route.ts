import { NextRequest, NextResponse } from 'next/server'
import { eventosDb } from '@/lib/eventos-db'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join, extname } from 'path'
import { existsSync } from 'fs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/eventos/[id]/audio - Upload audio file
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const eventoId = parseInt(id)

    // Verify evento exists
    const evento = eventosDb.getById(eventoId)
    if (!evento) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Delete old audio file if exists
    if (evento.audio_url) {
      const oldPath = join(process.cwd(), 'public', evento.audio_url)
      try {
        if (existsSync(oldPath)) {
          await unlink(oldPath)
        }
      } catch (e) {
        // Ignore errors deleting old file
      }
    }

    const formData = await request.formData()
    const file = formData.get('audio') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo de áudio fornecido' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3', 'audio/x-m4a']
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|webm|m4a)$/i)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use MP3, WAV, OGG, WebM ou M4A' },
        { status: 400 }
      )
    }

    // Create uploads directory if needed
    const uploadDir = join(process.cwd(), 'public', 'eventos-audio')
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const ext = extname(file.name) || '.webm'
    const filename = `evento-${eventoId}-${timestamp}${ext}`
    const filepath = join(uploadDir, filename)

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    // Update database with audio_url
    const audioUrl = `/eventos-audio/${filename}`
    eventosDb.update(eventoId, { audio_url: audioUrl })

    const updatedEvento = eventosDb.getById(eventoId)
    return NextResponse.json(updatedEvento)
  } catch (error) {
    console.error('Erro ao fazer upload de áudio:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload de áudio' },
      { status: 500 }
    )
  }
}

// DELETE /api/eventos/[id]/audio - Delete audio file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const eventoId = parseInt(id)

    const evento = eventosDb.getById(eventoId)
    if (!evento) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      )
    }

    // Delete file if exists
    if (evento.audio_url) {
      const filepath = join(process.cwd(), 'public', evento.audio_url)
      try {
        if (existsSync(filepath)) {
          await unlink(filepath)
        }
      } catch (e) {
        // Ignore errors
      }

      // Clear from database
      eventosDb.update(eventoId, { audio_url: null })
    }

    const updatedEvento = eventosDb.getById(eventoId)
    return NextResponse.json(updatedEvento)
  } catch (error) {
    console.error('Erro ao deletar áudio:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar áudio' },
      { status: 500 }
    )
  }
}

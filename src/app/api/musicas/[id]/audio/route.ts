import { NextRequest, NextResponse } from 'next/server'
import { musicasDb } from '@/lib/musicas-db'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join, extname } from 'path'
import { existsSync } from 'fs'

interface RouteParams {
  params: Promise<{ id: string }>
}

// POST /api/musicas/[id]/audio - Upload audio file
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const musicaId = parseInt(id)

    // Verify musica exists
    const musica = musicasDb.getById(musicaId)
    if (!musica) {
      return NextResponse.json(
        { error: 'Música não encontrada' },
        { status: 404 }
      )
    }

    // Delete old audio file if exists
    if (musica.audio_url) {
      const oldPath = join(process.cwd(), 'public', musica.audio_url)
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
    const uploadDir = join(process.cwd(), 'public', 'musicas-audio')
    await mkdir(uploadDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const ext = extname(file.name) || '.webm'
    const filename = `musica-${musicaId}-${timestamp}${ext}`
    const filepath = join(uploadDir, filename)

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    // Update database with audio_url
    const audioUrl = `/musicas-audio/${filename}`
    musicasDb.update(musicaId, { audio_url: audioUrl })

    const updatedMusica = musicasDb.getById(musicaId)
    return NextResponse.json(updatedMusica)
  } catch (error) {
    console.error('Erro ao fazer upload de áudio:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload de áudio' },
      { status: 500 }
    )
  }
}

// DELETE /api/musicas/[id]/audio - Delete audio file
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const musicaId = parseInt(id)

    const musica = musicasDb.getById(musicaId)
    if (!musica) {
      return NextResponse.json(
        { error: 'Música não encontrada' },
        { status: 404 }
      )
    }

    // Delete file if exists
    if (musica.audio_url) {
      const filepath = join(process.cwd(), 'public', musica.audio_url)
      try {
        if (existsSync(filepath)) {
          await unlink(filepath)
        }
      } catch (e) {
        // Ignore errors
      }

      // Clear from database
      musicasDb.update(musicaId, { audio_url: null })
    }

    const updatedMusica = musicasDb.getById(musicaId)
    return NextResponse.json(updatedMusica)
  } catch (error) {
    console.error('Erro ao deletar áudio:', error)
    return NextResponse.json(
      { error: 'Erro ao deletar áudio' },
      { status: 500 }
    )
  }
}
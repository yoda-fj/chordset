import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join, resolve, extname } from 'path'
import { existsSync, createReadStream, statSync } from 'fs'

/**
 * Resposta de erro padronizada da API: { error: message }
 */
export function jsonError(message: string, status: number, details?: unknown): NextResponse {
  const body = details !== undefined ? { error: message, details } : { error: message }
  return NextResponse.json(body, { status })
}

/**
 * Extrai e valida um path param numérico (:id). Retorna null se inválido.
 */
export function parseId(raw: string): number | null {
  const id = parseInt(raw, 10)
  return Number.isNaN(id) ? null : id
}

// =====================================
// ÁUDIO (upload / delete / serving)
// =====================================

export type AudioDir = 'musicas-audio' | 'eventos-audio'

const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp3', 'audio/x-m4a']

const AUDIO_CONTENT_TYPES: Record<string, string> = {
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
  '.webm': 'audio/webm',
}

export type AudioUploadResult =
  | { ok: true; audioUrl: string }
  | { ok: false; error: NextResponse }

/**
 * Valida e salva o arquivo 'audio' do formData em public/<dir>.
 * Retorna a audioUrl pública ou um erro pronto pra resposta.
 */
export async function saveAudioUpload(
  request: NextRequest,
  dir: AudioDir,
  prefix: string,
  entityId: number
): Promise<AudioUploadResult> {
  const formData = await request.formData()
  const file = formData.get('audio') as File | null

  if (!file) {
    return { ok: false, error: jsonError('Nenhum arquivo de áudio fornecido', 400) }
  }

  if (!ALLOWED_AUDIO_TYPES.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|webm|m4a)$/i)) {
    return { ok: false, error: jsonError('Tipo de arquivo não permitido. Use MP3, WAV, OGG, WebM ou M4A', 400) }
  }

  const uploadDir = join(process.cwd(), 'public', dir)
  await mkdir(uploadDir, { recursive: true })

  const ext = extname(file.name) || '.webm'
  const filename = `${prefix}-${entityId}-${Date.now()}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(join(uploadDir, filename), buffer)

  return { ok: true, audioUrl: `/${dir}/${filename}` }
}

/**
 * Deleta o arquivo de áudio referenciado por uma audio_url pública. Ignora erros.
 */
export async function deleteAudioFile(audioUrl: string | null): Promise<void> {
  if (!audioUrl) return
  const filepath = join(process.cwd(), 'public', audioUrl)
  try {
    if (existsSync(filepath)) {
      await unlink(filepath)
    }
  } catch {
    // Ignora erros ao deletar arquivo antigo
  }
}

/**
 * Serve um arquivo de áudio de public/<dir> com proteção contra path traversal.
 */
export function serveAudioFile(dir: AudioDir, filename: string): NextResponse {
  const decoded = decodeURIComponent(filename)
  if (decoded.includes('..') || decoded.includes('/') || decoded.includes('\\')) {
    return jsonError('Invalid filename', 400)
  }

  const audioDir = join(process.cwd(), 'public', dir)
  const resolvedPath = resolve(join(audioDir, decoded))
  if (!resolvedPath.startsWith(resolve(audioDir))) {
    return jsonError('Invalid path', 400)
  }

  if (!existsSync(resolvedPath)) {
    return jsonError('File not found', 404)
  }

  const ext = extname(decoded).toLowerCase()
  const stream = createReadStream(resolvedPath)

  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      'Content-Type': AUDIO_CONTENT_TYPES[ext] || 'application/octet-stream',
      'Content-Length': String(statSync(resolvedPath).size),
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}

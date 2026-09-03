import { z } from 'zod'

// =====================================
// LIMITES
// =====================================

/** ~14MB em base64 ≈ 10MB binário (10 * 1024 * 1024 * 4/3 ≈ 13.98M chars) */
export const OCR_MAX_BASE64_CHARS = 14 * 1024 * 1024

/** Tamanho máximo de upload de áudio: 15MB */
export const MAX_AUDIO_SIZE_BYTES = 15 * 1024 * 1024

/** Cifra máxima: 200KB */
export const MAX_CIFRA_CHARS = 200 * 1024

export const MAX_QUERY_CHARS = 200
export const MAX_TITULO_CHARS = 200
export const MAX_ARTISTA_CHARS = 200
export const MAX_TOM_CHARS = 20

// =====================================
// HELPERS
// =====================================

function isCifraClubUrl(value: string): boolean {
  try {
    const parsed = new URL(value)
    return (
      (parsed.protocol === 'https:' || parsed.protocol === 'http:') &&
      (parsed.hostname === 'cifraclub.com.br' || parsed.hostname.endsWith('.cifraclub.com.br'))
    )
  } catch {
    return false
  }
}

// =====================================
// OCR (/api/ocr/cifra)
// =====================================

export const ocrRequestSchema = z
  .object({
    imageBase64: z
      .string()
      .max(OCR_MAX_BASE64_CHARS, `Imagem base64 excede o limite de ~10MB`)
      .optional(),
    imageUrl: z
      .url({ protocol: /^https?$/, message: 'imageUrl deve ser http/https' })
      .optional(),
    provider: z.string().min(1, 'Provider é obrigatório'),
  })
  .refine((data) => data.imageBase64 || data.imageUrl, {
    message: 'Imagem é obrigatória (envie imageBase64 ou imageUrl)',
    path: ['imageBase64'],
  })

export type OcrRequest = z.infer<typeof ocrRequestSchema>

// =====================================
// IMPORT-SONG (/api/import-song)
// =====================================

export const importSongSchema = z
  .object({
    query: z
      .string()
      .min(2, 'Query deve ter pelo menos 2 caracteres')
      .max(MAX_QUERY_CHARS, `Query deve ter no máximo ${MAX_QUERY_CHARS} caracteres`)
      .refine((v) => v.trim().length >= 2, 'Query deve ter pelo menos 2 caracteres não-brancos')
      .optional(),
    url: z
      .string()
      .refine(isCifraClubUrl, 'URL deve ser do domínio cifraclub.com.br')
      .optional(),
    save: z.boolean().optional(),
  })
  .refine((data) => (data.query ? !data.url : !!data.url), {
    message: 'Envie { query } para buscar OU { url } para importar (não ambos, não nenhum)',
  })

export type ImportSongRequest = z.infer<typeof importSongSchema>

// =====================================
// MUSICAS (/api/musicas, /api/musicas/[id])
// =====================================

const musicaFields = {
  titulo: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(MAX_TITULO_CHARS, `Título deve ter no máximo ${MAX_TITULO_CHARS} caracteres`),
  artista: z
    .string()
    .max(MAX_ARTISTA_CHARS, `Artista deve ter no máximo ${MAX_ARTISTA_CHARS} caracteres`)
    .optional(),
  tom_original: z
    .string()
    .max(MAX_TOM_CHARS, `Tom deve ter no máximo ${MAX_TOM_CHARS} caracteres`)
    .nullish(),
  cifra: z
    .string()
    .max(MAX_CIFRA_CHARS, `Cifra deve ter no máximo 200KB`)
    .nullish(),
  tags: z.array(z.string().max(50)).max(50).optional(),
}

export const musicaCreateSchema = z.object(musicaFields)

export const musicaUpdateSchema = z
  .object({
    ...musicaFields,
    titulo: musicaFields.titulo.optional(),
    observacao: z.string().max(10 * 1024).nullish(),
    groove: z.string().max(10 * 1024).nullish(),
    drum_pattern_id: z.number().int().positive().nullish(),
    bpm: z.number().int().min(20).max(400).optional(),
    volume: z.number().min(0).max(1).optional(),
  })

export type MusicaCreateInput = z.infer<typeof musicaCreateSchema>
export type MusicaUpdateInput = z.infer<typeof musicaUpdateSchema>

// =====================================
// ÁUDIO (upload via FormData)
// =====================================

/**
 * Retorna true se o tamanho (content-length ou file.size) excede o limite de 15MB.
 */
export function isAudioSizeExceeded(sizeBytes: number | null | undefined): boolean {
  if (sizeBytes === null || sizeBytes === undefined || Number.isNaN(sizeBytes)) return false
  return sizeBytes > MAX_AUDIO_SIZE_BYTES
}

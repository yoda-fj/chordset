import { describe, it, expect } from 'vitest'
import {
  ocrRequestSchema,
  importSongSchema,
  musicaCreateSchema,
  musicaUpdateSchema,
  isAudioSizeExceeded,
  OCR_MAX_BASE64_CHARS,
  MAX_AUDIO_SIZE_BYTES,
} from './validation'

describe('ocrRequestSchema', () => {
  it('aceita imageBase64 com provider', () => {
    const r = ocrRequestSchema.safeParse({ imageBase64: 'aGVsbG8=', provider: 'openai' })
    expect(r.success).toBe(true)
  })

  it('aceita imageUrl http/https com provider', () => {
    const r = ocrRequestSchema.safeParse({ imageUrl: 'https://exemplo.com/foto.jpg', provider: 'gemini' })
    expect(r.success).toBe(true)
  })

  it('rejeita sem imagem', () => {
    const r = ocrRequestSchema.safeParse({ provider: 'openai' })
    expect(r.success).toBe(false)
  })

  it('rejeita imageUrl não-http (javascript:)', () => {
    const r = ocrRequestSchema.safeParse({ imageUrl: 'javascript:alert(1)', provider: 'openai' })
    expect(r.success).toBe(false)
  })

  it('rejeita base64 acima do limite', () => {
    const r = ocrRequestSchema.safeParse({
      imageBase64: 'x'.repeat(OCR_MAX_BASE64_CHARS + 1),
      provider: 'openai',
    })
    expect(r.success).toBe(false)
  })
})

describe('importSongSchema', () => {
  it('aceita query de busca', () => {
    expect(importSongSchema.safeParse({ query: 'tempo perdido' }).success).toBe(true)
  })

  it('aceita url do cifraclub', () => {
    expect(
      importSongSchema.safeParse({ url: 'https://www.cifraclub.com.br/legiao-urbana/sera' }).success
    ).toBe(true)
  })

  it('rejeita url de outro domínio', () => {
    expect(importSongSchema.safeParse({ url: 'https://evil.com/legiao-urbana/sera' }).success).toBe(false)
  })

  it('rejeita query e url juntos', () => {
    expect(
      importSongSchema.safeParse({ query: 'sera', url: 'https://www.cifraclub.com.br/a/b' }).success
    ).toBe(false)
  })

  it('rejeita sem query e sem url', () => {
    expect(importSongSchema.safeParse({}).success).toBe(false)
  })

  it('rejeita query acima de 200 chars', () => {
    expect(importSongSchema.safeParse({ query: 'x'.repeat(201) }).success).toBe(false)
  })
})

describe('musicaCreateSchema / musicaUpdateSchema', () => {
  it('exige título na criação', () => {
    expect(musicaCreateSchema.safeParse({}).success).toBe(false)
    expect(musicaCreateSchema.safeParse({ titulo: 'Sérá' }).success).toBe(true)
  })

  it('aceita tom_original e cifra nulos no update', () => {
    expect(musicaUpdateSchema.safeParse({ tom_original: null, cifra: null }).success).toBe(true)
  })

  it('rejeita bpm fora da faixa 20-400', () => {
    expect(musicaUpdateSchema.safeParse({ bpm: 500 }).success).toBe(false)
    expect(musicaUpdateSchema.safeParse({ bpm: 120 }).success).toBe(true)
  })

  it('rejeita volume fora de 0-1', () => {
    expect(musicaUpdateSchema.safeParse({ volume: 1.5 }).success).toBe(false)
  })
})

describe('isAudioSizeExceeded', () => {
  it('null/undefined/NaN não excedem', () => {
    expect(isAudioSizeExceeded(null)).toBe(false)
    expect(isAudioSizeExceeded(undefined)).toBe(false)
    expect(isAudioSizeExceeded(NaN)).toBe(false)
  })

  it('abaixo e acima do limite de 15MB', () => {
    expect(isAudioSizeExceeded(MAX_AUDIO_SIZE_BYTES)).toBe(false)
    expect(isAudioSizeExceeded(MAX_AUDIO_SIZE_BYTES + 1)).toBe(true)
  })
})

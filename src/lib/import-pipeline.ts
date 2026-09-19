// =====================================
// PIPELINE DE IMPORTAÇÃO DE MÚSICAS
// =====================================
//
// Caminho único entre "scraper retornou linhas cruas" e "música pronta/
// gravada": normalização de cifra (ChordPro), detecção de tom e
// dedup/save. As rotas /api/import-song e /api/import-musicasparamissa
// são adaptadores finos sobre este módulo.

import { ensureChordProFormat } from '@/utils/chordpro-converter'
import { cleanChordText, extractKeyFromChord } from '@/utils/chord-transposer'
import { detectKeyFromCifra } from '@/utils/key-detector'
import { musicasDb } from '@/lib/musicas-db'

export interface ImportedSongInput {
  titulo: string
  artista: string
  url: string
  provider: string
  /** Linhas cruas da cifra, como vieram do scraper */
  cifraLines: string[]
  /** Tom vindo de metadado da página, quando existe (Cifra Club) */
  scrapedKey?: string
}

export interface NormalizedSong {
  titulo: string
  artista: string
  tom_original: string | null
  cifra: string
  url: string
  provider: string
}

/**
 * Normaliza o resultado de um scrape: junta as linhas, resolve o tom
 * (metadado da página → "Tom:" no texto → detecção pelos acordes) e
 * converte a cifra para ChordPro limpo.
 */
export function normalizeImportedSong(input: ImportedSongInput): NormalizedSong {
  const rawCifra = input.cifraLines.join('\n')
  const tomOriginal = input.scrapedKey || extractKeyFromChord(rawCifra) || detectKeyFromCifra(rawCifra)
  const cifraLimpa = cleanChordText(ensureChordProFormat(rawCifra))

  return {
    titulo: input.titulo,
    artista: input.artista,
    tom_original: tomOriginal,
    cifra: cifraLimpa,
    url: input.url,
    provider: input.provider,
  }
}

export type SaveImportedResult =
  | { status: 'saved'; songId: number }
  | { status: 'exists'; existingId: number }

/**
 * Grava a música importada, com dedup por (titulo, artista).
 * A tag do provider marca a origem.
 */
export function saveImportedSong(song: NormalizedSong): SaveImportedResult {
  const existing = musicasDb.findByTituloArtista(song.titulo, song.artista)
  if (existing) {
    return { status: 'exists', existingId: existing.id }
  }

  const saved = musicasDb.create({
    titulo: song.titulo,
    artista: song.artista,
    tom_original: song.tom_original || undefined,
    cifra: song.cifra || undefined,
    tags: [song.provider],
  })

  return { status: 'saved', songId: saved.id }
}

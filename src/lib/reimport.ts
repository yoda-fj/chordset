// =====================================
// RE-IMPORTAÇÃO DE CIFRA DE MÚSICA EXISTENTE
// =====================================
//
// Lógica pura da rota /api/musicas/reimportar: resolver a URL alvo
// (salva na música ou via busca no Cifra Club), montar o UPDATE sem
// tocar em campos que não devem ser sobrescritos. A rota é um
// adaptador fino sobre estes helpers (scrape + persistência ficam nela).

import type { Musica } from '@/types/database'
import type { SearchDoc } from './cifraclub-scraper/types'

export const CIFRACLUB_BASE_URL = 'https://www.cifraclub.com.br/'

export interface ReimportCandidate {
  titulo: string
  artista: string
  url: string
}

// Extrai artist/song/version de uma URL do Cifra Club
// (mesmo formato do parser de /api/import-song)
export function parseCifraClubUrl(url: string): { artist: string; song: string; version?: string } | null {
  const parts = url
    .replace(CIFRACLUB_BASE_URL, '')
    .split('/')
    .filter(Boolean)

  if (parts.length < 2) return null
  return { artist: parts[0], song: parts[1], version: parts[2] || undefined }
}

export type ResolveReimportTargetResult =
  | { kind: 'url'; url: string }
  | { kind: 'needChoice'; candidates: ReimportCandidate[] }
  | { kind: 'notFound' }

/**
 * Resolve a URL alvo da re-importação.
 * URL salva na música (cifra_url) tem prioridade; sem ela, decide pelos
 * resultados da busca: 1 → direto; 0 → notFound; mais de 1 → o usuário
 * escolhe (needChoice, sem scraping ainda).
 */
export function resolveReimportTarget(
  savedUrl: string | null | undefined,
  songs: Pick<SearchDoc, 'artist' | 'artist_slug' | 'song' | 'song_slug'>[]
): ResolveReimportTargetResult {
  if (savedUrl) return { kind: 'url', url: savedUrl }

  const candidates: ReimportCandidate[] = songs.map((s) => ({
    titulo: s.song,
    artista: s.artist,
    url: `${CIFRACLUB_BASE_URL}${s.artist_slug}/${s.song_slug}`,
  }))

  if (candidates.length === 0) return { kind: 'notFound' }
  if (candidates.length === 1) return { kind: 'url', url: candidates[0].url }
  return { kind: 'needChoice', candidates }
}

export interface ReimportUpdate {
  cifra: string
  cifra_url: string
  tom_original?: string
}

/**
 * Monta o update da re-importação: sempre substitui a cifra e grava a
 * URL usada; tom_original só é preenchido quando ainda era null (nunca
 * sobrescreve tom já definido, nem tom_atual do usuário).
 */
export function buildReimportUpdate(
  musica: Pick<Musica, 'tom_original'>,
  song: { cifra: string; tom_original: string | null },
  url: string
): ReimportUpdate {
  const update: ReimportUpdate = { cifra: song.cifra, cifra_url: url }
  if (musica.tom_original === null && song.tom_original) {
    update.tom_original = song.tom_original
  }
  return update
}

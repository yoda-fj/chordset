import { parseTags } from './tag-utils'

export interface Musica {
  id: number
  titulo: string
  artista: string
  tom_original: string | null
  cifra: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export type SetlistType = 'evento' | 'template'

export interface SetlistItem {
  id: number | string
  musica_id: number
  ordem: number
  tom_evento?: string | null
  tom_sugerido?: string | null
  observacoes?: string | null
  confirmada?: boolean
  responsavel?: string | null
  musicas?: Musica
  created_at?: string
}

export interface SetlistApiResponse {
  id: number
  musica_id: number
  ordem: number
  tom_evento?: string | null
  tom_sugerido?: string | null
  observacoes?: string | null
  confirmada?: boolean
  responsavel?: string | null
  musicas?: Musica
  created_at: string
}

/**
 * Get the API base path for a setlist type
 */
export function getSetlistApiBase(type: SetlistType, id: number): string {
  return type === 'evento' ? `/api/eventos/${id}` : `/api/templates/${id}`
}

/**
 * Add a music to a setlist
 */
export async function addMusicaToSetlist(
  type: SetlistType,
  setlistId: number,
  musicaId: number,
  ordem: number
): Promise<SetlistApiResponse> {
  const base = getSetlistApiBase(type, setlistId)
  const response = await fetch(`${base}/musicas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ musica_id: musicaId, ordem }),
  })

  if (!response.ok) {
    throw new Error(`Erro ao adicionar música: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Remove a music from a setlist
 */
export async function removeMusicaFromSetlist(
  type: SetlistType,
  setlistId: number,
  musicaId: number | string
): Promise<void> {
  const base = getSetlistApiBase(type, setlistId)
  const endpoint = type === 'evento'
    ? `${base}/musicas/${musicaId}`
    : `${base}/musicas?musica_id=${musicaId}`

  const response = await fetch(endpoint, { method: 'DELETE' })

  if (!response.ok) {
    throw new Error(`Erro ao remover música: ${response.statusText}`)
  }
}

/**
 * Reorder musicas in a setlist
 */
export async function reorderSetlistMusicas(
  type: SetlistType,
  setlistId: number,
  orderedIds: (number | string)[]
): Promise<void> {
  const base = getSetlistApiBase(type, setlistId)
  const response = await fetch(`${base}/musicas/reorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderedIds }),
  })

  if (!response.ok) {
    throw new Error(`Erro ao reordenar: ${response.statusText}`)
  }
}

/**
 * Update a musica in a setlist (tom, observacoes, etc.)
 */
export async function updateSetlistMusica(
  type: SetlistType,
  setlistId: number,
  musicaId: number | string,
  updates: {
    tom?: string | null
    observacoes?: string | null
    confirmada?: boolean
    responsavel?: string | null
  }
): Promise<void> {
  const base = getSetlistApiBase(type, setlistId)
  const body = type === 'evento'
    ? {
        tom_evento: updates.tom,
        observacoes: updates.observacoes,
        confirmada: updates.confirmada,
        responsavel: updates.responsavel,
      }
    : {
        tom_sugerido: updates.tom,
        observacoes: updates.observacoes,
      }

  const response = await fetch(`${base}/musicas/${musicaId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`Erro ao atualizar música: ${response.statusText}`)
  }
}

/**
 * Normalize musica data from API, parsing tags
 */
export function normalizeMusicaData(m: any): any {
  return {
    ...m,
    tags: parseTags(m.tags),
  }
}

/**
 * Normalize setlist items from API
 */
export function normalizeSetlistItems(items: any[]): any[] {
  return items.map(item => ({
    ...item,
    musicas: item.musicas ? normalizeMusicaData(item.musicas) : undefined,
  }))
}
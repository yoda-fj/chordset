'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Musica } from '@/types/database'

// Subconjunto de Musica necessário para as configurações do DrumPad.
// MusicaJoin (JOINs de setlist/practice) também satisfaz este shape.
export type DrumPadMusica = Pick<Musica, 'id' | 'groove' | 'drum_pattern_id' | 'bpm' | 'volume'>

interface DrumPadValues {
  groove: string
  bpm: number
  volume: number
}

type SaveKind = 'groove' | 'bpm' | 'volume'
interface PendingSave {
  musicaId: number
  body: Record<string, string | number | null>
}

/**
 * Estado + persistência das configurações do DrumPad (groove, bpm, volume).
 * Salva na própria música via PUT /api/musicas/[id] com debounce de 1s.
 * Usado por: cifra da música, setlist do evento e página de ensaio.
 *
 * Os valores são derivados da música a cada render; alterações feitas na
 * sessão ficam em `overrides` (por música), para que trocar de música e
 * voltar no setlist não mostre dados velhos do carregamento inicial.
 *
 * Saves pendentes carregam o id da música-alvo e são descarregados (flush)
 * ao desmontar — sair da tela ou trocar de música antes do debounce não
 * perde a alteração nem grava na música errada.
 */
export function useDrumPadSettings(musica: DrumPadMusica | null) {
  const [overrides, setOverrides] = useState<Record<number, DrumPadValues>>({})
  const timersRef = useRef<Partial<Record<SaveKind, NodeJS.Timeout>>>({})
  const pendingRef = useRef<Partial<Record<SaveKind, PendingSave>>>({})

  const musicaId = musica?.id ?? null

  const values: DrumPadValues = (musicaId !== null && overrides[musicaId])
    ? overrides[musicaId]
    : {
        groove: musica?.drum_pattern_id ? `db-${musica.drum_pattern_id}` : musica?.groove || 'rock-8',
        bpm: musica?.bpm || 120,
        volume: musica?.volume ?? 0.7,
      }

  const flushKind = useCallback((kind: SaveKind) => {
    const pending = pendingRef.current[kind]
    if (!pending) return
    pendingRef.current[kind] = undefined
    fetch(`/api/musicas/${pending.musicaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pending.body),
      // keepalive entrega o request mesmo durante o unload da página
      keepalive: true,
    }).catch(e => console.error('Error saving drum pad settings:', e))
  }, [])

  const flushAll = useCallback(() => {
    for (const kind of ['groove', 'bpm', 'volume'] as SaveKind[]) {
      const timer = timersRef.current[kind]
      if (timer) clearTimeout(timer)
      flushKind(kind)
    }
  }, [flushKind])

  const scheduleSave = (kind: SaveKind, body: Record<string, string | number | null>) => {
    if (musicaId === null) return
    pendingRef.current[kind] = { musicaId, body }
    const existing = timersRef.current[kind]
    if (existing) clearTimeout(existing)
    timersRef.current[kind] = setTimeout(() => flushKind(kind), 1000)
  }

  // Grava o que estiver pendente ao desmontar (navegação SPA) e no pagehide
  // (reload/fechar aba — React não desmonta, mas o keepalive entrega o save)
  useEffect(() => {
    window.addEventListener('pagehide', flushAll)
    return () => {
      window.removeEventListener('pagehide', flushAll)
      flushAll()
    }
  }, [flushAll])

  const setOverride = (partial: Partial<DrumPadValues>) => {
    if (musicaId === null) return
    setOverrides(prev => ({
      ...prev,
      [musicaId]: { ...values, ...partial },
    }))
  }

  const onGrooveChange = (grooveId: string, drumPatternId: number | null) => {
    setOverride({ groove: grooveId })
    scheduleSave('groove', { groove: grooveId.startsWith('db-') ? null : grooveId, drum_pattern_id: drumPatternId })
  }

  const onBpmChange = (newBpm: number) => {
    if (newBpm == null) return
    setOverride({ bpm: newBpm })
    scheduleSave('bpm', { bpm: newBpm })
  }

  const onVolumeChange = (newVolume: number) => {
    setOverride({ volume: newVolume })
    scheduleSave('volume', { volume: newVolume })
  }

  return { ...values, onGrooveChange, onBpmChange, onVolumeChange }
}

'use client'

import { useState, useRef } from 'react'
import type { Musica } from '@/types/database'

// Subconjunto de Musica necessário para as configurações do DrumPad.
// MusicaJoin (JOINs de setlist/practice) também satisfaz este shape.
export type DrumPadMusica = Pick<Musica, 'id' | 'groove' | 'drum_pattern_id' | 'bpm' | 'volume'>

interface DrumPadValues {
  groove: string
  bpm: number
  volume: number
}

/**
 * Estado + persistência das configurações do DrumPad (groove, bpm, volume).
 * Salva na própria música via PUT /api/musicas/[id] com debounce de 1s.
 * Usado por: cifra da música, setlist do evento e página de ensaio.
 *
 * Os valores são derivados da música a cada render; alterações feitas na
 * sessão ficam em `overrides` (por música), para que trocar de música e
 * voltar no setlist não mostre dados velhos do carregamento inicial.
 */
export function useDrumPadSettings(musica: DrumPadMusica | null) {
  const [overrides, setOverrides] = useState<Record<number, DrumPadValues>>({})
  const grooveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const bpmTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const volumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const musicaId = musica?.id ?? null

  const values: DrumPadValues = (musicaId !== null && overrides[musicaId])
    ? overrides[musicaId]
    : {
        groove: musica?.drum_pattern_id ? `db-${musica.drum_pattern_id}` : musica?.groove || 'rock-8',
        bpm: musica?.bpm || 120,
        volume: musica?.volume ?? 0.7,
      }

  const save = (body: Record<string, string | number | null>) => {
    if (musicaId === null) return
    fetch(`/api/musicas/${musicaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    }).catch(e => console.error('Error saving drum pad settings:', e))
  }

  const setOverride = (partial: Partial<DrumPadValues>) => {
    if (musicaId === null) return
    setOverrides(prev => ({
      ...prev,
      [musicaId]: { ...values, ...partial },
    }))
  }

  const onGrooveChange = (grooveId: string, drumPatternId: number | null) => {
    setOverride({ groove: grooveId })
    if (grooveTimeoutRef.current) clearTimeout(grooveTimeoutRef.current)
    grooveTimeoutRef.current = setTimeout(() => {
      save({ groove: grooveId.startsWith('db-') ? null : grooveId, drum_pattern_id: drumPatternId })
    }, 1000)
  }

  const onBpmChange = (newBpm: number) => {
    if (newBpm == null) return
    setOverride({ bpm: newBpm })
    if (bpmTimeoutRef.current) clearTimeout(bpmTimeoutRef.current)
    bpmTimeoutRef.current = setTimeout(() => save({ bpm: newBpm }), 1000)
  }

  const onVolumeChange = (newVolume: number) => {
    setOverride({ volume: newVolume })
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current)
    volumeTimeoutRef.current = setTimeout(() => save({ volume: newVolume }), 1000)
  }

  return { ...values, onGrooveChange, onBpmChange, onVolumeChange }
}

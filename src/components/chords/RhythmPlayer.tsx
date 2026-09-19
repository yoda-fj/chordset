'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import * as Tone from 'tone'
import { Play, Pause, Loader2 } from 'lucide-react'
import { getSamplerUrls, volumeToDb, stepsToHits } from '@/lib/drum-samples'
import type { DrumHit } from '@/lib/drum-samples'
import { PRESET_GROOVES } from './DrumPad'
import type { DrumPattern } from '@/types/database'

interface RhythmPlayerProps {
  groove: string; // 'rock-8' (preset) ou 'db-<id>' (padrão do banco)
  bpm: number;    // andamento da música — quem define é ela
  volume: number;
  // Modo controlado (usado pelo CifraViewer): o play/stop fica no pai,
  // sincronizando o ritmo com o DrumPad das páginas. Sem as props, gerencia
  // o próprio estado (uso standalone/testes).
  playing?: boolean;
  onPlayingChange?: (playing: boolean) => void;
}

/**
 * Play/stop compacto do ritmo da música, direto na toolbar da cifra —
 * sem abrir o painel do DrumPad. Mesmo motor (sampler → limiter →
 * intervalo de 16ths), tocando SEMPRE no BPM da música.
 */
export function RhythmPlayer({ groove, bpm, volume, playing: playingProp, onPlayingChange }: RhythmPlayerProps) {
  const [internalPlaying, setInternalPlaying] = useState(false)
  const playing = playingProp ?? internalPlaying
  const setPlaying = (v: boolean) => {
    if (playingProp === undefined) setInternalPlaying(v)
    onPlayingChange?.(v)
  }

  const [isLoading, setIsLoading] = useState(false)
  const samplerRef = useRef<Tone.Sampler | null>(null)
  const limiterRef = useRef<Tone.Limiter | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const patternRef = useRef<DrumHit[]>([])
  const stepRef = useRef(0)
  const kitRef = useRef<string | null>(null)
  const customPatternsRef = useRef<DrumPattern[]>([])
  const volumeRef = useRef(volume)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    fetch('/api/drum-patterns')
      .then(r => (r.ok ? r.json() : []))
      .then((list: DrumPattern[]) => { customPatternsRef.current = list })
      .catch(() => {})
    return () => {
      mountedRef.current = false
      if (intervalRef.current) clearInterval(intervalRef.current)
      samplerRef.current?.dispose()
      limiterRef.current?.dispose()
    }
  }, [])

  // Volume ao vivo
  useEffect(() => {
    volumeRef.current = volume
    if (samplerRef.current) {
      samplerRef.current.volume.value = volumeToDb(volume)
    }
  }, [volume])

  const clearIntervalRef = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const startInterval = useCallback((currentBpm: number) => {
    clearIntervalRef()
    const intervalMs = (60 / currentBpm) * 1000 / 4; // 16ths
    intervalRef.current = setInterval(() => {
      const sampler = samplerRef.current
      if (!sampler) return
      patternRef.current.forEach(hit => {
        if (Math.floor(hit.time * 2) % 16 === stepRef.current) {
          sampler.triggerAttackRelease(hit.note, '16n')
        }
      })
      stepRef.current = (stepRef.current + 1) % 16
    }, intervalMs)
  }, [])

  const findPattern = async (id: number): Promise<DrumPattern | undefined> => {
    let pattern = customPatternsRef.current.find(p => p.id === id)
    if (!pattern) {
      // Lista ainda não carregou — busca fresca antes de desistir
      try {
        const list: DrumPattern[] = await (await fetch('/api/drum-patterns')).json()
        customPatternsRef.current = list
        pattern = list.find(p => p.id === id)
      } catch { /* mantém undefined */ }
    }
    return pattern
  }

  const ensureSampler = useCallback(async (kit: string) => {
    if (samplerRef.current && kitRef.current === kit) return
    samplerRef.current?.dispose()
    limiterRef.current?.dispose()
    await new Promise<void>((resolve) => {
      const limiter = new Tone.Limiter(-3).toDestination()
      const sampler = new Tone.Sampler({
        urls: getSamplerUrls(kit),
        onload: () => resolve(),
        onerror: (err) => {
          console.error('[RhythmPlayer] Erro nos samples:', err)
          resolve()
        },
      }).connect(limiter)
      sampler.volume.value = volumeToDb(volumeRef.current)
      samplerRef.current = sampler
      limiterRef.current = limiter
      kitRef.current = kit
    })
  }, [])

  // Play/stop: o start de verdade acontece aqui (controlado ou standalone)
  useEffect(() => {
    if (!playing) {
      clearIntervalRef()
      return
    }
    let cancelled = false
    setIsLoading(true)
    ;(async () => {
      try {
        // Resolve o ritmo: padrão do banco (com kit) ou preset (kit1)
        let hits: DrumHit[]
        let kit = 'kit1'
        if (groove.startsWith('db-')) {
          const pattern = await findPattern(parseInt(groove.replace('db-', '')))
          if (!pattern) {
            console.error(`[RhythmPlayer] Padrão não encontrado: ${groove}`)
            return
          }
          hits = stepsToHits(pattern.steps)
          kit = pattern.kit || 'kit1'
        } else {
          hits = PRESET_GROOVES[groove]?.pattern || PRESET_GROOVES['rock-8'].pattern
        }
        if (hits.length === 0 || cancelled || !mountedRef.current) return

        await Tone.start()
        await ensureSampler(kit)
        if (cancelled || !mountedRef.current || !samplerRef.current) return

        patternRef.current = hits
        stepRef.current = 0
        startInterval(bpm)
      } finally {
        // Sempre libera o botão, inclusive nos early returns de erro
        if (!cancelled && mountedRef.current) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
      if (mountedRef.current) setIsLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start/stop reage só a `playing`; bpm tem efeito próprio
  }, [playing])

  // BPM ao vivo: recria o intervalo no novo tempo quando muda DURANTE o play
  const prevBpmRef = useRef(bpm)
  useEffect(() => {
    if (prevBpmRef.current === bpm) return
    prevBpmRef.current = bpm
    if (!playing || intervalRef.current === null) return
    startInterval(bpm)
  }, [bpm, playing, startInterval])

  return (
    <button
      onClick={() => { if (!isLoading) setPlaying(!playing) }}
      disabled={isLoading}
      className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
        playing
          ? 'bg-success text-zinc-950'
          : 'text-ink-muted hover:bg-surface-overlay hover:text-ink'
      } disabled:opacity-40`}
      aria-label={playing ? 'Parar ritmo da música' : 'Tocar ritmo da música'}
      aria-pressed={playing}
      title={playing ? 'Parar ritmo' : 'Tocar ritmo'}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
      ) : playing ? (
        <Pause className="w-5 h-5" aria-hidden />
      ) : (
        <Play className="w-5 h-5" aria-hidden />
      )}
    </button>
  )
}

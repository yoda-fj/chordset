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
}

/**
 * Play/stop compacto do ritmo da música, direto na toolbar da cifra —
 * sem abrir o painel do DrumPad. Mesmo motor (sampler → limiter →
 * intervalo de 16ths), tocando SEMPRE no BPM da música.
 */
export function RhythmPlayer({ groove, bpm, volume }: RhythmPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
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
      Tone.Transport.stop()
    }
  }, [])

  // Volume ao vivo
  useEffect(() => {
    volumeRef.current = volume
    if (samplerRef.current) {
      samplerRef.current.volume.value = volumeToDb(volume)
    }
  }, [volume])

  const startInterval = useCallback((currentBpm: number) => {
    if (intervalRef.current) clearInterval(intervalRef.current)
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

  // BPM ao vivo (o andamento vem da música): recria o intervalo no novo tempo
  useEffect(() => {
    if (isPlaying) startInterval(bpm)
  }, [bpm, isPlaying, startInterval])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setIsPlaying(false)
  }, [])

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

  const toggle = async () => {
    if (isPlaying) {
      stop()
      return
    }
    // Resolve o ritmo: padrão do banco (com kit) ou preset (kit1)
    let hits: DrumHit[]
    let kit = 'kit1'
    if (groove.startsWith('db-')) {
      const pattern = await findPattern(parseInt(groove.replace('db-', '')))
      if (!pattern) return
      hits = stepsToHits(pattern.steps)
      kit = pattern.kit || 'kit1'
    } else {
      hits = PRESET_GROOVES[groove]?.pattern || PRESET_GROOVES['rock-8'].pattern
    }
    if (hits.length === 0 || !mountedRef.current) return

    setIsLoading(true)
    await Tone.start()
    await ensureSampler(kit)
    if (!mountedRef.current || !samplerRef.current) {
      setIsLoading(false)
      return
    }
    patternRef.current = hits
    stepRef.current = 0
    startInterval(bpm)
    Tone.Transport.start()
    setIsPlaying(true)
    setIsLoading(false)
  }

  return (
    <button
      onClick={toggle}
      disabled={isLoading}
      className={`flex h-12 w-12 items-center justify-center rounded-lg transition-colors ${
        isPlaying
          ? 'bg-success text-zinc-950'
          : 'text-ink-muted hover:bg-surface-overlay hover:text-ink'
      } disabled:opacity-40`}
      aria-label={isPlaying ? 'Parar ritmo da música' : 'Tocar ritmo da música'}
      aria-pressed={isPlaying}
      title={isPlaying ? 'Parar ritmo' : 'Tocar ritmo da música'}
    >
      {isLoading ? (
        <Loader2 className="w-5 h-5 animate-spin" aria-hidden />
      ) : isPlaying ? (
        <Pause className="w-5 h-5" aria-hidden />
      ) : (
        <Play className="w-5 h-5" aria-hidden />
      )}
    </button>
  )
}

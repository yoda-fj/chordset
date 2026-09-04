'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Music, Edit, FileText, Calendar, Play, ChevronLeft, ChevronRight, Drum, Volume2 } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import * as Tone from 'tone'
import { getSamplerUrls, volumeToDb } from '@/lib/drum-samples'
import type { Musica, DrumPattern, EventoStatus } from '@/types/database'
import Link from 'next/link'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { AudioRecorderPanel } from '@/components/audio/AudioRecorderPanel'
import { apiFetch } from '@/utils/api'

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-surface-overlay text-ink',
  confirmado: 'bg-brand/15 text-brand-600',
  realizado: 'bg-success/15 text-success',
  cancelado: 'bg-danger/15 text-danger',
}

// Projeção retornada por GET /api/musicas/[id]/eventos
interface EventoDaMusica {
  id: number
  nome: string
  data: string | null
  hora: string | null
  local: string | null
  status: EventoStatus
  ordem: number
  tom_evento: string | null
  confirmada: boolean
}

export default function MusicaPage() {
  const params = useParams()
  const musicaId = parseInt(params.id as string)

  const [musica, setMusica] = useState<Musica | null>(null)
  const [eventos, setEventos] = useState<EventoDaMusica[]>([])
  const [drumPatterns, setDrumPatterns] = useState<DrumPattern[]>([])
  const [selectedRitmo, setSelectedRitmo] = useState<DrumPattern | null>(null)
  const [ritmoBpm, setRitmoBpm] = useState(120)
  const [ritmoVolume, setRitmoVolume] = useState(0.7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Observacao editing
  const [observacao, setObservacao] = useState('')
  const [savingObs, setSavingObs] = useState(false)
  const obsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const ritmoSeqRef = useRef<Tone.Sequence<number> | null>(null)
  const ritmoSamplerRef = useRef<Tone.Sampler | null>(null)
  const ritmoLimiterRef = useRef<Tone.Limiter | null>(null)
  const ritmoBpmTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const ritmoVolumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const ritmoPendingRef = useRef<{ bpm?: number; volume?: number }>({})

  // Audio recording
  const audioRecorder = useAudioRecorder({
    apiBase: `/api/musicas/${musicaId}/audio`,
    publicPrefix: '/musicas-audio/',
    entityAudioUrl: musica?.audio_url,
    onUpdated: (updated) => setMusica(updated as Musica),
  })

  useEffect(() => {
    async function loadData() {
      try {
        const [musicaRes, eventosRes] = await Promise.all([
          fetch(`/api/musicas/${musicaId}`),
          fetch(`/api/musicas/${musicaId}/eventos`)
        ])

        if (!musicaRes.ok) throw new Error('Música não encontrada')

        const musicaData = await musicaRes.json()
        setMusica(musicaData)
        setObservacao(musicaData.observacao || '')
        setRitmoBpm(musicaData.bpm || 120)
        setRitmoVolume(musicaData.volume ?? 0.7)

        if (eventosRes.ok) {
          const eventosData = await eventosRes.json()
          setEventos(eventosData)
        }

        // Load drum patterns
        const ritmosRes = await fetch('/api/drum-patterns')
        if (ritmosRes.ok) {
          const ritmosData = await ritmosRes.json()
          setDrumPatterns(ritmosData)
          // Set selected ritmo if music has one
          if (musicaData.drum_pattern_id) {
            const found = ritmosData.find((r: DrumPattern) => r.id === musicaData.drum_pattern_id)
            setSelectedRitmo(found || null)
          }
        }
      } catch (err){
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [musicaId])

  // Save observacao on blur or after typing stops
  const saveObservacao = async () => {
    if (!musica) return
    setSavingObs(true)
    try {
      const updated = await apiFetch<Musica>(`/api/musicas/${musicaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacao })
      })
      setMusica(updated)
    } catch (e) {
      console.error('Error saving observacao:', e)
    }
    setSavingObs(false)
  }

  const handleObservacaoChange = (value: string) => {
    setObservacao(value)
    if (obsTimeoutRef.current) clearTimeout(obsTimeoutRef.current)
    obsTimeoutRef.current = setTimeout(saveObservacao, 1500)
  }

  const saveRitmo = async (ritmoId: number | null) => {
    try {
      const found = ritmoId ? drumPatterns.find((r: DrumPattern) => r.id === ritmoId) : null
      const res = await fetch(`/api/musicas/${musicaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(found
          ? { drum_pattern_id: ritmoId, bpm: found.bpm }
          : { drum_pattern_id: null })
      })
      if (res.ok) {
        const updated = await res.json()
        setMusica(updated)
        setSelectedRitmo(found || null)
        // Ritmo novo começa no andamento padrão dele; o usuário ajusta depois
        if (found) setRitmoBpm(found.bpm || 120)
      }
    } catch (e) {
      console.error('Error saving ritmo:', e)
    }
  }

  // Andamento/volume do ritmo — salvos na música com debounce; o que estiver
  // pendente é descarregado (flush) ao sair da página para não perder alterações
  const saveRitmoField = (body: Record<string, number>) => {
    fetch(`/api/musicas/${musicaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      // keepalive entrega o request mesmo durante o unload da página
      keepalive: true,
    }).catch(e => console.error('Error saving ritmo settings:', e))
  }

  const flushRitmoPending = () => {
    const pending = ritmoPendingRef.current
    ritmoPendingRef.current = {}
    if (pending.bpm !== undefined || pending.volume !== undefined) {
      saveRitmoField({ ...pending })
    }
  }

  const handleRitmoBpmChange = (value: number) => {
    if (!value) return
    setRitmoBpm(value)
    ritmoPendingRef.current.bpm = value
    if (ritmoBpmTimeoutRef.current) clearTimeout(ritmoBpmTimeoutRef.current)
    ritmoBpmTimeoutRef.current = setTimeout(flushRitmoPending, 1000)
  }

  const handleRitmoVolumeChange = (value: number) => {
    setRitmoVolume(value)
    ritmoPendingRef.current.volume = value
    if (ritmoVolumeTimeoutRef.current) clearTimeout(ritmoVolumeTimeoutRef.current)
    ritmoVolumeTimeoutRef.current = setTimeout(flushRitmoPending, 1000)
  }

  // Aplica andamento/volume ao vivo durante o playback
  useEffect(() => {
    Tone.Transport.bpm.value = ritmoBpm
  }, [ritmoBpm])

  useEffect(() => {
    if (ritmoSamplerRef.current) {
      ritmoSamplerRef.current.volume.value = volumeToDb(ritmoVolume)
    }
  }, [ritmoVolume])

  // Para o ritmo e grava alterações pendentes ao sair da página (navegação SPA)
  // e no pagehide (reload/fechar aba — o keepalive entrega o save)
  useEffect(() => {
    window.addEventListener('pagehide', flushRitmoPending)
    return () => {
      window.removeEventListener('pagehide', flushRitmoPending)
      ritmoSeqRef.current?.stop()
      ritmoSeqRef.current?.dispose()
      ritmoSamplerRef.current?.dispose()
      ritmoLimiterRef.current?.dispose()
      Tone.Transport.stop()
      if (ritmoBpmTimeoutRef.current) clearTimeout(ritmoBpmTimeoutRef.current)
      if (ritmoVolumeTimeoutRef.current) clearTimeout(ritmoVolumeTimeoutRef.current)
      flushRitmoPending()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flush só no desmontar/pagehide, de propósito
  }, [])

  const playRitmo = async () => {
    if (!selectedRitmo) return
    await Tone.start()

    if (ritmoSeqRef.current) {
      ritmoSeqRef.current.stop()
      ritmoSeqRef.current.dispose()
    }

    const noteMap: Record<string, string> = {
      kick: 'C1', snare: 'D1', hihatClosed: 'F#1', hihatOpen: 'A#1',
      crash: 'C2', ride: 'D2', tomLow: 'E2', tomMid: 'F2', tomHigh: 'G2'
    }

    const urls = getSamplerUrls(selectedRitmo.kit || 'kit1')

    if (ritmoSamplerRef.current) ritmoSamplerRef.current.dispose()
    if (ritmoLimiterRef.current) ritmoLimiterRef.current.dispose()
    const limiter = new Tone.Limiter(-3).toDestination()
    const sampler = new Tone.Sampler({ urls }).connect(limiter)
    sampler.volume.value = volumeToDb(ritmoVolume)
    ritmoSamplerRef.current = sampler
    ritmoLimiterRef.current = limiter

    // Wait for samples to load
    await new Promise<void>((resolve) => setTimeout(resolve, 1500))

    Tone.Transport.bpm.value = ritmoBpm || 120

    const steps = JSON.parse(selectedRitmo.steps)
    const stepArray = new Array(16).fill(0).map((_, i) => i)

    ritmoSeqRef.current = new Tone.Sequence(
      (time: number, stepIdx: number) => {
        const instruments = ['kick', 'snare', 'hihatClosed', 'hihatOpen', 'crash', 'ride', 'tomLow', 'tomMid', 'tomHigh']
        instruments.forEach((inst, instIdx) => {
          if (steps[instIdx]?.[stepIdx]) {
            sampler.triggerAttackRelease(noteMap[inst], '16n', time)
          }
        })
      },
      stepArray,
      '16n'
    )

    ritmoSeqRef.current.start(0)
    Tone.Transport.start()
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (error || !musica) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Música não encontrada'}</p>
        <Link href="/musicas" className="text-brand hover:text-brand-600 font-medium">
          Voltar para Músicas
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/musicas"
          className="inline-flex items-center gap-2 text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
        <Link
          href={`/musicas/${musicaId}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 text-ink-muted hover:text-ink border border-ink/20 rounded-lg transition-colors"
        >
          <Edit size={18} />
          Editar
        </Link>
      </div>

      {/* Info */}
      <div className="bg-surface-raised p-6 rounded-lg border">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-brand/15 rounded-lg">
            <Music size={32} className="text-brand" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-ink">{musica.titulo}</h1>
            <p className="text-lg text-ink-muted mt-1">{musica.artista}</p>
            {musica.tom_original && (
              <p className="text-sm text-ink-muted mt-2">Tom original: {musica.tom_original}</p>
            )}
          </div>
        </div>

        {musica.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {musica.tags.map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-surface-overlay text-ink-muted rounded text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Ritmo (Drum Pattern) */}
      <div className="bg-surface-raised p-6 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <Drum size={20} className="text-brand" />
          <h2 className="text-lg font-semibold text-ink">Ritmo de Bateria</h2>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedRitmo?.id || ''}
            onChange={(e) => {
              const val = e.target.value
              saveRitmo(val ? parseInt(val) : null)
            }}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand"
          >
            <option value="">Nenhum ritmo selecionado</option>
            {drumPatterns.map((p: DrumPattern) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.bpm} BPM)
              </option>
            ))}
          </select>
          {selectedRitmo ? (
            <button
              onClick={playRitmo}
              className="flex items-center gap-2 px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600"
            >
              <Play size={18} />
              Tocar
            </button>
          ) : (
            <span className="text-sm text-ink-faint">Selecione um ritmo</span>
          )}
        </div>
        {selectedRitmo && (
          <div className="flex items-center gap-4 mt-4 flex-wrap">
            <span className="text-sm text-ink-muted">Kit: {selectedRitmo.kit}</span>
            <div className="flex items-center gap-1">
              <span className="text-xs text-ink-muted">BPM</span>
              <input
                type="number"
                value={ritmoBpm}
                onChange={(e) => handleRitmoBpmChange(Number(e.target.value))}
                min={40}
                max={200}
                className="w-16 px-2 py-1 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-ink-muted" />
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={ritmoVolume}
                onChange={(e) => handleRitmoVolumeChange(Number(e.target.value))}
                className="w-24"
              />
            </div>
          </div>
        )}
      </div>

      {/* Observacao + Audio - Collapsible sidebar */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-start print:hidden">
        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 bg-surface-raised border shadow-lg rounded-l-lg hover:bg-surface"
          title={sidebarOpen ? 'Fechar painel' : 'Abrir painel'}
        >
          {sidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Sidebar content */}
        <div className={`transition-all duration-300 overflow-hidden bg-surface-raised border shadow-lg rounded-l-lg ${sidebarOpen ? 'w-80 p-4 opacity-100' : 'w-0 p-0 opacity-0'}`}>
          <div className="space-y-4">
            {/* Observacao */}
            <div>
              <h2 className="text-base font-semibold text-ink mb-3">Observações</h2>
              <div className="relative">
                <textarea
                  value={observacao}
                  onChange={(e) => handleObservacaoChange(e.target.value)}
                  onBlur={saveObservacao}
                  placeholder="Adicione observações..."
                  className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand min-h-[120px] text-sm"
                />
                {savingObs && (
                  <span className="absolute top-2 right-2 text-xs text-ink-faint">Salvando...</span>
                )}
              </div>
            </div>

            {/* Audio Recording/Upload */}
            <div>
              <AudioRecorderPanel {...audioRecorder} />
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/musicas/${musicaId}/cifra`}
          className="bg-surface-raised p-6 rounded-lg border hover:border-brand hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/15 rounded">
              <FileText size={24} className="text-brand" />
            </div>
            <div>
              <h3 className="font-semibold text-ink">Ver Cifra</h3>
              <p className="text-sm text-ink-muted">Cifra com acorde simplificado</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Eventos que usam esta música */}
      {eventos.length > 0 && (
        <div className="bg-surface-raised p-6 rounded-lg border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-brand" />
            <h2 className="text-lg font-semibold text-ink">
              Eventos ({eventos.length})
            </h2>
          </div>
          <div className="space-y-2">
            {eventos.map((evento) => (
              <Link
                key={evento.id}
                href={`/eventos/${evento.id}`}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-surface transition-colors"
              >
                <div>
                  <div className="font-medium text-ink">{evento.nome}</div>
                  <div className="text-sm text-ink-muted">
                    {new Date(evento.data ?? 0).toLocaleDateString('pt-BR')}
                    {evento.hora && ` • ${evento.hora}`}
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${STATUS_COLORS[evento.status]}`}>
                  {STATUS_LABELS[evento.status]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
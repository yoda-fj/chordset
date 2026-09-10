'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ArrowLeft, Printer, Edit3, Music, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { CifraViewer } from '@/components/chords'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useDrumPadSettings } from '@/hooks/useDrumPadSettings'
import { AudioRecorderPanel } from '@/components/audio/AudioRecorderPanel'
import { Skeleton } from '@/components/ui/Skeleton'
import type { Musica } from '@/types/database'

// 2.7: Tone.js (~243kB) só carrega quando o DrumPad monta — fora do bundle inicial
const DrumPad = dynamic(() => import('@/components/chords/DrumPad').then((m) => m.DrumPad), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-xl" />,
})

export default function CifraPage() {
  const router = useRouter()
  const params = useParams()
  const musicaId = parseInt(params.id as string)

  const [musica, setMusica] = useState<Musica | null>(null)
  const [loading, setLoading] = useState(true)

  // Observacao
  const [observacao, setObservacao] = useState('')
  const [savingObs, setSavingObs] = useState(false)
  const obsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Audio recording
  const audioRecorder = useAudioRecorder({
    apiBase: `/api/musicas/${musicaId}/audio`,
    publicPrefix: '/musicas-audio/',
    entityAudioUrl: musica?.audio_url,
    onUpdated: (updated) => setMusica(updated as Musica),
  })

  // Drum pad settings (estado + persistência no hook compartilhado)
  const drumPad = useDrumPadSettings(musica)

  // Listen to fullscreen changes at page level
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  useEffect(() => {
    async function loadMusica() {
      try {
        const response = await fetch(`/api/musicas/${musicaId}`)
        if (!response.ok) throw new Error('Música não encontrada')

        const data = await response.json()
        setMusica(data)
        setObservacao(data.observacao || '')
      } catch (error) {
        console.error('Erro ao carregar música:', error)
      } finally {
        setLoading(false)
      }
    }

    if (musicaId) {
      loadMusica()
    }
  }, [musicaId])

  const handlePrint = () => {
    window.print()
  }

  // Save observacao
  const saveObservacao = async () => {
    if (!musica) return
    setSavingObs(true)
    try {
      const res = await fetch(`/api/musicas/${musicaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacao })
      })
      if (res.ok) {
        const updated = await res.json()
        setMusica(updated)
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-ink-muted">Carregando...</div>
      </div>
    )
  }

  if (!musica) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/musicas"
            className="inline-flex items-center gap-2 min-h-12 text-ink-muted hover:text-ink"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>
        </div>
        <div className="text-center py-12 bg-surface-raised rounded-lg border border-ink/10">
          <p className="text-ink-muted">Música não encontrada.</p>
        </div>
      </div>
    )
  }

  if (!musica.cifra) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 min-h-12 text-ink-muted hover:text-ink"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
        </div>

        <div className="text-center py-12 bg-surface-raised rounded-lg border border-ink/10">
          <Music className="mx-auto h-12 w-12 text-ink-faint mb-4" />
          <p className="text-ink-muted mb-4">Esta música ainda não possui cifra cadastrada.</p>
          <Link
            href={`/musicas/${musicaId}/edit`}
            className="inline-flex items-center min-h-12 text-brand hover:text-brand-600 font-medium"
          >
            Adicionar cifra
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`mx-auto flex flex-col ${isFullscreen ? 'w-full h-screen max-w-none p-0' : 'max-w-6xl h-[calc(100vh-8rem)]'}`}>
      {/* Header - hidden in fullscreen */}
      <div className={`mb-6 print:hidden ${isFullscreen ? 'hidden' : ''}`}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 min-h-12 text-ink-muted hover:text-ink"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <Link
              href={`/musicas/${musicaId}/edit`}
              className="inline-flex items-center gap-2 px-4 min-h-12 text-brand hover:text-brand-600 border border-brand/30 rounded-lg hover:bg-brand/10 transition-colors"
            >
              <Edit3 size={18} />
              Editar
            </Link>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 min-h-12 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 transition-colors"
            >
              <Printer size={18} />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Main content - Cifra */}
        <div className={`transition-all duration-300 flex flex-col h-full ${sidebarOpen ? 'flex-1' : 'w-full'}`}>
          {/* CifraViewer - reusa o mesmo componente */}
          <CifraViewer
            cifra={musica.cifra}
            titulo={musica.titulo}
            artista={musica.artista}
            tomOriginal={musica.tom_original}
            showMetronome={true}
            showControls={true}
            isFullscreen={isFullscreen}
            onFullscreenChange={setIsFullscreen}
            className={isFullscreen ? 'flex-1 min-h-0' : ''}
          />
        </div>

        {/* Sidebar toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 flex h-12 w-12 items-center justify-center bg-surface-raised border border-ink/10 shadow-lg rounded-full hover:bg-surface-overlay print:hidden"
          aria-label={sidebarOpen ? 'Fechar painel lateral' : 'Abrir painel lateral'}
        >
          {sidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Sidebar - Observacao + Audio + Drum Pad */}
        <div className={`transition-all duration-300 print:hidden overflow-y-auto ${sidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'}`}>
          <div className="space-y-4 p-4">
            {/* Observacao */}
            <div className="bg-surface-raised p-4 rounded-lg border border-ink/10">
              <h2 className="text-base font-semibold text-ink mb-3">Observações</h2>
              <div className="relative">
                <textarea
                  value={observacao}
                  onChange={(e) => handleObservacaoChange(e.target.value)}
                  onBlur={saveObservacao}
                  placeholder="Adicione observações..."
                  className="w-full p-3 border border-ink/20 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand min-h-[120px] text-sm bg-surface text-ink placeholder:text-ink-faint"
                />
                {savingObs && (
                  <span className="absolute top-2 right-2 text-xs text-ink-faint">Salvando...</span>
                )}
              </div>
            </div>

            {/* Audio Recording/Upload */}
            <div className="bg-surface-raised p-4 rounded-lg border border-ink/10">
              <AudioRecorderPanel {...audioRecorder} />
            </div>

            {/* Drum Pad / Groove */}
            <DrumPad
              initialGroove={drumPad.groove}
              initialBpm={drumPad.bpm}
              initialVolume={drumPad.volume}
              onGrooveChange={drumPad.onGrooveChange}
              onBpmChange={drumPad.onBpmChange}
              onVolumeChange={drumPad.onVolumeChange}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t text-center text-sm text-slate-400 hidden print:block">
        <p>ChordSet - {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  )
}

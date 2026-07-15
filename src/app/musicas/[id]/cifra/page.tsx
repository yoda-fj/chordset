'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Edit3, Music, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { CifraViewer, DrumPad } from '@/components/chords'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { AudioRecorderPanel } from '@/components/audio/AudioRecorderPanel'
import type { Musica } from '@/types/database'

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

  // Drum pad settings
  const [drumPadGroove, setDrumPadGroove] = useState('rock-8')
  const [drumPadBpm, setDrumPadBpm] = useState(120)
  const [drumPadVolume, setDrumPadVolume] = useState(0.7)
  const drumPadBpmTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const drumPadVolumeTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

        // Load drum pad settings from musica
        if (data.drum_pattern_id) {
          setDrumPadGroove(`db-${data.drum_pattern_id}`)
        } else if (data.groove) {
          setDrumPadGroove(data.groove)
        }
        if (data.bpm) setDrumPadBpm(data.bpm)
        if (data.volume != null) setDrumPadVolume(data.volume)
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

  // Save drum pad groove/drum_pattern_id
  const saveDrumPadGroove = async (grooveId: string, drumPatternId: number | null) => {
    if (!musicaId) return
    try {
      await fetch(`/api/musicas/${musicaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groove: grooveId.startsWith('db-') ? null : grooveId,
          drum_pattern_id: drumPatternId
        })
      })
    } catch (e) {
      console.error('Error saving drum pad groove:', e)
    }
  }

  // Save drum pad BPM
  const saveDrumPadBpm = async (bpm: number) => {
    if (!musicaId || bpm == null) return
    try {
      const res = await fetch(`/api/musicas/${musicaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bpm })
      })
      if (!res.ok) {
        const err = await res.json()
        console.error('Error saving drum pad bpm:', err)
      }
    } catch (e) {
      console.error('Error saving drum pad bpm:', e)
    }
  }

  // Save drum pad volume
  const saveDrumPadVolume = async (volume: number) => {
    if (!musicaId) return
    try {
      await fetch(`/api/musicas/${musicaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume })
      })
    } catch (e) {
      console.error('Error saving drum pad volume:', e)
    }
  }

  // Handlers for drum pad changes
  const handleDrumPadGrooveChange = (grooveId: string, drumPatternId: number | null) => {
    setDrumPadGroove(grooveId)
    if (drumPadBpmTimeoutRef.current) clearTimeout(drumPadBpmTimeoutRef.current)
    drumPadBpmTimeoutRef.current = setTimeout(() => saveDrumPadGroove(grooveId, drumPatternId), 1000)
  }

  const handleDrumPadBpmChange = (bpm: number) => {
    setDrumPadBpm(bpm)
    if (drumPadBpmTimeoutRef.current) clearTimeout(drumPadBpmTimeoutRef.current)
    drumPadBpmTimeoutRef.current = setTimeout(() => saveDrumPadBpm(bpm), 1000)
  }

  const handleDrumPadVolumeChange = (volume: number) => {
    setDrumPadVolume(volume)
    if (drumPadVolumeTimeoutRef.current) clearTimeout(drumPadVolumeTimeoutRef.current)
    drumPadVolumeTimeoutRef.current = setTimeout(() => saveDrumPadVolume(volume), 1000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!musica) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/musicas"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>
        </div>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Música não encontrada.</p>
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
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
        </div>

        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Music className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Esta música ainda não possui cifra cadastrada.</p>
          <Link
            href={`/musicas/${musicaId}/edit`}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
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
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <Link
              href={`/musicas/${musicaId}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Edit3 size={18} />
              Editar
            </Link>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
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
          className="fixed right-4 top-1/2 -translate-y-1/2 z-50 p-3 bg-white border shadow-lg rounded-full hover:bg-gray-50 print:hidden"
          title={sidebarOpen ? 'Fechar painel' : 'Abrir painel'}
        >
          {sidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Sidebar - Observacao + Audio + Drum Pad */}
        <div className={`transition-all duration-300 print:hidden overflow-y-auto ${sidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'}`}>
          <div className="space-y-4 p-4">
            {/* Observacao */}
            <div className="bg-white p-4 rounded-lg border">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Observações</h2>
              <div className="relative">
                <textarea
                  value={observacao}
                  onChange={(e) => handleObservacaoChange(e.target.value)}
                  onBlur={saveObservacao}
                  placeholder="Adicione observações..."
                  className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] text-sm"
                />
                {savingObs && (
                  <span className="absolute top-2 right-2 text-xs text-gray-400">Salvando...</span>
                )}
              </div>
            </div>

            {/* Audio Recording/Upload */}
            <div className="bg-white p-4 rounded-lg border">
              <AudioRecorderPanel {...audioRecorder} />
            </div>

            {/* Drum Pad / Groove */}
            <DrumPad
              initialGroove={drumPadGroove}
              initialBpm={drumPadBpm}
              initialVolume={drumPadVolume}
              onGrooveChange={handleDrumPadGrooveChange}
              onBpmChange={handleDrumPadBpmChange}
              onVolumeChange={handleDrumPadVolumeChange}
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

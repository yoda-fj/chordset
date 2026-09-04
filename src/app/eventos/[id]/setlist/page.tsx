'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Music, Check, ChevronLeft, ChevronRight, X, ChevronRight as ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { CifraViewer, DrumPad } from '@/components/chords'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import { useDrumPadSettings } from '@/hooks/useDrumPadSettings'
import { AudioRecorderPanel } from '@/components/audio/AudioRecorderPanel'
import type { EventoWithTemplate, EventoMusicaWithMusica } from '@/types/database'

export default function SetlistPage() {
  const params = useParams()
  const router = useRouter()
  const eventoId = parseInt(params.id as string)

  const [evento, setEvento] = useState<EventoWithTemplate | null>(null)
  const [musicas, setMusicas] = useState<EventoMusicaWithMusica[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  // Sidebar de repertório: aberta por padrão só no desktop (lg);
  // no mobile começa fechada pra não cobrir a cifra com o backdrop
  const [showSidebar, setShowSidebar] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Right sidebar state (observations + audio)
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false)
  const [observacao, setObservacao] = useState('')
  const [savingObs, setSavingObs] = useState(false)
  const obsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Audio recording
  const audioRecorder = useAudioRecorder({
    apiBase: `/api/eventos/${eventoId}/audio`,
    publicPrefix: '/eventos-audio/',
    entityAudioUrl: evento?.audio_url,
    onUpdated: (updated) => setEvento(updated as EventoWithTemplate),
  })

  // Drum pad da música selecionada (estado + persistência no hook compartilhado)
  const drumPad = useDrumPadSettings(musicas[selectedIndex]?.musicas ?? null)

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [eventoRes, musicasRes] = await Promise.all([
          fetch(`/api/eventos/${eventoId}`),
          fetch(`/api/eventos/${eventoId}/musicas`)
        ])

        if (!eventoRes.ok) throw new Error('Evento não encontrado')

        const eventoData = await eventoRes.json()
        setEvento(eventoData)
        setObservacao(eventoData.observacoes || '')

        if (musicasRes.ok) {
          const musicasData = await musicasRes.json()
          setMusicas(musicasData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [eventoId])

  // Keep screen awake - requests on user interaction
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    let wakeLockRequested = false

    async function requestWakeLock() {
      if ('wakeLock' in navigator && !wakeLockRequested) {
        try {
          wakeLockRequested = true
          wakeLock = await navigator.wakeLock.request('screen')
          wakeLockRef.current = wakeLock
        } catch {
          wakeLockRequested = false
        }
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        wakeLockRequested = false
        requestWakeLock()
      }
    }

    function handleFirstInteraction() {
      requestWakeLock()
      document.removeEventListener('touchstart', handleFirstInteraction)
      document.removeEventListener('click', handleFirstInteraction)
    }

    document.addEventListener('touchstart', handleFirstInteraction)
    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('touchstart', handleFirstInteraction)
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLock) {
        wakeLock.release()
      }
    }
  }, [])

  // Fullscreen handling
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const goNext = () => {
    if (selectedIndex < musicas.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  const goPrev = () => {
    if (selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  const selectMusica = (index: number) => {
    setSelectedIndex(index)
  }

  const toggleComplete = (index: number) => {
    setMusicas(prev => prev.map((m, i) =>
      i === index ? { ...m, confirmada: !m.confirmada } : m
    ))
  }

  // Save observacao
  const saveObservacao = async () => {
    if (!evento) return
    setSavingObs(true)
    try {
      const res = await fetch(`/api/eventos/${eventoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacoes: observacao })
      })
      if (res.ok) {
        const updated = await res.json()
        setEvento(updated)
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
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand"></div>
      </div>
    )
  }

  if (error || !evento) {
    return (
      <div className="text-center py-12">
        <p className="text-ink-muted">{error || 'Evento não encontrado'}</p>
        <Link href="/eventos" className="text-brand mt-4 inline-block">Voltar</Link>
      </div>
    )
  }

  const selectedMusica = musicas[selectedIndex]
  const cifra = selectedMusica?.musicas?.cifra || null

  // Painel direito (observações + áudio + ritmo) — compartilhado entre
  // a sidebar desktop (empurra) e o drawer mobile (sobrepõe a cifra)
  const rightPanel = (
    <div className="w-full flex flex-col gap-4">
      {/* Observacao */}
      <div className="bg-surface-overlay p-4 rounded-lg border">
        <h2 className="text-base font-semibold text-ink mb-3">Observações</h2>
        <div className="relative">
          <textarea
            value={observacao}
            onChange={(e) => handleObservacaoChange(e.target.value)}
            onBlur={saveObservacao}
            placeholder="Adicione observações..."
            className="w-full p-3 bg-surface border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-brand min-h-[120px] text-sm text-ink placeholder:text-ink-faint"
          />
          {savingObs && (
            <span className="absolute top-2 right-2 text-xs text-ink-faint">Salvando...</span>
          )}
        </div>
      </div>

      {/* Audio Recording/Upload */}
      <div className="bg-surface-overlay p-4 rounded-lg border">
        <AudioRecorderPanel {...audioRecorder} />
      </div>

      {/* Drum Pad / Ritmo da música selecionada */}
      {selectedMusica && (
        <DrumPad
          key={selectedMusica.musica_id}
          initialGroove={drumPad.groove}
          initialBpm={drumPad.bpm}
          initialVolume={drumPad.volume}
          onGrooveChange={drumPad.onGrooveChange}
          onBpmChange={drumPad.onBpmChange}
          onVolumeChange={drumPad.onVolumeChange}
        />
      )}
    </div>
  )

  return (
    <div className="h-[100dvh] flex flex-col bg-surface overflow-hidden">
      {/* Header */}
      <header className="bg-surface-raised border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div>
            <h1 className="font-bold text-ink">{evento.nome}</h1>
            <p className="text-sm text-ink-muted">{selectedIndex + 1} de {musicas.length}</p>
          </div>
        </div>

        <button onClick={() => router.back()} className="p-2 hover:bg-surface-overlay rounded-lg text-ink" title="Fechar">
          <X size={20} />
        </button>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`
          ${showSidebar ? 'w-72' : 'w-0'}
          bg-surface-raised border-r transition-all duration-200 overflow-hidden flex-shrink-0 hidden lg:block
        `}>
          <div className="w-72 overflow-y-auto h-full flex flex-col">
            {/* Navigation buttons */}
            <div className="p-2 border-b flex items-center justify-center gap-2 shrink-0">
              <button
                onClick={goPrev}
                disabled={selectedIndex === 0}
                className="p-2 rounded-lg text-ink hover:bg-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => toggleComplete(selectedIndex)}
                className={`p-2 rounded-lg ${selectedMusica?.confirmada ? 'bg-success/15 text-success hover:bg-success/25' : 'text-ink hover:bg-surface-overlay'}`}
              >
                <Check size={20} />
              </button>
              <button
                onClick={goNext}
                disabled={selectedIndex === musicas.length - 1}
                className="p-2 rounded-lg text-ink hover:bg-surface-overlay disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <div className="p-2 flex-1 overflow-y-auto">
              {musicas.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => selectMusica(index)}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${index === selectedIndex ? 'bg-brand/15 text-brand' : 'text-ink hover:bg-surface-overlay'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${item.confirmada ? 'bg-success text-surface' : index === selectedIndex ? 'bg-brand text-surface' : 'bg-surface-overlay text-ink-muted'}`}>
                      {item.confirmada ? <Check size={14} /> : index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${item.confirmada ? 'line-through text-ink-faint' : ''}`}>
                        {item.musicas?.titulo}
                      </div>
                      <div className="text-sm text-ink-muted truncate">{item.musicas?.artista}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {showSidebar && (
          <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />
        )}

        {/* Mobile sidebar */}
        <aside className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-surface-raised z-50 transition-transform duration-200 lg:hidden overflow-y-auto flex flex-col`}>
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <h2 className="font-semibold text-ink">Repertório</h2>
            <button onClick={() => setShowSidebar(false)} className="p-2 text-ink-muted hover:text-ink" aria-label="Fechar repertório"><X size={20} /></button>
          </div>
          {/* Navigation buttons */}
          <div className="p-2 border-b flex items-center justify-center gap-2 shrink-0">
            <button
              onClick={goPrev}
              disabled={selectedIndex === 0}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => toggleComplete(selectedIndex)}
              className={`p-2 rounded-lg ${selectedMusica?.confirmada ? 'bg-success/15 text-success hover:bg-success/25' : 'text-ink hover:bg-surface-overlay'}`}
            >
              <Check size={20} />
            </button>
            <button
              onClick={goNext}
              disabled={selectedIndex === musicas.length - 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="p-2 flex-1 overflow-y-auto">
            {musicas.map((item, index) => (
              <button
                key={item.id}
                onClick={() => { selectMusica(index); setShowSidebar(false) }}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${index === selectedIndex ? 'bg-brand/15 text-brand' : 'text-ink hover:bg-surface-overlay'}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${item.confirmada ? 'bg-success text-surface' : index === selectedIndex ? 'bg-brand text-surface' : 'bg-surface-overlay text-ink-muted'}`}>
                    {item.confirmada ? <Check size={14} /> : index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${item.confirmada ? 'line-through text-ink-faint' : ''}`}>{item.musicas?.titulo}</div>
                    <div className="text-sm text-ink-muted truncate">{item.musicas?.artista}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content - Cifra (sempre largura total; no mobile o painel sobrepõe) */}
        <div className="flex flex-col h-full min-w-0 flex-1">
          {musicas.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-ink-muted">
                <Music size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma música no repertório</p>
              </div>
            </div>
          ) : (
            <div className="h-full p-4 md:p-6 pb-8">
              <CifraViewer
                cifra={cifra}
                titulo={selectedMusica?.musicas?.titulo || ''}
                artista={selectedMusica?.musicas?.artista || ''}
                tomOriginal={selectedMusica?.musicas?.tom_original || null}
                showMetronome={true}
                showControls={true}
                isFullscreen={isFullscreen}
                onFullscreenChange={setIsFullscreen}
                onToggleSidebar={() => setShowSidebar(!showSidebar)}
                sidebarOpen={showSidebar}
                className="h-full"
              />
            </div>
          )}
        </div>

        {/* Sidebar toggle button — no mobile fica fixo à direita (o drawer tem X próprio) */}
        <button
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className={`absolute top-1/2 -translate-y-1/2 z-30 p-3 bg-surface-raised border shadow-lg rounded-full text-ink hover:bg-surface-overlay transition-all duration-300 ${rightSidebarOpen ? 'right-4 lg:right-80' : 'right-4'}`}
          title={rightSidebarOpen ? 'Fechar painel' : 'Abrir painel'}
        >
          {rightSidebarOpen ? <ChevronRightIcon size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Right Sidebar - desktop: em fluxo, empurra a cifra */}
        <div className={`hidden lg:block h-full bg-surface-raised border-l overflow-y-auto transition-all duration-300 print:hidden flex-shrink-0 ${rightSidebarOpen ? 'w-80 p-4' : 'w-0 overflow-hidden'}`}>
          {rightSidebarOpen && rightPanel}
        </div>

        {/* Right Sidebar - mobile: drawer que SOBREPÕE a cifra */}
        {rightSidebarOpen && (
          <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setRightSidebarOpen(false)} />
        )}
        <aside className={`fixed right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-surface-raised border-l z-50 transition-transform duration-200 lg:hidden overflow-y-auto ${rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <h2 className="font-semibold text-ink">Painel</h2>
            <button onClick={() => setRightSidebarOpen(false)} className="p-2 text-ink-muted hover:text-ink" aria-label="Fechar painel"><X size={20} /></button>
          </div>
          <div className="p-4">{rightPanel}</div>
        </aside>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Music, Check, ChevronLeft, ChevronRight, Menu, X, Mic, Upload, Trash2, Play, Pause, Loader2, ChevronRight as ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { CifraViewer } from '@/components/chords'

export default function SetlistPage() {
  const params = useParams()
  const router = useRouter()
  const eventoId = parseInt(params.id as string)

  const [evento, setEvento] = useState<any>(null)
  const [musicas, setMusicas] = useState<any[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentTom, setCurrentTom] = useState<string | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
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
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Sync audio element src when audioUrl changes
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      audioRef.current.src = audioUrl
      setIsPlaying(false)
    }
  }, [audioUrl])

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
        if (eventoData.audio_url) {
          // Convert /eventos-audio/ path to /api/eventos-audio/ for Docker standalone mode
          const audioPath = eventoData.audio_url.startsWith('/eventos-audio/')
            ? eventoData.audio_url.replace('/eventos-audio/', '/api/eventos-audio/')
            : eventoData.audio_url
          setAudioUrl(audioPath)
        }

        if (musicasRes.ok) {
          const musicasData = await musicasRes.json()
          setMusicas(musicasData)
          if (musicasData.length > 0) {
            const tom = musicasData[0].tom_evento || musicasData[0].musicas?.tom_original || 'C'
            setCurrentTom(tom)
          }
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
        } catch (err) {
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
      const next = selectedIndex + 1
      setSelectedIndex(next)
      const tom = musicas[next].tom_evento || musicas[next].musicas?.tom_original || 'C'
      setCurrentTom(tom)
    }
  }

  const goPrev = () => {
    if (selectedIndex > 0) {
      const prev = selectedIndex - 1
      setSelectedIndex(prev)
      const tom = musicas[prev].tom_evento || musicas[prev].musicas?.tom_original || 'C'
      setCurrentTom(tom)
    }
  }

  const selectMusica = (index: number) => {
    setSelectedIndex(index)
    const tom = musicas[index].tom_evento || musicas[index].musicas?.tom_original || 'C'
    setCurrentTom(tom)
  }

  const toggleComplete = (index: number) => {
    setMusicas(prev => prev.map((m, i) =>
      i === index ? { ...m, confirmada: !m.confirmada } : m
    ))
  }

  const handleTranspose = (newTom: string) => {
    setCurrentTom(newTom)
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

  // Recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data)
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' })
        setAudioBlob(blob)
        setAudioUrl(URL.createObjectURL(blob))
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      timerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1)
      }, 1000)
    } catch (err) {
      console.error('Error starting recording:', err)
      alert('Não foi possível acessar o microfone')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const uploadAudio = async () => {
    if (!audioBlob) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      const res = await fetch(`/api/eventos/${eventoId}/audio`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const updated = await res.json()
        setEvento(updated)
        // Convert path for Docker standalone mode
        const audioPath = updated.audio_url?.startsWith('/eventos-audio/')
          ? updated.audio_url.replace('/eventos-audio/', '/api/eventos-audio/')
          : updated.audio_url
        setAudioUrl(audioPath)
        setAudioBlob(null)
      } else {
        const err = await res.json()
        alert(err.error || 'Erro ao fazer upload')
      }
    } catch (e) {
      console.error('Error uploading:', e)
      alert('Erro ao fazer upload')
    }
    setIsUploading(false)
  }

  const uploadFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('audio', file)
      const res = await fetch(`/api/eventos/${eventoId}/audio`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const updated = await res.json()
        setEvento(updated)
        // Convert path for Docker standalone mode
        const audioPath = updated.audio_url?.startsWith('/eventos-audio/')
          ? updated.audio_url.replace('/eventos-audio/', '/api/eventos-audio/')
          : updated.audio_url
        setAudioUrl(audioPath)
        if (audioUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl)
        }
        setAudioBlob(null)
      } else {
        const err = await res.json()
        alert(err.error || 'Erro ao fazer upload')
      }
    } catch (e) {
      console.error('Error uploading:', e)
      alert('Erro ao fazer upload')
    }
    setIsUploading(false)
    e.target.value = ''
  }

  const deleteAudio = async () => {
    if (!confirm('Deseja realmente excluir a gravação?')) return
    try {
      const res = await fetch(`/api/eventos/${eventoId}/audio`, {
        method: 'DELETE'
      })
      if (res.ok) {
        const updated = await res.json()
        setEvento(updated)
        setAudioUrl(null)
        setAudioBlob(null)
        if (audioUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(audioUrl)
        }
      }
    } catch (e) {
      console.error('Error deleting:', e)
    }
  }

  const clearRecording = () => {
    if (audioUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl)
    }
    // Convert path for Docker standalone mode
    const audioPath = evento?.audio_url?.startsWith('/eventos-audio/')
      ? evento.audio_url.replace('/eventos-audio/', '/api/eventos-audio/')
      : evento?.audio_url || null
    setAudioUrl(audioPath)
    setAudioBlob(null)
  }

  const togglePlayback = () => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !evento) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error || 'Evento não encontrado'}</p>
        <Link href="/eventos" className="text-indigo-600 mt-4 inline-block">Voltar</Link>
      </div>
    )
  }

  const selectedMusica = musicas[selectedIndex]
  const cifra = selectedMusica?.musicas?.cifra || null

  return (
    <div className="h-screen flex flex-col bg-gray-100 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">{evento.nome}</h1>
            <p className="text-sm text-gray-500">{selectedIndex + 1} de {musicas.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-gray-100 rounded-lg" title={showSidebar ? 'Fechar lista' : 'Abrir lista'}>
            {showSidebar ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar */}
        <aside className={`
          ${showSidebar ? 'w-72' : 'w-0'}
          bg-white border-r transition-all duration-200 overflow-hidden flex-shrink-0 hidden lg:block
        `}>
          <div className="w-72 overflow-y-auto h-full flex flex-col">
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
                className={`p-2 rounded-lg ${selectedMusica?.confirmada ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'hover:bg-gray-100'}`}
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
                  onClick={() => selectMusica(index)}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${index === selectedIndex ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${item.confirmada ? 'bg-green-500 text-white' : index === selectedIndex ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {item.confirmada ? <Check size={14} /> : index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${item.confirmada ? 'line-through text-gray-500' : ''}`}>
                        {item.musicas?.titulo}
                      </div>
                      <div className="text-sm text-gray-500 truncate">{item.musicas?.artista}</div>
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
        <aside className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed left-0 top-0 bottom-0 w-72 bg-white z-50 transition-transform duration-200 lg:hidden overflow-y-auto flex flex-col`}>
          <div className="p-4 border-b flex items-center justify-between shrink-0">
            <h2 className="font-semibold">Repertório</h2>
            <button onClick={() => setShowSidebar(false)} className="p-2"><X size={20} /></button>
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
              className={`p-2 rounded-lg ${selectedMusica?.confirmada ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'hover:bg-gray-100'}`}
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
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${index === selectedIndex ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${item.confirmada ? 'bg-green-500 text-white' : index === selectedIndex ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {item.confirmada ? <Check size={14} /> : index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${item.confirmada ? 'line-through text-gray-500' : ''}`}>{item.musicas?.titulo}</div>
                    <div className="text-sm text-gray-500 truncate">{item.musicas?.artista}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content - Cifra */}
        <div className={`flex flex-col h-full min-w-0 ${rightSidebarOpen ? 'w-1/2' : 'w-full'}`}>
          {musicas.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
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
                className="h-full"
              />
            </div>
          )}
        </div>

        {/* Sidebar toggle button */}
        <button
          onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
          className={`absolute top-1/2 -translate-y-1/2 z-50 p-3 bg-white border shadow-lg rounded-full hover:bg-gray-50 transition-all duration-300 ${rightSidebarOpen ? 'right-80' : 'right-4'}`}
          title={rightSidebarOpen ? 'Fechar painel' : 'Abrir painel'}
        >
          {rightSidebarOpen ? <ChevronRightIcon size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Right Sidebar - Observations + Audio */}
        <div className={`h-full bg-gray-50 p-4 overflow-y-auto transition-all duration-300 print:hidden flex-shrink-0 ${rightSidebarOpen ? 'w-80' : 'w-0'}`}>
          <div className="w-full h-full flex flex-col space-y-4">
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
              <h2 className="text-base font-semibold text-gray-900 mb-3">Gravação de Referência</h2>

              {audioUrl && !audioBlob && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-3">
                  <button
                    onClick={togglePlayback}
                    className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
                  >
                    {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <audio
                    ref={audioRef}
                    onEnded={() => setIsPlaying(false)}
                  />
                  <span className="flex-1 text-sm text-gray-600">Sua gravação</span>
                  <button
                    onClick={deleteAudio}
                    className="p-1 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Excluir gravação"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )}

              {audioBlob && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">Nova gravação</p>
                    <p className="text-xs text-green-600">{formatTime(recordingTime)}</p>
                  </div>
                  <button
                    onClick={uploadAudio}
                    disabled={isUploading}
                    className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-1 text-sm"
                  >
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Salvar
                  </button>
                  <button
                    onClick={clearRecording}
                    className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {!audioUrl && !audioBlob && (
                <p className="text-xs text-gray-500 mb-3">Gravar ou enviar áudio</p>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="audio-upload"
                  accept="audio/*"
                  onChange={uploadFileInput}
                  className="hidden"
                />
                <label
                  htmlFor="audio-upload"
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer text-sm"
                >
                  <Upload size={14} />
                  Enviar
                </label>

                {!audioBlob && (
                  <>
                    {isRecording ? (
                      <button
                        onClick={stopRecording}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                      >
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                        Parar ({formatTime(recordingTime)})
                      </button>
                    ) : (
                      <button
                        onClick={startRecording}
                        className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                      >
                        <Mic size={14} />
                        Gravar
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

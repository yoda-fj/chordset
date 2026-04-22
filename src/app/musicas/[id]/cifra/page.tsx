'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Edit3, Music, Mic, Upload, Trash2, Play, Pause, X, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { CifraViewer } from '@/components/chords'

export default function CifraPage() {
  const router = useRouter()
  const params = useParams()
  const musicaId = parseInt(params.id as string)

  const [musica, setMusica] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Observacao
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

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

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
        if (data.audio_url) {
          setAudioUrl(data.audio_url)
        }
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
      const res = await fetch(`/api/musicas/${musicaId}/audio`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const updated = await res.json()
        setMusica(updated)
        setAudioUrl(updated.audio_url)
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
      const res = await fetch(`/api/musicas/${musicaId}/audio`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const updated = await res.json()
        setMusica(updated)
        setAudioUrl(updated.audio_url)
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
      const res = await fetch(`/api/musicas/${musicaId}/audio`, {
        method: 'DELETE'
      })
      if (res.ok) {
        const updated = await res.json()
        setMusica(updated)
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
    setAudioUrl(musica?.audio_url || null)
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
    <div className={`mx-auto flex flex-col ${isFullscreen ? 'w-full h-screen max-w-none p-0' : 'max-w-6xl min-h-[calc(100vh-8rem)]'}`}>
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
        <div className={`transition-all duration-300 flex flex-col ${sidebarOpen ? 'flex-1' : 'w-full'}`}>
          {/* CifraViewer - reusa o mesmo componente */}
          <CifraViewer
            cifra={musica.cifra}
            titulo={musica.titulo}
            artista={musica.artista}
            tomOriginal={musica.tom_original}
            showMetronome={true}
            showControls={true}
            onFullscreenChange={setIsFullscreen}
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

        {/* Sidebar - Observacao + Audio */}
        <div className={`transition-all duration-300 overflow-hidden print:hidden ${sidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'}`}>
          <div className="space-y-4">
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
                    src={audioUrl}
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

      <div className="mt-8 pt-4 border-t text-center text-sm text-slate-400 hidden print:block">
        <p>ChordSet - {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Music, Edit, FileText, Calendar, Mic, Upload, Trash2, Play, Pause, X } from 'lucide-react'
import Link from 'next/link'

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  confirmado: 'bg-blue-100 text-blue-700',
  realizado: 'bg-green-100 text-green-700',
  cancelado: 'bg-red-100 text-red-700',
}

export default function MusicaPage() {
  const params = useParams()
  const musicaId = parseInt(params.id as string)

  const [musica, setMusica] = useState<any>(null)
  const [eventos, setEventos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Observacao editing
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
        if (musicaData.audio_url) {
          setAudioUrl(musicaData.audio_url)
        }

        if (eventosRes.ok) {
          const eventosData = await eventosRes.json()
          setEventos(eventosData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    loadData()

    return () => {
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl)
      }
    }
  }, [musicaId])

  // Save observacao on blur or after typing stops
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error || !musica) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Música não encontrada'}</p>
        <Link href="/musicas" className="text-indigo-600 hover:text-indigo-700 font-medium">
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
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
        <Link
          href={`/musicas/${musicaId}/edit`}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg transition-colors"
        >
          <Edit size={18} />
          Editar
        </Link>
      </div>

      {/* Info */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Music size={32} className="text-indigo-600" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{musica.titulo}</h1>
            <p className="text-lg text-gray-600 mt-1">{musica.artista}</p>
            {musica.tom_original && (
              <p className="text-sm text-gray-500 mt-2">Tom original: {musica.tom_original}</p>
            )}
          </div>
        </div>

        {musica.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {musica.tags.map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Observacao */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Observações</h2>
        <div className="relative">
          <textarea
            value={observacao}
            onChange={(e) => handleObservacaoChange(e.target.value)}
            onBlur={saveObservacao}
            placeholder="Adicione observações sobre esta música..."
            className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
          />
          {savingObs && (
            <span className="absolute top-2 right-2 text-xs text-gray-400">Salvando...</span>
          )}
        </div>
      </div>

      {/* Audio Recording/Upload */}
      <div className="bg-white p-6 rounded-lg border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Gravação de Referência</h2>

        {audioUrl && !audioBlob && (
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
            <button
              onClick={togglePlayback}
              className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700"
            >
              {isPlaying ? <Pause size={20} /> : <Play size={20} />}
            </button>
            <audio
              ref={audioRef}
              src={audioUrl}
              onEnded={() => setIsPlaying(false)}
            />
            <span className="flex-1 text-sm text-gray-600">Sua gravação</span>
            <button
              onClick={deleteAudio}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Excluir gravação"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}

        {audioBlob && (
          <div className="flex items-center gap-4 p-4 bg-green-50 rounded-lg mb-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">Nova gravação</p>
              <p className="text-xs text-green-600">{formatTime(recordingTime)}</p>
            </div>
            <button
              onClick={uploadAudio}
              disabled={isUploading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
              Salvar
            </button>
            <button
              onClick={clearRecording}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {!audioUrl && !audioBlob && (
          <p className="text-sm text-gray-500 mb-4">Gravar ou enviar áudio para referência</p>
        )}

        <div className="flex items-center gap-4">
          <input
            type="file"
            id="audio-upload"
            accept="audio/*"
            onChange={uploadFileInput}
            className="hidden"
          />
          <label
            htmlFor="audio-upload"
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <Upload size={18} />
            Enviar arquivo
          </label>

          {!audioBlob && (
            <>
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  Parar ({formatTime(recordingTime)})
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Mic size={18} />
                  Gravar
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Ações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/musicas/${musicaId}/cifra`}
          className="bg-white p-6 rounded-lg border hover:border-indigo-500 hover:shadow-md transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded">
              <FileText size={24} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Ver Cifra</h3>
              <p className="text-sm text-gray-500">Cifra com acorde simplificado</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Eventos que usam esta música */}
      {eventos.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Eventos ({eventos.length})
            </h2>
          </div>
          <div className="space-y-2">
            {eventos.map((evento) => (
              <Link
                key={evento.id}
                href={`/eventos/${evento.id}`}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">{evento.nome}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(evento.data).toLocaleDateString('pt-BR')}
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
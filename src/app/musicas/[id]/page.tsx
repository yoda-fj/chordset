'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Music, Edit, FileText, Calendar, Mic, Upload, Trash2, Play, Pause, X, ChevronLeft, ChevronRight, Drum } from 'lucide-react'
import * as Tone from 'tone'
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
  const [drumPatterns, setDrumPatterns] = useState<any[]>([])
  const [selectedRitmo, setSelectedRitmo] = useState<any>(null)
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const ritmoSeqRef = useRef<any>(null)

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
          // Convert path for Docker standalone mode
          const audioPath = musicaData.audio_url.startsWith('/musicas-audio/')
            ? musicaData.audio_url.replace('/musicas-audio/', '/api/musicas-audio/')
            : musicaData.audio_url
          setAudioUrl(audioPath)
        }

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
            const found = ritmosData.find((r: any) => r.id === musicaData.drum_pattern_id)
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
        // Convert path for Docker standalone mode
        const audioPath = updated.audio_url?.startsWith('/musicas-audio/')
          ? updated.audio_url.replace('/musicas-audio/', '/api/musicas-audio/')
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
      const res = await fetch(`/api/musicas/${musicaId}/audio`, {
        method: 'POST',
        body: formData
      })
      if (res.ok) {
        const updated = await res.json()
        setMusica(updated)
        // Convert path for Docker standalone mode
        const audioPath = updated.audio_url?.startsWith('/musicas-audio/')
          ? updated.audio_url.replace('/musicas-audio/', '/api/musicas-audio/')
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
    // Convert path for Docker standalone mode
    const audioPath = musica?.audio_url?.startsWith('/musicas-audio/')
      ? musica.audio_url.replace('/musicas-audio/', '/api/musicas-audio/')
      : musica?.audio_url || null
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

  const saveRitmo = async (ritmoId: number | null) => {
    try {
      const res = await fetch(`/api/musicas/${musicaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ drum_pattern_id: ritmoId })
      })
      if (res.ok) {
        const updated = await res.json()
        setMusica(updated)
        if (ritmoId) {
          const found = drumPatterns.find((r: any) => r.id === ritmoId)
          setSelectedRitmo(found || null)
        } else {
          setSelectedRitmo(null)
        }
      }
    } catch (e) {
      console.error('Error saving ritmo:', e)
    }
  }

  const playRitmo = async () => {
    if (!selectedRitmo) return
    await Tone.start()
    
    if (ritmoSeqRef.current) {
      ritmoSeqRef.current.stop()
      ritmoSeqRef.current.dispose()
    }

    const urls = {
      'kick': '/drum-samples/Kick-V01-Yamaha-16x16.wav',
      'snare': '/drum-samples/SNARE-V01-CustomWorks-6x13.wav',
      'hihatClosed': '/drum-samples/HiHat-closed-V01-Yamaha-14.wav',
      'hihatOpen': '/drum-samples/HiHat-open-V01-Yamaha-14.wav',
      'crash': '/drum-samples/Crash-V01-Pure.wav',
      'ride': '/drum-samples/Ride-V01-Pure.wav',
      'tomLow': '/drum-samples/TOM-LOW-V01-Yamaha-12x8.wav',
      'tomMid': '/drum-samples/TOM-MID-V01-Yamaha-10x9.wav',
      'tomHigh': '/drum-samples/TOM-HIGH-V01-Yamaha-7x5.wav',
    }

    const sampler = new Tone.Sampler({ urls }).toDestination()
    sampler.volume.value = 6

    Tone.Transport.bpm.value = selectedRitmo.bpm || 120

    const steps = JSON.parse(selectedRitmo.steps)
    const stepArray = new Array(16).fill(0).map((_, i) => i)

    ritmoSeqRef.current = new Tone.Sequence(
      (time: any, stepIdx: number) => {
        const instruments = ['kick', 'snare', 'hihatClosed', 'hihatOpen', 'crash', 'ride', 'tomLow', 'tomMid', 'tomHigh']
        instruments.forEach((inst, instIdx) => {
          if (steps[instIdx]?.[stepIdx]) {
            const noteMap: Record<string, string> = {
              kick: 'C1', snare: 'D1', hihatClosed: 'F#1', hihatOpen: 'A#1',
              crash: 'C2', ride: 'D2', tomLow: 'E2', tomMid: 'F2', tomHigh: 'G2'
            }
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

  const stopRitmo = () => {
    if (ritmoSeqRef.current) {
      ritmoSeqRef.current.stop()
      ritmoSeqRef.current.dispose()
      ritmoSeqRef.current = null
    }
    Tone.Transport.stop()
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

      {/* Ritmo (Drum Pattern) */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <Drum size={20} className="text-indigo-500" />
          <h2 className="text-lg font-semibold text-gray-900">Ritmo de Bateria</h2>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedRitmo?.id || ''}
            onChange={(e) => {
              const val = e.target.value
              saveRitmo(val ? parseInt(val) : null)
            }}
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Nenhum ritmo selecionado</option>
            {drumPatterns.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.nome} ({p.bpm} BPM)
              </option>
            ))}
          </select>
          {selectedRitmo ? (
            <button
              onClick={playRitmo}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Play size={18} />
              Tocar
            </button>
          ) : (
            <span className="text-sm text-gray-400">Selecione um ritmo</span>
          )}
        </div>
        {selectedRitmo && (
          <p className="text-sm text-gray-500 mt-2">
            Kit: {selectedRitmo.kit} • BPM: {selectedRitmo.bpm}
          </p>
        )}
      </div>

      {/* Observacao + Audio - Collapsible sidebar */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-start print:hidden">
        {/* Toggle button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 bg-white border shadow-lg rounded-l-lg hover:bg-gray-50"
          title={sidebarOpen ? 'Fechar painel' : 'Abrir painel'}
        >
          {sidebarOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>

        {/* Sidebar content */}
        <div className={`transition-all duration-300 overflow-hidden bg-white border shadow-lg rounded-l-lg ${sidebarOpen ? 'w-80 p-4 opacity-100' : 'w-0 p-0 opacity-0'}`}>
          <div className="space-y-4">
            {/* Observacao */}
            <div>
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
            <div>
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
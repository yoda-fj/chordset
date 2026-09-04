import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent, RefObject } from 'react'
import { apiFetch } from '@/utils/api'
import { toast } from 'sonner'

interface UseAudioRecorderOptions {
  apiBase: string
  publicPrefix: '/musicas-audio/' | '/eventos-audio/'
  entityAudioUrl: string | null | undefined
  onUpdated: (updatedEntity: { audio_url: string | null }) => void
}

export interface UseAudioRecorderReturn {
  isRecording: boolean
  recordingTime: number
  audioBlob: Blob | null
  audioUrl: string | null
  isUploading: boolean
  isPlaying: boolean
  audioRef: RefObject<HTMLAudioElement | null>
  startRecording: () => Promise<void>
  stopRecording: () => void
  uploadAudio: () => Promise<void>
  uploadFileInput: (e: ChangeEvent<HTMLInputElement>) => Promise<void>
  deleteAudio: () => Promise<void>
  clearRecording: () => void
  togglePlayback: () => void
  formatTime: (seconds: number) => string
}

export function useAudioRecorder({
  apiBase,
  publicPrefix,
  entityAudioUrl,
  onUpdated,
}: UseAudioRecorderOptions): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioUrlRef = useRef<string | null>(null)

  // Convert DB path (e.g. '/musicas-audio/x.webm') for Docker standalone mode
  const toPlayablePath = useCallback(
    (url: string | null | undefined): string | null => {
      if (!url) return null
      return url.startsWith(publicPrefix) ? url.replace(publicPrefix, `/api${publicPrefix}`) : url
    },
    [publicPrefix]
  )

  // Mirror of audioUrl for the unmount cleanup (avoids stale closures)
  useEffect(() => {
    audioUrlRef.current = audioUrl
  }, [audioUrl])

  // Sets audioUrl, revoking the previous blob URL when replaced
  const setAudioUrlTracked = useCallback((url: string | null) => {
    const prev = audioUrlRef.current
    if (prev && prev !== url && prev.startsWith('blob:')) {
      URL.revokeObjectURL(prev)
    }
    setAudioUrl(url)
  }, [])

  // Sync audioUrl from the entity's audio_url (may arrive async) by adjusting
  // state during render when the entity value changes
  const [prevEntityAudioUrl, setPrevEntityAudioUrl] = useState(entityAudioUrl)
  if (entityAudioUrl !== prevEntityAudioUrl) {
    setPrevEntityAudioUrl(entityAudioUrl)
    setAudioUrl(toPlayablePath(entityAudioUrl))
  }

  // Reset play state when the track ends
  useEffect(() => {
    const el = audioRef.current
    if (!el) return
    const handleEnded = () => setIsPlaying(false)
    el.addEventListener('ended', handleEnded)
    return () => el.removeEventListener('ended', handleEnded)
  }, [audioUrl, audioBlob])

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrlRef.current?.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

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
        setAudioUrlTracked(URL.createObjectURL(blob))
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
      toast.error('Não foi possível acessar o microfone')
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
      const updated = await apiFetch<{ audio_url: string | null }>(apiBase, {
        method: 'POST',
        body: formData
      })
      onUpdated(updated)
      setAudioUrlTracked(toPlayablePath(updated.audio_url))
      setAudioBlob(null)
    } catch (e) {
      console.error('Error uploading:', e)
      toast.error(e instanceof Error ? e.message : 'Erro ao fazer upload')
    }
    setIsUploading(false)
  }

  const uploadFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('audio', file)
      const updated = await apiFetch<{ audio_url: string | null }>(apiBase, {
        method: 'POST',
        body: formData
      })
      onUpdated(updated)
      setAudioUrlTracked(toPlayablePath(updated.audio_url))
      setAudioBlob(null)
    } catch (e) {
      console.error('Error uploading:', e)
      toast.error(e instanceof Error ? e.message : 'Erro ao fazer upload')
    }
    setIsUploading(false)
    e.target.value = ''
  }

  const deleteAudio = async () => {
    try {
      const updated = await apiFetch<{ audio_url: string | null }>(apiBase, { method: 'DELETE' })
      onUpdated(updated)
      setAudioUrlTracked(null)
      setAudioBlob(null)
    } catch (e) {
      console.error('Error deleting:', e)
    }
  }

  const clearRecording = () => {
    setAudioUrlTracked(toPlayablePath(entityAudioUrl))
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

  return {
    isRecording,
    recordingTime,
    audioBlob,
    audioUrl,
    isUploading,
    isPlaying,
    audioRef,
    startRecording,
    stopRecording,
    uploadAudio,
    uploadFileInput,
    deleteAudio,
    clearRecording,
    togglePlayback,
    formatTime,
  }
}

'use client'

import { useState } from 'react'
import { Mic, Upload, Trash2, Play, Pause, X, Loader2 } from 'lucide-react'
import type { UseAudioRecorderReturn } from '@/hooks/useAudioRecorder'
import { ConfirmDialog } from '@/components/ui/Dialog'

interface AudioRecorderPanelProps extends UseAudioRecorderReturn {
  title?: string
}

export function AudioRecorderPanel({
  title = 'Gravação de Referência',
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
}: AudioRecorderPanelProps) {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)

  return (
    <>
      <h2 className="text-base font-semibold text-ink mb-3">{title}</h2>

      {audioUrl && !audioBlob && (
        <div className="flex items-center gap-3 p-3 bg-surface rounded-lg mb-3">
          <button
            onClick={togglePlayback}
            className="flex h-12 w-12 items-center justify-center bg-brand text-zinc-950 rounded-full hover:bg-brand-600 transition-colors"
            aria-label={isPlaying ? 'Pausar áudio' : 'Ouvir gravação'}
          >
            {isPlaying ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
          </button>
          <audio
            ref={audioRef}
            src={audioUrl}
          />
          <span className="flex-1 text-sm text-ink-muted">Sua gravação</span>
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="flex h-12 w-12 items-center justify-center text-danger hover:bg-danger/10 rounded-lg transition-colors"
            aria-label="Excluir gravação"
          >
            <Trash2 size={16} aria-hidden />
          </button>
          <ConfirmDialog
            open={confirmDeleteOpen}
            onOpenChange={setConfirmDeleteOpen}
            title="Excluir gravação?"
            description="Deseja realmente excluir a gravação? Essa ação não pode ser desfeita."
            onConfirm={deleteAudio}
          />
        </div>
      )}

      {audioBlob && (
        <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg mb-3">
          <div className="flex-1">
            <p className="text-sm font-medium text-success">Nova gravação</p>
            <p className="text-xs text-success">{formatTime(recordingTime)}</p>
          </div>
          <button
            onClick={uploadAudio}
            disabled={isUploading}
            className="px-3 min-h-12 bg-success text-zinc-950 rounded-lg hover:bg-success/80 disabled:opacity-50 flex items-center gap-1 text-sm"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" aria-hidden /> : <Upload size={14} aria-hidden />}
            Salvar
          </button>
          <button
            onClick={clearRecording}
            className="flex h-12 w-12 items-center justify-center text-ink-muted hover:bg-surface-overlay rounded-lg transition-colors"
            aria-label="Descartar gravação"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
      )}

      {!audioUrl && !audioBlob && (
        <p className="text-xs text-ink-muted mb-3">Gravar ou enviar áudio</p>
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
          className="flex items-center gap-1 px-3 min-h-12 border border-ink/20 rounded-lg hover:bg-surface cursor-pointer text-sm text-ink"
        >
          <Upload size={14} aria-hidden />
          Enviar
        </label>

        {!audioBlob && (
          <>
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-1 px-3 min-h-12 bg-danger text-zinc-950 rounded-lg hover:bg-danger/80 text-sm"
              >
                <div className="w-2 h-2 bg-surface-raised rounded-full animate-pulse" aria-hidden />
                Parar ({formatTime(recordingTime)})
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="flex items-center gap-1 px-3 min-h-12 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 text-sm"
              >
                <Mic size={14} aria-hidden />
                Gravar
              </button>
            )}
          </>
        )}
      </div>
    </>
  )
}

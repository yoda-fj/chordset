'use client'

import { Mic, Upload, Trash2, Play, Pause, X, Loader2 } from 'lucide-react'
import type { UseAudioRecorderReturn } from '@/hooks/useAudioRecorder'

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
  return (
    <>
      <h2 className="text-base font-semibold text-ink mb-3">{title}</h2>

      {audioUrl && !audioBlob && (
        <div className="flex items-center gap-3 p-3 bg-surface rounded-lg mb-3">
          <button
            onClick={togglePlayback}
            className="p-2 bg-brand text-zinc-950 rounded-full hover:bg-brand-600"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </button>
          <audio
            ref={audioRef}
            src={audioUrl}
          />
          <span className="flex-1 text-sm text-ink-muted">Sua gravação</span>
          <button
            onClick={deleteAudio}
            className="p-1 text-danger hover:bg-danger/10 rounded-lg"
            title="Excluir gravação"
          >
            <Trash2 size={14} />
          </button>
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
            className="px-3 py-1.5 bg-success text-zinc-950 rounded-lg hover:bg-success/80 disabled:opacity-50 flex items-center gap-1 text-sm"
          >
            {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            Salvar
          </button>
          <button
            onClick={clearRecording}
            className="p-1 text-ink-muted hover:bg-surface-overlay rounded-lg"
          >
            <X size={14} />
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
          className="flex items-center gap-1 px-3 py-1.5 border border-ink/20 rounded-lg hover:bg-surface cursor-pointer text-sm"
        >
          <Upload size={14} />
          Enviar
        </label>

        {!audioBlob && (
          <>
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-1 px-3 py-1.5 bg-danger text-zinc-950 rounded-lg hover:bg-danger/80 text-sm"
              >
                <div className="w-2 h-2 bg-surface-raised rounded-full animate-pulse" />
                Parar ({formatTime(recordingTime)})
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="flex items-center gap-1 px-3 py-1.5 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 text-sm"
              >
                <Mic size={14} />
                Gravar
              </button>
            )}
          </>
        )}
      </div>
    </>
  )
}

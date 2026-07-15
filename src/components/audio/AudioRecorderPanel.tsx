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
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>

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
    </>
  )
}

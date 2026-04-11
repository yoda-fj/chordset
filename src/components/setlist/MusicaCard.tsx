'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Music, X } from 'lucide-react'
import { TemplateMusicaWithMusica, EventoMusicaWithMusica } from '@/types/database'

interface MusicaCardProps {
  musica: TemplateMusicaWithMusica | EventoMusicaWithMusica
  onRemove?: () => void
  onUpdate?: (updates: { tom?: string; observacoes?: string; confirmada?: boolean; responsavel?: string }) => void
  isEvento?: boolean
}

export function MusicaCard({ musica, onRemove, onUpdate, isEvento = false }: MusicaCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: musica.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  const eventoMusica = isEvento ? musica as EventoMusicaWithMusica : null
  const tom = isEvento && eventoMusica?.tom_evento 
    ? eventoMusica.tom_evento 
    : (musica as TemplateMusicaWithMusica).tom_sugerido

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border rounded-lg p-3 md:p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-2 md:gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing touch-none select-none p-2 -m-2"
          style={{ touchAction: 'none' }}
        >
          <GripVertical size={20} />
        </button>

        <div className="flex-1 min-w-0">
          {/* Título e artista */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Music className="text-indigo-500 flex-shrink-0" size={16} />
              <div className="min-w-0">
                <h4 className="font-medium text-gray-900 text-sm md:text-base truncate">{musica.musicas.titulo}</h4>
                <p className="text-xs md:text-sm text-gray-500 truncate">{musica.musicas.artista}</p>
              </div>
            </div>

            {onRemove && (
              <button
                onClick={onRemove}
                className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Controles */}
          <div className="mt-2 md:mt-3 flex flex-wrap items-center gap-2 md:gap-3">
            {/* Tom */}
            <div className="flex items-center gap-1">
              <label className="text-xs font-medium text-gray-500">Tom:</label>
              <select
                value={tom || ''}
                onChange={(e) => onUpdate?.({ tom: e.target.value || undefined })}
                className="text-xs md:text-sm border rounded px-1 md:px-2 py-1 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Orig.</option>
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {isEvento && eventoMusica && (
              <>
              </>
            )}
          </div>

          {/* Observações */}
          <input
            type="text"
            value={musica.observacoes || ''}
            onChange={(e) => onUpdate?.({ observacoes: e.target.value })}
            placeholder="Obs..."
            className="mt-2 w-full text-xs md:text-sm border rounded px-2 py-1 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
    </div>
  )
}

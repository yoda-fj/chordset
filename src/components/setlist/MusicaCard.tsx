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
  }

  const eventoMusica = isEvento ? musica as EventoMusicaWithMusica : null
  const tom = isEvento && eventoMusica?.tom_evento 
    ? eventoMusica.tom_evento 
    : (musica as TemplateMusicaWithMusica).tom_sugerido

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <button
          {...attributes}
          {...listeners}
          className="mt-1 text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={20} />
        </button>

        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2">
              <Music className="text-indigo-500" size={18} />
              <div>
                <h4 className="font-medium text-gray-900">{musica.musicas.titulo}</h4>
                <p className="text-sm text-gray-500">{musica.musicas.artista}</p>
              </div>
            </div>

            {onRemove && (
              <button
                onClick={onRemove}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">Tom:</label>
              <select
                value={tom || ''}
                onChange={(e) => onUpdate?.({ tom: e.target.value || undefined })}
                className="text-sm border rounded px-2 py-1 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Original ({musica.musicas.tom_original || '-'}) - Selecionar</option>
                {['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {isEvento && eventoMusica && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-gray-600">Responsável:</label>
                  <input
                    type="text"
                    value={eventoMusica.responsavel || ''}
                    onChange={(e) => onUpdate?.({ responsavel: e.target.value })}
                    placeholder="Nome"
                    className="text-sm border rounded px-2 py-1 w-24 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eventoMusica.confirmada}
                    onChange={(e) => onUpdate?.({ confirmada: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-600">Confirmada</span>
                </label>
              </>
            )}
          </div>

          <div className="mt-2">
            <input
              type="text"
              value={musica.observacoes || ''}
              onChange={(e) => onUpdate?.({ observacoes: e.target.value })}
              placeholder="Observações..."
              className="w-full text-sm border rounded px-2 py-1 bg-gray-50 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

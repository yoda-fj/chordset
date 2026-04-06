'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, Search } from 'lucide-react'
import { MusicaCard } from './MusicaCard'
import { Musica } from '@/types/database'
import { mockMusicas } from '@/lib/mockData'

interface SetlistBuilderProps {
  musicas: any[]
  onChange: (musicas: any[]) => void
  isEvento?: boolean
  eventoId?: number
  templateId?: number
}

export function SetlistBuilder({
  musicas,
  onChange,
  isEvento = false,
  eventoId,
  templateId,
}: SetlistBuilderProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = musicas.findIndex((m) => m.id === active.id)
      const newIndex = musicas.findIndex((m) => m.id === over.id)
      
      const newMusicas = arrayMove(musicas, oldIndex, newIndex)
      // Atualizar ordem
      const reordered = newMusicas.map((m, idx) => ({ ...m, ordem: idx + 1 }))
      onChange(reordered)
    }
  }

  const handleRemove = (id: string) => {
    const filtered = musicas.filter((m) => m.id !== id)
    const reordered = filtered.map((m, idx) => ({ ...m, ordem: idx + 1 }))
    onChange(reordered)
  }

  const handleUpdate = (id: string, updates: { tom?: string; observacoes?: string; confirmada?: boolean; responsavel?: string }) => {
    const updated = musicas.map((m) => {
      if (m.id !== id) return m
      
      if (isEvento) {
        const em = m as any
        return {
          ...em,
          tom_evento: updates.tom !== undefined ? updates.tom : em.tom_evento,
          observacoes: updates.observacoes !== undefined ? updates.observacoes : em.observacoes,
          confirmada: updates.confirmada !== undefined ? updates.confirmada : em.confirmada,
          responsavel: updates.responsavel !== undefined ? updates.responsavel : em.responsavel,
        }
      } else {
        const tm = m as any
        return {
          ...tm,
          tom_sugerido: updates.tom !== undefined ? updates.tom : tm.tom_sugerido,
          observacoes: updates.observacoes !== undefined ? updates.observacoes : tm.observacoes,
        }
      }
    })
    onChange(updated)
  }

  const handleAddMusica = (musica: Musica) => {
    const newMusica = isEvento
      ? ({
          id: `temp-${Date.now()}`,
          evento_id: eventoId || '',
          musica_id: musica.id,
          ordem: musicas.length + 1,
          tom_evento: null,
          observacoes: null,
          confirmada: false,
          responsavel: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          musicas: musica,
        } as any)
      : ({
          id: `temp-${Date.now()}`,
          template_id: templateId || '',
          musica_id: musica.id,
          ordem: musicas.length + 1,
          tom_sugerido: null,
          observacoes: null,
          created_at: new Date().toISOString(),
          musicas: musica,
        } as any)

    onChange([...musicas, newMusica])
    setShowAddModal(false)
    setSearchTerm('')
  }

  const availableMusicas = mockMusicas.filter(
    (m) => !musicas.some((um) => um.musica_id === m.id)
  )

  const filteredMusicas = availableMusicas.filter(
    (m) =>
      m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.artista.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Músicas ({musicas.length})
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Adicionar Música
        </button>
      </div>

      {musicas.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">Nenhuma música adicionada</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Adicionar primeira música
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={musicas.map((m) => m.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {musicas.map((musica) => (
                <MusicaCard
                  key={musica.id}
                  musica={musica}
                  onRemove={() => handleRemove(musica.id)}
                  onUpdate={(updates) => handleUpdate(musica.id, updates)}
                  isEvento={isEvento}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Adicionar Música</h3>
              <div className="mt-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar música..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {filteredMusicas.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhuma música encontrada</p>
              ) : (
                <div className="space-y-2">
                  {filteredMusicas.map((musica) => (
                    <button
                      key={musica.id}
                      onClick={() => handleAddMusica(musica)}
                      className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="font-medium">{musica.titulo}</div>
                      <div className="text-sm text-gray-500">{musica.artista}</div>
                      <div className="flex gap-1 mt-1">
                        {musica.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-xs px-2 py-0.5 bg-gray-100 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setSearchTerm('')
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

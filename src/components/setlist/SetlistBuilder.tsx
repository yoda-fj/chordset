'use client'

import { useState, useEffect } from 'react'
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
  const [availableMusicas, setAvailableMusicas] = useState<Musica[]>([])
  const [loadingMusicas, setLoadingMusicas] = useState(true)

  useEffect(() => {
    async function fetchMusicas() {
      try {
        const response = await fetch('/api/musicas')
        if (response.ok) {
          const data = await response.json()
          // Parse tags se vier como string JSON
          const parsed = data.map((m: any) => ({
            ...m,
            tags: typeof m.tags === 'string' ? JSON.parse(m.tags) : m.tags || []
          }))
          setAvailableMusicas(parsed)
        }
      } catch (err) {
        console.error('Erro ao buscar músicas:', err)
      } finally {
        setLoadingMusicas(false)
      }
    }
    fetchMusicas()
  }, [])

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
      
      // Salvar nova ordem no banco
      const orderedIds = reordered.map((m) => m.id)
      if (isEvento && eventoId) {
        fetch(`/api/eventos/${eventoId}/musicas/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds }),
        }).catch((err) => console.error('Erro ao reordenar:', err))
      } else if (templateId) {
        fetch(`/api/templates/${templateId}/musicas/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderedIds }),
        }).catch((err) => console.error('Erro ao reordenar:', err))
      }
    }
  }

  const handleRemove = async (id: string) => {
    // Se for um ID numérico (já salvo no banco), chamar DELETE
    if (isEvento && eventoId && !id.toString().startsWith('temp-')) {
      try {
        const response = await fetch(`/api/eventos/${eventoId}/musicas/${id}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          console.error('Erro ao remover música')
          return
        }
      } catch (err) {
        console.error('Erro ao remover música:', err)
        return
      }
    } else if (templateId && !id.toString().startsWith('temp-')) {
      // Para templates, chamar DELETE na API
      try {
        const response = await fetch(`/api/templates/${templateId}/musicas?musica_id=${id}`, {
          method: 'DELETE',
        })
        if (!response.ok) {
          console.error('Erro ao remover música')
          return
        }
      } catch (err) {
        console.error('Erro ao remover música:', err)
        return
      }
    }
    
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

  const handleAddMusica = async (musica: Musica) => {
    // Para eventos, salvar imediatamente no banco
    if (isEvento && eventoId) {
      try {
        const response = await fetch(`/api/eventos/${eventoId}/musicas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            musica_id: musica.id,
            ordem: musicas.length + 1,
          }),
        })
        
        if (response.ok) {
          const savedMusica = await response.json()
          // Buscar dados completos da música
          const musicaData = availableMusicas.find(m => m.id === musica.id) || musica
          onChange([...musicas, { ...savedMusica, musicas: musicaData }])
        } else {
          console.error('Erro ao adicionar música:', await response.text())
          alert('Erro ao adicionar música')
        }
      } catch (err) {
        console.error('Erro ao adicionar música:', err)
        alert('Erro ao adicionar música')
      }
    } else if (templateId) {
      // Para templates, salvar no banco via API
      try {
        const response = await fetch(`/api/templates/${templateId}/musicas`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            musica_id: musica.id,
            ordem: musicas.length + 1,
          }),
        })
        
        if (response.ok) {
          const savedMusica = await response.json()
          const musicaData = availableMusicas.find(m => m.id === musica.id) || musica
          onChange([...musicas, { ...savedMusica, musicas: musicaData }])
        } else {
          console.error('Erro ao adicionar música:', await response.text())
          alert('Erro ao adicionar música')
        }
      } catch (err) {
        console.error('Erro ao adicionar música:', err)
        alert('Erro ao adicionar música')
      }
    } else {
      // Fallback: estado local
      const newMusica = ({
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
    }
    
    setShowAddModal(false)
    setSearchTerm('')
  }

  const filteredAvailableMusicas = availableMusicas.filter(
    (m) => !musicas.some((um) => um.musica_id === m.id)
  )

  const filteredMusicas = filteredAvailableMusicas.filter(
    (m) =>
      m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.artista.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.tags && m.tags.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase())))
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">
          Músicas ({musicas.length})
        </h3>
        <button
          type="button"
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
            type="button"
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
              {loadingMusicas ? (
                <p className="text-center text-gray-500 py-8">Carregando músicas...</p>
              ) : filteredMusicas.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Nenhuma música encontrada</p>
              ) : (
                <div className="space-y-2">
                  {filteredMusicas.map((musica) => (
                    <button
                      key={musica.id}
                      type="button"
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

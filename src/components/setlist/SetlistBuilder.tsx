'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { Plus, Search, Check, Loader2 } from 'lucide-react'
import { MusicaCard, type SetlistMusica } from './MusicaCard'
import { Musica } from '@/types/database'
import { parseTags } from '@/utils/tag-utils'
import {
  SetlistType,
  addMusicaToSetlist,
  addMusicasToSetlist,
  removeMusicaFromSetlist,
  reorderSetlistMusicas,
  updateSetlistMusica,
} from '@/utils/setlist-api'

interface SetlistBuilderProps {
  musicas: SetlistMusica[]
  onChange: (musicas: SetlistMusica[]) => void
  isEvento?: boolean
  eventoId?: number
  templateId?: number
  onError?: (message: string) => void
}

export function SetlistBuilder({
  musicas,
  onChange,
  isEvento = false,
  eventoId,
  templateId,
  onError,
}: SetlistBuilderProps) {
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [availableMusicas, setAvailableMusicas] = useState<Musica[]>([])
  const [loadingMusicas, setLoadingMusicas] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [adding, setAdding] = useState(false)
  const [activeId, setActiveId] = useState<number | string | null>(null)
  const activeMusica = musicas.find((m) => m.id === activeId)

  const setlistType: SetlistType = isEvento ? 'evento' : 'template'
  const setlistId = eventoId || templateId

  const handleError = useCallback((message: string) => {
    console.error(message)
    onError?.(message)
  }, [onError])

  useEffect(() => {
    async function fetchMusicas() {
      try {
        const response = await fetch('/api/musicas')
        if (response.ok) {
          const data = await response.json()
          const parsed = data.map((m: Omit<Musica, 'tags'> & { tags: unknown }) => ({
            ...m,
            tags: parseTags(m.tags),
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
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 0,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = musicas.findIndex((m) => m.id === active.id)
      const newIndex = musicas.findIndex((m) => m.id === over.id)

      const newMusicas = arrayMove(musicas, oldIndex, newIndex)
      const reordered = newMusicas.map((m, idx) => ({ ...m, ordem: idx + 1 }))
      onChange(reordered)

      if (setlistId) {
        const orderedIds = reordered.map((m) => m.id)
        reorderSetlistMusicas(setlistType, setlistId, orderedIds).catch((err) =>
          console.error('Erro ao reordenar:', err)
        )
      }
    }
  }, [musicas, onChange, setlistId, setlistType])

  const handleRemove = useCallback(async (id: number | string) => {
    if (setlistId && !id.toString().startsWith('temp-')) {
      try {
        await removeMusicaFromSetlist(setlistType, setlistId, id)
      } catch (err) {
        console.error('Erro ao remover música:', err)
        return
      }
    }

    const filtered = musicas.filter((m) => m.id !== id)
    const reordered = filtered.map((m, idx) => ({ ...m, ordem: idx + 1 }))
    onChange(reordered)
  }, [musicas, onChange, setlistId, setlistType])

  const handleUpdate = useCallback((
    id: number | string,
    updates: { tom?: string; observacoes?: string; confirmada?: boolean; responsavel?: string }
  ) => {
    const updated = musicas.map((m) => {
      if (m.id !== id) return m

      if (isEvento) {
        return {
          ...m,
          tom_evento: updates.tom !== undefined ? updates.tom : m.tom_evento,
          observacoes: updates.observacoes !== undefined ? updates.observacoes : m.observacoes,
          confirmada: updates.confirmada !== undefined ? updates.confirmada : m.confirmada,
          responsavel: updates.responsavel !== undefined ? updates.responsavel : m.responsavel,
        }
      } else {
        return {
          ...m,
          tom_sugerido: updates.tom !== undefined ? updates.tom : m.tom_sugerido,
          observacoes: updates.observacoes !== undefined ? updates.observacoes : m.observacoes,
        }
      }
    })
    onChange(updated)

    if (setlistId && !id.toString().startsWith('temp-')) {
      updateSetlistMusica(setlistType, setlistId, id, {
        tom: updates.tom,
        observacoes: updates.observacoes,
        confirmada: updates.confirmada,
        responsavel: updates.responsavel,
      }).catch((err) => console.error('Erro ao salvar música:', err))
    }
  }, [musicas, onChange, isEvento, setlistId, setlistType])

  const toggleMusicaSelection = useCallback((musicaId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(musicaId)) {
        next.delete(musicaId)
      } else {
        next.add(musicaId)
      }
      return next
    })
  }, [])

  const closeAddModal = useCallback(() => {
    setShowAddModal(false)
    setSearchTerm('')
    setSelectedIds(new Set())
  }, [])

  // Escape fecha o modal e descarta a seleção
  useEffect(() => {
    if (!showAddModal) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAddModal()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showAddModal, closeAddModal])

  const filteredAvailableMusicas = useMemo(() =>
    availableMusicas.filter((m) => !musicas.some((um) => um.musica_id === m.id)),
    [availableMusicas, musicas]
  )

  const filteredMusicas = useMemo(() =>
    filteredAvailableMusicas.filter(
      (m) =>
        m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.artista.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.tags && m.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())))
    ),
    [filteredAvailableMusicas, searchTerm]
  )

  const handleConfirmAdd = useCallback(async () => {
    if (selectedIds.size === 0 || adding) return

    const selectedMusicas = availableMusicas.filter((m) => selectedIds.has(m.id))
    const startOrdem = musicas.length + 1
    setAdding(true)

    try {
      if (eventoId) {
        const salvas = await addMusicasToSetlist(
          eventoId,
          selectedMusicas.map((m) => m.id)
        )
        const novas: SetlistMusica[] = salvas.map((sm) => ({
          ...sm,
          musicas: availableMusicas.find((m) => m.id === sm.musica_id)
            || selectedMusicas.find((m) => m.id === sm.musica_id)!,
        }))
        onChange([...musicas, ...novas])
      } else if (templateId) {
        // Template não tem endpoint em lote: adiciona uma a uma, preservando a ordem
        const novas: SetlistMusica[] = []
        for (const [index, musica] of selectedMusicas.entries()) {
          const salva = await addMusicaToSetlist('template', templateId, musica.id, startOrdem + index)
          novas.push({ ...salva, musicas: musica })
        }
        onChange([...musicas, ...novas])
      } else {
        const novas: SetlistMusica[] = selectedMusicas.map((musica, index) => ({
          id: `temp-${Date.now()}-${index}`,
          template_id: templateId || '',
          musica_id: musica.id,
          ordem: startOrdem + index,
          ...(isEvento ? { tom_evento: null } : { tom_sugerido: null }),
          observacoes: null,
          created_at: new Date().toISOString(),
          musicas: musica,
        }))
        onChange([...musicas, ...novas])
      }
    } catch (err) {
      console.error('Erro ao adicionar músicas:', err)
      handleError('Erro ao adicionar músicas')
      setAdding(false)
      return
    }

    setAdding(false)

    // Mantém o modal aberto para novas adições; fecha se nada mais sobrar
    const restantes = filteredAvailableMusicas.filter((m) => !selectedIds.has(m.id)).length
    if (restantes === 0) {
      closeAddModal()
    } else {
      setSelectedIds(new Set())
    }
  }, [selectedIds, adding, availableMusicas, musicas, eventoId, templateId, isEvento, onChange, handleError, filteredAvailableMusicas, closeAddModal])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-ink">
          Músicas ({musicas.length})
        </h3>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-on-accent rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus size={18} />
          Adicionar Músicas
        </button>
      </div>

      {musicas.length === 0 ? (
        <div className="text-center py-12 bg-surface rounded-lg border-2 border-dashed">
          <p className="text-ink-muted">Nenhuma música adicionada</p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="mt-2 text-brand hover:text-brand-600 font-medium"
          >
            Adicionar primeira música
          </button>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={({ active }) => setActiveId(active.id)}
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
          <DragOverlay>
            {activeMusica && (
              <div className="opacity-80">
                <MusicaCard
                  musica={activeMusica}
                  isEvento={isEvento}
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-raised rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b">
              <h3 className="text-lg font-medium">Adicionar Músicas</h3>
              <div className="mt-2 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar música..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {loadingMusicas ? (
                <p className="text-center text-ink-muted py-8">Carregando músicas...</p>
              ) : filteredMusicas.length === 0 ? (
                <p className="text-center text-ink-muted py-8">Nenhuma música encontrada</p>
              ) : (
                <div className="space-y-2">
                  {filteredMusicas.map((musica) => {
                    const isSelected = selectedIds.has(musica.id)
                    return (
                      <button
                        key={musica.id}
                        type="button"
                        onClick={() => toggleMusicaSelection(musica.id)}
                        aria-pressed={isSelected}
                        className={`w-full text-left p-3 border rounded-lg transition-colors flex items-start gap-3 ${
                          isSelected ? 'border-brand bg-brand/10' : 'hover:bg-surface'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-brand border-brand text-on-accent' : 'border-ink/20'
                          }`}
                        >
                          {isSelected && <Check size={14} />}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{musica.titulo}</div>
                          <div className="text-sm text-ink-muted">{musica.artista}</div>
                          <div className="flex gap-1 mt-1">
                            {musica.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-xs px-2 py-0.5 bg-surface-overlay rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t flex items-center justify-between gap-3">
              <span className="text-sm text-ink-muted">
                {selectedIds.size > 0 && `${selectedIds.size} selecionada(s)`}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeAddModal}
                  className="px-4 py-2 text-ink-muted hover:text-ink"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdd}
                  disabled={selectedIds.size === 0 || adding}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-on-accent rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
                >
                  {adding ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                  Adicionar {selectedIds.size} música(s) selecionada(s)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

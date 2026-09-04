'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Loader2, Edit, Calendar, Clock, MapPin, Music, Play, Copy } from 'lucide-react'
import Link from 'next/link'
import { useToast } from '@/components/ui/Toast'
import type { EventoWithTemplate, EventoMusicaWithMusica } from '@/types/database'

const STATUS_LABELS: Record<string, string> = {
  rascunho: 'Rascunho',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  rascunho: 'bg-surface-overlay text-ink',
  confirmado: 'bg-brand/15 text-brand-600',
  realizado: 'bg-success/15 text-success',
  cancelado: 'bg-danger/15 text-danger',
}

export default function EventoPage() {
  const params = useParams()
  const { showToast } = useToast()
  const eventoId = parseInt(params.id as string)

  const [evento, setEvento] = useState<EventoWithTemplate | null>(null)
  const [musicas, setMusicas] = useState<EventoMusicaWithMusica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [cloneNome, setCloneNome] = useState('')
  const [cloneData, setCloneData] = useState('')
  const [cloneLoading, setCloneLoading] = useState(false)

  const handleClone = async () => {
    if (!cloneNome.trim()) return
    setCloneLoading(true)
    try {
      const res = await fetch(`/api/eventos/${eventoId}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome: cloneNome, data: cloneData || undefined }),
      })
      const data = await res.json()
      if (res.ok) {
        window.location.href = `/eventos/${data.evento.id}`
      } else {
        showToast(data.error || 'Erro ao clonar', 'error')
      }
    } catch {
      showToast('Erro ao clonar evento', 'error')
    } finally {
      setCloneLoading(false)
    }
  }
  
  useEffect(() => {
    async function fetchData() {
      try {
        const [eventoRes, musicasRes] = await Promise.all([
          fetch(`/api/eventos/${eventoId}`),
          fetch(`/api/eventos/${eventoId}/musicas`)
        ])

        if (!eventoRes.ok) throw new Error('Evento não encontrado')

        const eventoData = await eventoRes.json()
        setEvento(eventoData)

        if (musicasRes.ok) {
          const musicasData = await musicasRes.json()
          setMusicas(musicasData)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [eventoId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    )
  }

  if (error || !evento) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Evento não encontrado'}</p>
        <Link href="/eventos" className="text-brand hover:text-brand-600 font-medium">
          Voltar para Eventos
        </Link>
      </div>
    )
  }

  // Study list: data é null
  const isStudyList = !evento.data

  // Formatar data (só se não for study list)
  const dataFormatada = isStudyList ? null : new Date(evento.data + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/eventos"
          className="inline-flex items-center gap-2 text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
        <div className="flex gap-2">
          {musicas.length > 0 && (
            <Link
              href={`/eventos/${eventoId}/setlist`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-success text-zinc-950 rounded-lg hover:bg-success/80 transition-colors"
            >
              <Play size={18} />
              <span className="hidden sm:inline">Ao Vivo</span>
            </Link>
          )}
          <Link
            href={`/eventos/${eventoId}/editar`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 transition-colors"
          >
            <Edit size={18} />
            Editar
          </Link>
          <button
            onClick={() => setShowCloneModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface-overlay text-ink rounded-lg hover:bg-surface-overlay transition-colors"
          >
            <Copy size={18} />
            Clonar
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-surface-raised p-6 rounded-lg border">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-2xl font-bold text-ink">{evento.nome}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[evento.status] || 'bg-surface-overlay text-ink'}`}>
            {STATUS_LABELS[evento.status] || evento.status}
          </span>
        </div>

        {!isStudyList && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-ink-muted">
              <Calendar size={18} />
              <span>{dataFormatada}</span>
            </div>
            {evento.hora && (
              <div className="flex items-center gap-2 text-ink-muted">
                <Clock size={18} />
                <span>{evento.hora}</span>
              </div>
            )}
            {evento.local && (
              <div className="flex items-center gap-2 text-ink-muted">
                <MapPin size={18} />
                <span>{evento.local}</span>
              </div>
            )}
          </div>
        )}

        {evento.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {evento.tags.map((tag: string) => (
              <span key={tag} className="px-2 py-1 bg-surface-overlay text-ink-muted rounded text-sm">
                {tag}
              </span>
            ))}
          </div>
        )}

        {evento.observacoes && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-ink-muted whitespace-pre-wrap">{evento.observacoes}</p>
          </div>
        )}
      </div>

      {/* Repertório */}
      <div className="bg-surface-raised p-6 rounded-lg border">
        <div className="flex items-center gap-2 mb-4">
          <Music size={20} className="text-brand" />
          <h2 className="text-lg font-semibold text-ink">
            Repertório ({musicas.length})
          </h2>
        </div>

        {musicas.length === 0 ? (
          <p className="text-ink-muted text-center py-8">Nenhuma música no repertório</p>
        ) : (
          <div className="space-y-3">
            {musicas.map((item, index) => (
              <Link
                key={item.id}
                href={`/musicas/${item.musicas?.id}/cifra`}
                className="flex items-center gap-4 p-3 border rounded-lg hover:bg-surface transition-colors"
              >
                <span className="text-ink-faint font-medium w-6">{index + 1}.</span>
                <div className="flex-1">
                  <div className="font-medium text-ink">{item.musicas?.titulo}</div>
                  <div className="text-sm text-ink-muted">{item.musicas?.artista}</div>
                </div>
                {item.tom_evento && (
                  <span className="text-sm text-ink-muted">Tom: {item.tom_evento}</span>
                )}
                {item.responsavel && (
                  <span className="text-sm text-ink-muted">Resp: {item.responsavel}</span>
                )}
                {item.confirmada && (
                  <span className="px-2 py-1 bg-success/15 text-success rounded text-xs">OK</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
      
      {/* Clone Modal */}
      {showCloneModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-raised rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold mb-4">Clonar Evento</h3>
            <p className="text-ink-muted mb-4">Copiar &quot;{evento.nome}&quot; com todas as músicas?</p>
            <input
              type="text"
              value={cloneNome}
              onChange={(e) => setCloneNome(e.target.value)}
              placeholder="Nome do novo evento"
              className="w-full px-4 py-2 border rounded-lg mb-3"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleClone()}
            />
            <input
              type="date"
              value={cloneData}
              onChange={(e) => setCloneData(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
              onKeyDown={(e) => e.key === 'Enter' && handleClone()}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCloneModal(false)}
                className="px-4 py-2 text-ink-muted hover:bg-surface-overlay rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleClone}
                disabled={!cloneNome.trim() || cloneLoading}
                className="px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 disabled:opacity-50"
              >
                {cloneLoading ? 'Clonando...' : 'Clonar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

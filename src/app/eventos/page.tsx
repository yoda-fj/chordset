'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Plus, Search, Calendar, MapPin } from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import type { EventoWithTemplate } from '@/types/database'
import { EVENTO_STATUS_LABELS, EVENTO_STATUS_BADGE_CLASSES } from '@/types/database'

export default function EventosPage() {
  const [eventos, setEventos] = useState<EventoWithTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('')

  useEffect(() => {
    async function fetchEventos() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/eventos')
        if (!response.ok) {
          throw new Error('Erro ao carregar eventos')
        }
        const data = await response.json()
        setEventos(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchEventos()
  }, [])

  const filteredEventos = useMemo(() => {
    return eventos.filter((evento) => {
      const matchesSearch = !searchTerm || 
        evento.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evento.local?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = !statusFilter || evento.status === statusFilter
      const matchesDate = !dateFilter || evento.data === dateFilter
      return matchesSearch && matchesStatus && matchesDate
    })
  }, [eventos, searchTerm, statusFilter, dateFilter])

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-11 w-full mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Eventos</h1>
        <Link
          href="/eventos/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus size={18} />
          Novo Evento
        </Link>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={20} />
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
          />
        </div>
        <select 
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="confirmado">Confirmado</option>
          <option value="realizado">Realizado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <input
          type="date"
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />
        {(searchTerm || statusFilter || dateFilter) && (
          <button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('')
              setDateFilter('')
            }}
            className="px-4 py-2 text-ink-muted hover:text-ink"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filteredEventos.map((evento, i) => (
          <motion.div
            key={evento.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.3 }}
            whileTap={{ scale: 0.99 }}
          >
            <Link
              href={`/eventos/${evento.id}`}
              className="block bg-surface-raised border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-ink">
                    {evento.nome}
                  </h3>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      EVENTO_STATUS_BADGE_CLASSES[evento.status]
                    }`}
                  >
                    {EVENTO_STATUS_LABELS[evento.status]}
                  </span>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-ink-muted">
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    {evento.data
                      ? new Date(evento.data).toLocaleDateString('pt-BR')
                      : 'Lista de estudo'}
                    {evento.hora && ` às ${evento.hora.slice(0, 5)}`}
                  </span>
                  {evento.local && (
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {evento.local}
                    </span>
                  )}
                  {evento.templates && (
                    <span className="text-brand">
                      Template: {evento.templates.nome}
                    </span>
                  )}
                  <Link
                    href={`/eventos/${evento.id}`}
                    className="text-brand hover:text-brand-600 font-medium"
                  >
                    Editar
                  </Link>
                </div>

                {evento.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {evento.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-surface-overlay text-ink-muted rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
          </motion.div>
        ))}
      </div>

      {filteredEventos.length === 0 && (
        <EmptyState
          icon={<Calendar />}
          title={
            searchTerm || statusFilter || dateFilter
              ? 'Nenhum evento encontrado com esses filtros'
              : 'Nenhum evento cadastrado'
          }
          description="Crie um evento para montar a setlist do próximo show."
          action={{ label: 'Novo Evento', href: '/eventos/new' }}
        />
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Calendar, MapPin, Loader2 } from 'lucide-react'
import type { EventoWithTemplate } from '@/lib/eventos-db'
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
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Eventos</h1>
        <Link
          href="/eventos/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} />
          Novo Evento
        </Link>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar eventos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select 
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
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
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
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
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="space-y-4">
        {filteredEventos.map((evento) => (
          <Link
            key={evento.id}
            href={`/eventos/${evento.id}`}
            className="block bg-white border rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
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

                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={16} />
                    {new Date(evento.data).toLocaleDateString('pt-BR')}
                    {evento.hora && ` às ${evento.hora.slice(0, 5)}`}
                  </span>
                  {evento.local && (
                    <span className="flex items-center gap-1">
                      <MapPin size={16} />
                      {evento.local}
                    </span>
                  )}
                  {evento.templates && (
                    <span className="text-indigo-600">
                      Template: {evento.templates.nome}
                    </span>
                  )}
                  <Link
                    href={`/eventos/${evento.id}`}
                    className="text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Editar
                  </Link>
                </div>

                {evento.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {evento.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredEventos.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter || dateFilter
              ? 'Nenhum evento encontrado com esses filtros'
              : 'Nenhum evento encontrado'}
          </p>
          <Link
            href="/eventos/new"
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Criar primeiro evento
          </Link>
        </div>
      )}
    </div>
  )
}

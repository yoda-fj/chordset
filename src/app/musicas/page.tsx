'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, Tag, Music, FileText, Loader2 } from 'lucide-react'
import type { Musica } from '@/types/database'

export default function MusicasPage() {
  const [musicas, setMusicas] = useState<Musica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState('')

  // Fetch músicas do backend
  useEffect(() => {
    async function fetchMusicas() {
      try {
        setLoading(true)
        setError(null)
        const response = await fetch('/api/musicas')
        if (!response.ok) {
          throw new Error('Erro ao carregar músicas')
        }
        const data = await response.json()
        setMusicas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchMusicas()
  }, [])

  // Extrair todas as tags únicas das músicas
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    musicas.forEach((musica) => {
      musica.tags.forEach((tag) => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [musicas])

  // Filtrar músicas
  const filteredMusicas = useMemo(() => {
    return musicas.filter((musica) => {
      const matchesSearch = 
        musica.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        musica.artista.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTag = !selectedTag || musica.tags.includes(selectedTag)
      return matchesSearch && matchesTag
    })
  }, [musicas, searchTerm, selectedTag])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-brand hover:text-brand-600 font-medium"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-ink">Músicas</h1>
        <Link
          href="/musicas/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus size={18} />
          Nova Música
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={20} />
          <input
            type="text"
            placeholder="Buscar por título ou artista..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-muted">Filtrar por tag:</span>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-brand"
            >
              <option value="">Todas as tags</option>
              {allTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            {selectedTag && (
              <button
                onClick={() => setSelectedTag('')}
                className="text-sm text-brand hover:text-brand-600"
              >
                Limpar
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grid de músicas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMusicas.map((musica) => (
          <div
            key={musica.id}
            className="block p-6 bg-surface-raised border rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Music size={18} className="text-brand" />
                <Link href={`/musicas/${musica.id}/cifra`} className="text-lg font-medium text-ink hover:text-brand">
                  {musica.titulo}
                </Link>
              </div>
              {musica.tom_original && (
                <span className="inline-flex items-center px-2 py-0.5 bg-brand/15 text-brand-600 text-xs font-medium rounded-full">
                  {musica.tom_original}
                </span>
              )}
            </div>

            <p className="text-sm text-ink-muted mb-3">
              {musica.artista}
            </p>

            <div className="flex flex-wrap gap-1 mb-3">
              {musica.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-surface-overlay text-ink-muted rounded-full"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t flex items-center gap-3">
              {musica.cifra && (
                <Link
                  href={`/musicas/${musica.id}/cifra`}
                  className="inline-flex items-center gap-2 text-sm text-brand hover:text-brand-600 font-medium"
                >
                  <FileText size={16} />
                  Ver Cifra
                </Link>
              )}
              <Link
                href={`/musicas/${musica.id}/edit`}
                className="inline-flex items-center gap-2 text-sm text-ink-muted hover:text-ink font-medium"
              >
                Editar
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredMusicas.length === 0 && (
        <div className="text-center py-12 bg-surface rounded-lg">
          <Music className="mx-auto h-12 w-12 text-ink-faint mb-4" />
          <p className="text-ink-muted mb-4">
            {searchTerm || selectedTag
              ? 'Nenhuma música encontrada com esses filtros'
              : 'Nenhuma música cadastrada'}
          </p>
          <Link
            href="/musicas/new"
            className="text-brand hover:text-brand-600 font-medium"
          >
            Cadastrar primeira música
          </Link>
        </div>
      )}
    </div>
  )
}

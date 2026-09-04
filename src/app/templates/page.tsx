'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Tag, Loader2 } from 'lucide-react'
import { parseTags } from '@/utils/tag-utils'
import type { Template } from '@/types/database'

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch('/api/templates')
        if (!response.ok) throw new Error('Erro ao carregar templates')
        const data = await response.json()
        // Parse tags se vier como string
        setTemplates(data.map((t: Template) => ({
          ...t,
          tags: parseTags(t.tags)
        })))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchTemplates()
  }, [])

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = 
      template.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesTag = !searchTerm || template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch || matchesTag
  })

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
        <h1 className="text-2xl font-bold text-ink">Templates</h1>
        <Link
          href="/templates/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus size={18} />
          Novo Template
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Link
            key={template.id}
            href={`/templates/${template.id}`}
            className="block p-6 bg-surface-raised border rounded-lg hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-medium text-ink mb-2">
              {template.nome}
            </h3>
            {template.descricao && (
              <p className="text-sm text-ink-muted mb-3 line-clamp-2">
                {template.descricao}
              </p>
            )}
            <div className="flex flex-wrap gap-1">
              {template.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-surface-overlay text-ink-muted rounded-full"
                >
                  <Tag size={12} />
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-surface rounded-lg">
          <p className="text-ink-muted mb-4">
            {searchTerm ? 'Nenhum template encontrado' : 'Nenhum template encontrado'}
          </p>
          <Link
            href="/templates/new"
            className="text-brand hover:text-brand-600 font-medium"
          >
            Criar primeiro template
          </Link>
        </div>
      )}
    </div>
  )
}

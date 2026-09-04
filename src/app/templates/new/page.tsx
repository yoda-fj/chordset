'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { TagInput } from '@/components/setlist/TagInput'
import { SetlistBuilder } from '@/components/setlist/SetlistBuilder'
import { useToast } from '@/components/ui/Toast'
import type { SetlistMusica } from '@/components/setlist/MusicaCard'
import { TAG_SUGGESTIONS_TEMPLATE } from '@/lib/constants'

export default function NewTemplatePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [musicas, setMusicas] = useState<SetlistMusica[]>([])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || saving) return

    setSaving(true)

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          tags,
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar template')
      }

      router.push('/templates')
    } catch (err) {
      console.error('Erro:', err)
      showToast('Erro ao criar template', 'error')
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={18} />
          Voltar para Templates
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-ink mb-6">Novo Template</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-surface-raised p-6 rounded-lg border space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
              placeholder="Ex: Culto Domingo Manhã"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
              placeholder="Descrição opcional do template..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Tags
            </label>
            <TagInput
              tags={tags}
              onChange={setTags}
              suggestions={TAG_SUGGESTIONS_TEMPLATE}
              placeholder="Adicionar tag..."
            />
          </div>
        </div>

        <div className="bg-surface-raised p-6 rounded-lg border">
          <SetlistBuilder
            musicas={musicas}
            onChange={setMusicas}
            isEvento={false}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/templates"
            className="px-4 py-2 text-ink-muted hover:text-ink"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !nome.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Template'}
          </button>
        </div>
      </form>
    </div>
  )
}

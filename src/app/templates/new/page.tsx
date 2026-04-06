'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { TagInput } from '@/components/setlist/TagInput'
import { SetlistBuilder } from '@/components/setlist/SetlistBuilder'
import { Template, TemplateMusicaWithMusica } from '@/types/database'

const TAG_SUGGESTIONS = ['culto', 'domingo', 'quarta', 'sabado', 'evento', 'especial', 'louvor', 'adoracao', 'jovens', 'criancas']

export default function NewTemplatePage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [musicas, setMusicas] = useState<TemplateMusicaWithMusica[]>([])
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    setSaving(true)
    // Mock save - substituir por chamada real ao Supabase
    console.log('Salvando template:', { nome, descricao, tags, musicas })
    await new Promise((resolve) => setTimeout(resolve, 500))
    router.push('/templates')
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/templates"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Voltar para Templates
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Template</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white p-6 rounded-lg border space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Culto Domingo Manhã"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Descrição opcional do template..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <TagInput
              tags={tags}
              onChange={setTags}
              suggestions={TAG_SUGGESTIONS}
              placeholder="Adicionar tag..."
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <SetlistBuilder
            musicas={musicas}
            onChange={setMusicas}
            isEvento={false}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/templates"
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !nome.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar Template'}
          </button>
        </div>
      </form>
    </div>
  )
}

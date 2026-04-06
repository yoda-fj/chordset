'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { TagInput } from '@/components/setlist/TagInput'
import { SetlistBuilder } from '@/components/setlist/SetlistBuilder'
import { Template, TemplateMusicaWithMusica } from '@/types/database'
import { mockTemplates, mockTemplateMusicas } from '@/lib/mockData'

const TAG_SUGGESTIONS = ['culto', 'domingo', 'quarta', 'sabado', 'evento', 'especial', 'louvor', 'adoracao', 'jovens', 'criancas']

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = parseInt(params.id as string)

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [musicas, setMusicas] = useState<TemplateMusicaWithMusica[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock load - substituir por chamada real ao Supabase
    const template = mockTemplates.find((t) => t.id === templateId)
    if (template) {
      setNome(template.nome)
      setDescricao(template.descricao || '')
      setTags(template.tags)
    }
    
    const templateMusicas = mockTemplateMusicas.filter((tm) => tm.template_id === templateId)
    setMusicas(templateMusicas)
    setLoading(false)
  }, [templateId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    setSaving(true)
    // Mock save
    console.log('Atualizando template:', { templateId, nome, descricao, tags, musicas })
    await new Promise((resolve) => setTimeout(resolve, 500))
    router.push('/templates')
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return
    
    // Mock delete
    console.log('Excluindo template:', templateId)
    router.push('/templates')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
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

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Template</h1>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 size={18} />
          Excluir
        </button>
      </div>

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
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border">
          <SetlistBuilder
            musicas={musicas}
            onChange={setMusicas}
            isEvento={false}
            templateId={templateId}
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
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Trash2, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { TagInput } from '@/components/setlist/TagInput'
import { SetlistBuilder } from '@/components/setlist/SetlistBuilder'

const TAG_SUGGESTIONS = ['culto', 'domingo', 'quarta', 'sabado', 'evento', 'especial', 'louvor', 'adoracao', 'jovens', 'criancas']

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = parseInt(params.id as string)

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [musicas, setMusicas] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const [templateRes, musicasRes] = await Promise.all([
          fetch(`/api/templates/${templateId}`),
          fetch(`/api/templates/${templateId}/musicas`)
        ])
        
        if (!templateRes.ok) throw new Error('Template não encontrado')
        
        const templateData = await templateRes.json()
        setNome(templateData.nome || '')
        setDescricao(templateData.descricao || '')
        setTags(typeof templateData.tags === 'string' ? JSON.parse(templateData.tags) : templateData.tags || [])
        
        if (musicasRes.ok) {
          const musicasData = await musicasRes.json()
          setMusicas(musicasData)
        }
        
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar')
        setLoading(false)
      }
    }
    
    if (templateId) {
      fetchTemplate()
    }
  }, [templateId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          descricao: descricao.trim() || null,
          tags,
        }),
      })

      if (!response.ok) throw new Error('Erro ao atualizar')
      
      router.push('/templates')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return
    
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) throw new Error('Erro ao excluir')
      
      router.push('/templates')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error && !nome) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link href="/templates" className="text-indigo-600 hover:text-indigo-700">
          Voltar para Templates
        </Link>
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

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

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
            {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  )
}

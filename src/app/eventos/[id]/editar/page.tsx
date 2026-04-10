'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Trash2, FileText, X } from 'lucide-react'
import Link from 'next/link'
import { TagInput } from '@/components/setlist/TagInput'
import { SetlistBuilder } from '@/components/setlist/SetlistBuilder'
import type { EventoWithTemplate } from '@/lib/eventos-db'

const STATUS_OPCOES = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'cancelado', label: 'Cancelado' },
]

const TAG_SUGGESTIONS = ['culto', 'evento', 'casamento', 'formatura', 'natal', 'páscoa', 'especial']

export default function EditEventoPage() {
  const router = useRouter()
  const params = useParams()
  const eventoId = parseInt(params.id as string)

  const [evento, setEvento] = useState<EventoWithTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [local, setLocal] = useState('')
  const [status, setStatus] = useState('rascunho')
  const [tags, setTags] = useState<string[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [eventoMusicas, setEventoMusicas] = useState<any[]>([])
  const [showImportModal, setShowImportModal] = useState(false)
  const [templates, setTemplates] = useState<any[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    async function fetchEvento() {
      try {
        setLoading(true)
        const response = await fetch(`/api/eventos/${eventoId}`)
        if (!response.ok) {
          throw new Error('Erro ao carregar evento')
        }
        const data = await response.json()
        setEvento(data)
        setNome(data.nome)
        setData(data.data)
        setHora(data.hora || '')
        setLocal(data.local || '')
        setStatus(data.status)
        setTags(data.tags)
        setObservacoes(data.observacoes || '')
        fetchMusicasDoEvento(data.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchEvento()
  }, [eventoId])

  async function loadTemplates() {
    setLoadingTemplates(true)
    try {
      const response = await fetch('/api/templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (err) {
      console.error('Erro ao carregar templates:', err)
    } finally {
      setLoadingTemplates(false)
    }
  }

  async function fetchMusicasDoEvento(evId: number) {
    try {
      const res = await fetch(`/api/eventos/${evId}/musicas`)
      if (res.ok) {
        const data = await res.json()
        setEventoMusicas(data)
      }
    } catch (err) {
      console.error('Erro ao buscar musicas do evento:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || !data) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/eventos/${eventoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          data,
          hora: hora || undefined,
          local: local.trim() || undefined,
          status,
          tags,
          observacoes: observacoes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar evento')
      }

      router.push(`/eventos/${eventoId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar evento')
      setSaving(false)
    }
  }

  const handleImportTemplate = async (templateId: number) => {
    setImporting(true)
    try {
      const response = await fetch(`/api/eventos/${eventoId}/importar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId }),
      })
      
      if (response.ok) {
        await fetchMusicasDoEvento(eventoId)
        setShowImportModal(false)
      } else {
        const data = await response.json()
        alert(data.error || 'Erro ao importar do template')
      }
    } catch (err) {
      console.error('Erro ao importar:', err)
      alert('Erro ao importar músicas do template')
    } finally {
      setImporting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este evento?')) return

    try {
      const response = await fetch(`/api/eventos/${eventoId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir evento')
      }

      router.push('/eventos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir evento')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error && !evento) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          href="/eventos"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Voltar para Eventos
        </Link>
      </div>
    )
  }

  const isValid = nome.trim() && data

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={`/eventos/${eventoId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
          Excluir
        </button>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Editar Evento</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Dados do Evento */}
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome do Evento *
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Culto de Domingo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data *
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Hora
            </label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Local
            </label>
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Igreja Principal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {STATUS_OPCOES.map((opcao) => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
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

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Observações adicionais..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Link
            href={`/eventos/${eventoId}`}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !isValid}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>

      {/* Repertório do Evento */}
      <div className="bg-white p-4 md:p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Repertório</h2>
          <button
            type="button"
            onClick={() => {
              setShowImportModal(true)
              loadTemplates()
            }}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FileText size={16} />
            Importar do Template
          </button>
        </div>
        <SetlistBuilder
          musicas={eventoMusicas}
          onChange={setEventoMusicas}
          isEvento={true}
          eventoId={eventoId}
        />
      </div>

      {/* Modal de Importar do Template */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">Importar do Template</h3>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              {loadingTemplates ? (
                <p className="text-center py-4 text-gray-500">Carregando templates...</p>
              ) : templates.length === 0 ? (
                <p className="text-center py-4 text-gray-500">Nenhum template encontrado</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-auto">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleImportTemplate(template.id)}
                      disabled={importing}
                      className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      <div className="font-medium">{template.nome}</div>
                      <div className="text-sm text-gray-500">
                        {template.descricao || 'Sem descrição'}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

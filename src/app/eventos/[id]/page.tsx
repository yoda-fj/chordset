'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { TagInput } from '@/components/setlist/TagInput'
import type { EventoWithTemplate } from '@/lib/eventos-db'

const STATUS_OPCOES = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'cancelado', label: 'Cancelado' },
]

const TAG_SUGGESTIONS = ['culto', 'evento', 'casamento', 'formatura', 'natal', 'páscoa', 'especial']

interface EditEventoPageProps {
  params: Promise<{ id: string }>
}

export default function EditEventoPage({ params }: EditEventoPageProps) {
  const router = useRouter()
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
  const [eventoId, setEventoId] = useState<number | null>(null)

  useEffect(() => {
    async function loadParams() {
      const { id } = await params
      setEventoId(parseInt(id))
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!eventoId) return

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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchEvento()
  }, [eventoId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventoId || !nome.trim() || !data) return

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

      router.push('/eventos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar evento')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!eventoId || !confirm('Tem certeza que deseja excluir este evento?')) return

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
    <div>
      <div className="mb-6">
        <Link
          href="/eventos"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Voltar para Eventos
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Evento</h1>
        <button
          onClick={handleDelete}
          className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
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

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg border space-y-6">
          <div>
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

          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Observações adicionais sobre o evento..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Link
            href="/eventos"
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
              <>
                <Loader2 size={18} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

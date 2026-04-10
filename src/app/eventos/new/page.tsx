'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { TagInput } from '@/components/setlist/TagInput'

const STATUS_OPCOES = [
  { value: 'rascunho', label: 'Rascunho' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'cancelado', label: 'Cancelado' },
]

const TAG_SUGGESTIONS = ['culto', 'evento', 'casamento', 'formatura', 'natal', 'páscoa', 'especial', 'estudo']

export default function NewEventoPage() {
  const router = useRouter()
  const [nome, setNome] = useState('')
  const [data, setData] = useState('')
  const [hora, setHora] = useState('')
  const [local, setLocal] = useState('')
  const [status, setStatus] = useState('rascunho')
  const [isStudyList, setIsStudyList] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [observacoes, setObservacoes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim() || (!isStudyList && !data)) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/eventos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome: nome.trim(),
          data: isStudyList ? undefined : data,
          hora: hora || undefined,
          local: isStudyList ? undefined : (local.trim() || undefined),
          status: isStudyList ? undefined : status,
          tags: isStudyList ? undefined : tags,
          observacoes: observacoes.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao criar evento')
      }

      router.push('/eventos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento')
      setSaving(false)
    }
  }

  const isValid = nome.trim() && (isStudyList || data)

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

      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isStudyList ? 'Nova Lista de Estudo' : 'Novo Evento'}
      </h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg border space-y-6">
          {/* Study List Toggle */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border">
            <input
              type="checkbox"
              id="isStudyList"
              checked={isStudyList}
              onChange={(e) => setIsStudyList(e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded border-gray-300"
            />
            <label htmlFor="isStudyList" className="text-sm text-gray-600 cursor-pointer">
              É uma lista de estudo (sem data, local ou status)
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isStudyList ? 'Nome da Lista *' : 'Nome do Evento *'}
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder={isStudyList ? 'Ex: Estudos para guitarra' : 'Ex: Culto de Domingo'}
            />
          </div>

          {/* Only show date/hora if NOT study list */}
          {!isStudyList && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data
                </label>
                <input
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
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
          )}

          {/* Only show local if NOT study list */}
          {!isStudyList && (
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
          )}

          {/* Only show status if NOT study list */}
          {!isStudyList && (
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
          )}

          {/* Only show tags if NOT study list */}
          {!isStudyList && (
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
          )}

          <div>
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
                Criando...
              </>
            ) : (
              <>
                <Save size={18} />
                {isStudyList ? 'Criar Lista de Estudo' : 'Criar Evento'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

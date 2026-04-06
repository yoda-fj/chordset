'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { TagInput } from '@/components/setlist/TagInput'
import type { Musica } from '@/lib/musicas-db'

const TOM_OPCOES = ['C', 'Cm', 'D', 'Dm', 'E', 'Em', 'F', 'Fm', 'G', 'Gm', 'A', 'Am', 'B', 'Bm']

const TAG_SUGGESTIONS = ['louvor', 'adoracao', 'hino', 'clássico', 'contemporâneo', 'rock', 'gospel', 'natal', 'páscoa']

interface EditMusicaPageProps {
  params: Promise<{ id: string }>
}

export default function EditMusicaPage({ params }: EditMusicaPageProps) {
  const router = useRouter()
  const [musica, setMusica] = useState<Musica | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [artista, setArtista] = useState('')
  const [tomOriginal, setTomOriginal] = useState('')
  const [cifra, setCifra] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [musicaId, setMusicaId] = useState<number | null>(null)

  useEffect(() => {
    async function loadParams() {
      const { id } = await params
      setMusicaId(parseInt(id))
    }
    loadParams()
  }, [params])

  useEffect(() => {
    if (!musicaId) return

    async function fetchMusica() {
      try {
        setLoading(true)
        const response = await fetch(`/api/musicas/${musicaId}`)
        if (!response.ok) {
          throw new Error('Erro ao carregar música')
        }
        const data = await response.json()
        setMusica(data)
        setTitulo(data.titulo)
        setArtista(data.artista)
        setTomOriginal(data.tom_original || '')
        setCifra(data.cifra || '')
        setTags(data.tags)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchMusica()
  }, [musicaId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!musicaId || !titulo.trim() || !artista.trim()) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/musicas/${musicaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          artista: artista.trim(),
          tom_original: tomOriginal || undefined,
          cifra: cifra.trim() || undefined,
          tags,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao atualizar música')
      }

      router.push('/musicas')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar música')
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!musicaId || !confirm('Tem certeza que deseja excluir esta música?')) return

    try {
      const response = await fetch(`/api/musicas/${musicaId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao excluir música')
      }

      router.push('/musicas')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir música')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    )
  }

  if (error && !musica) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Link
          href="/musicas"
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Voltar para Músicas
        </Link>
      </div>
    )
  }

  const isValid = titulo.trim() && artista.trim()

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/musicas"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Voltar para Músicas
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Editar Música</h1>
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
              Título *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Amazing Grace"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Artista *
            </label>
            <input
              type="text"
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: John Newton"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tom Original
            </label>
            <select
              value={tomOriginal}
              onChange={(e) => setTomOriginal(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Selecionar tom...</option>
              {TOM_OPCOES.map((tom) => (
                <option key={tom} value={tom}>
                  {tom}
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
              Cifra
            </label>
            <textarea
              value={cifra}
              onChange={(e) => setCifra(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              placeholder="Cole aqui a cifra da música..."
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Link
            href="/musicas"
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

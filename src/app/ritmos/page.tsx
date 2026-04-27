'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, Plus, Play } from 'lucide-react'

interface DrumPattern {
  id: number
  nome: string
  bpm: number
  kit: string
  steps: string
  created_at: string
}

export default function DrumPatternsPage() {
  const [patterns, setPatterns] = useState<DrumPattern[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPatterns()
  }, [])

  const fetchPatterns = async () => {
    try {
      const res = await fetch('/api/drum-patterns')
      if (!res.ok) throw new Error('Erro ao buscar ritmos')
      const data = await res.json()
      setPatterns(data)
    } catch (err) {
      setError('Erro ao carregar ritmos')
    } finally {
      setLoading(false)
    }
  }

  const deletePattern = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este ritmo?')) return
    try {
      const res = await fetch(`/api/drum-patterns/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erro ao excluir')
      setPatterns(patterns.filter(p => p.id !== id))
    } catch {
      alert('Erro ao excluir ritmo')
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR')
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="max-w-5xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Ritmos de Bateria</h1>
        <Link
          href="/ritmos/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Novo Ritmo
        </Link>
      </div>

      {patterns.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500 mb-4">Nenhum ritmo criado ainda</p>
          <Link
            href="/ritmos/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            Criar primeiro ritmo
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {patterns.map(pattern => (
            <div
              key={pattern.id}
              className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Play size={18} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{pattern.nome}</h3>
                  <p className="text-sm text-gray-500">
                    {pattern.bpm} BPM · Kit {pattern.kit} · {formatDate(pattern.created_at)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/ritmos/${pattern.id}`}
                  className="px-3 py-1.5 text-blue-600 border border-blue-200 rounded hover:bg-blue-50"
                >
                  Editar
                </Link>
                <button
                  onClick={() => deletePattern(pattern.id)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

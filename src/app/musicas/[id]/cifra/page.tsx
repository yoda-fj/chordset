'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Edit3, Music } from 'lucide-react'
import Link from 'next/link'
import { CifraViewer } from '@/components/chords'

export default function CifraPage() {
  const router = useRouter()
  const params = useParams()
  const musicaId = parseInt(params.id as string)

  const [musica, setMusica] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMusica() {
      try {
        const response = await fetch(`/api/musicas/${musicaId}`)
        if (!response.ok) throw new Error('Música não encontrada')
        
        const data = await response.json()
        setMusica(data)
      } catch (error) {
        console.error('Erro ao carregar música:', error)
      } finally {
        setLoading(false)
      }
    }
    
    if (musicaId) {
      loadMusica()
    }
  }, [musicaId])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!musica) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/musicas"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>
        </div>
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Música não encontrada.</p>
        </div>
      </div>
    )
  }

  if (!musica.cifra) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
        </div>

        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Music className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Esta música ainda não possui cifra cadastrada.</p>
          <Link
            href={`/musicas/${musicaId}/edit`}
            className="text-indigo-600 hover:text-indigo-700 font-medium"
          >
            Adicionar cifra
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>
          <div className="flex items-center gap-2">
            <Link
              href={`/musicas/${musicaId}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 text-indigo-600 hover:text-indigo-700 border border-indigo-200 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              <Edit3 size={18} />
              Editar
            </Link>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Printer size={18} />
              Imprimir
            </button>
          </div>
        </div>
      </div>

      {/* CifraViewer - reusa o mesmo componente */}
      <CifraViewer
        cifra={musica.cifra}
        titulo={musica.titulo}
        artista={musica.artista}
        tomOriginal={musica.tom_original}
        showMetronome={true}
        showControls={true}
      />

      <div className="mt-8 pt-4 border-t text-center text-sm text-slate-400 hidden print:block">
        <p>ChordSet - {new Date().toLocaleDateString('pt-BR')}</p>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Edit3, Music, Music2 } from 'lucide-react'
import Link from 'next/link'
import { ChordViewer, Metronome, Autoscroll } from '@/components/chords'

interface Musica {
  id: number
  titulo: string
  artista: string
  tom_original: string | null
  cifra: string | null
}

export default function CifraPage() {
  const router = useRouter()
  const params = useParams()
  const musicaId = parseInt(params.id as string)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [musica, setMusica] = useState<Musica | null>(null)
  const [currentCifra, setCurrentCifra] = useState('')
  const [currentTom, setCurrentTom] = useState('')
  // Preserva os valores originais da música (não são alterados pela transposição)
  const [originalTom, setOriginalTom] = useState<string | null>(null)
  const [originalCifra, setOriginalCifra] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMusica() {
      try {
        const response = await fetch(`/api/musicas/${musicaId}`)
        if (!response.ok) throw new Error('Música não encontrada')
        
        const data = await response.json()
        setMusica(data)
        setCurrentCifra(data.cifra || '')
        setCurrentTom(data.tom_original || 'C')
        // Preserva valores originais para transposição
        setOriginalTom(data.tom_original)
        setOriginalCifra(data.cifra)
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

  const handleTranspose = (newTom: string, newCifra: string) => {
    setCurrentTom(newTom)
    setCurrentCifra(newCifra)
  }

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
      <div className="max-w-4xl mx-auto">
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

  if (!currentCifra) {
    return (
      <div className="max-w-4xl mx-auto">
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

      {/* Info da música */}
      <div className="print-cifra mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{musica.titulo}</h1>
          <p className="text-gray-600">{musica.artista}</p>
        </div>
        {musica.tom_original && (
          <div className="text-right text-sm text-gray-500">
            <span className="block">Tom original: <strong className="text-indigo-600">{musica.tom_original}</strong></span>
            {currentTom !== musica.tom_original && (
              <span className="block text-amber-600">Transposto de {musica.tom_original}</span>
            )}
          </div>
        )}
      </div>

      {/* Seletor de Tom - sempre visível */}
      <div className="mb-4 print:hidden flex items-center gap-3 bg-white p-3 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2">
          <Music2 size={18} className="text-indigo-600" />
          <span className="text-sm font-medium text-gray-700">Transpor para:</span>
        </div>
        <select
          value={currentTom}
          onChange={(e) => {
            const newTom = e.target.value
            if (originalTom && originalCifra && newTom !== originalTom) {
              // Import dinâmico pra evitar erro de build
              import('@/utils/chord-transposer').then(({ transposeCifra }) => {
                const newCifra = transposeCifra(originalCifra, originalTom, newTom)
                handleTranspose(newTom, newCifra)
                // Salvar no banco
                fetch(`/api/musicas/${musicaId}/transpose`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ tom_original: newTom }),
                })
              })
            }
          }}
          className="px-3 py-1.5 bg-indigo-100 text-indigo-700 font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500"
        >
          <option value="C">C</option>
          <option value="C#">C# / Db</option>
          <option value="D">D</option>
          <option value="D#">D# / Eb</option>
          <option value="E">E</option>
          <option value="F">F</option>
          <option value="F#">F# / Gb</option>
          <option value="G">G</option>
          <option value="G#">G# / Ab</option>
          <option value="A">A</option>
          <option value="A#">A# / Bb</option>
          <option value="B">B</option>
          <option value="Cm">Cm</option>
          <option value="Dm">Dm</option>
          <option value="Em">Em</option>
          <option value="Fm">Fm</option>
          <option value="Gm">Gm</option>
          <option value="Am">Am</option>
          <option value="Bm">Bm</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cifra */}
        <div className="lg:col-span-2">
          <div 
            ref={scrollContainerRef}
            className="print-cifra bg-white rounded-xl shadow-sm border border-slate-200 overflow-y-auto max-h-[calc(100vh-200px)]"
          >
            <ChordViewer 
              chordProContent={currentCifra}
              semitones={0}
              title={musica.titulo}
              artist={musica.artista}
            />
          </div>
          
          <div className="mt-8 pt-4 border-t text-center text-sm text-slate-400 hidden print:block">
            <p>ChordSet - {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 print:hidden">
          <Metronome defaultBpm={100} />

          <Autoscroll targetRef={scrollContainerRef} />
        </div>
      </div>
    </div>
  )
}

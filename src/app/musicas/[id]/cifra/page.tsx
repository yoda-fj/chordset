'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Edit3, Music } from 'lucide-react'
import Link from 'next/link'
import { mockMusicas } from '@/lib/mockData'
import { ChordViewer, TransposeControl, Metronome, ChordDiagramPanel, Autoscroll } from '@/components/chords'
import { useTranspose } from '@/hooks/useTranspose'
import { extractChords, extractKey } from '@/utils/chords'

export default function CifraPage() {
  const router = useRouter()
  const params = useParams()
  const musicaId = parseInt(params.id as string)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const [titulo, setTitulo] = useState('')
  const [artista, setArtista] = useState('')
  const [tomOriginal, setTomOriginal] = useState('')
  const [cifra, setCifra] = useState('')
  const [loading, setLoading] = useState(true)
  
  // Hook de transposição
  const { 
    originalKey, 
    currentKey, 
    semitones, 
    transpose, 
    resetTranspose, 
    setOriginalKey 
  } = useTranspose(tomOriginal || 'C')

  useEffect(() => {
    // Mock load - substituir por chamada real ao Supabase
    const musica = mockMusicas.find((m) => m.id === musicaId)
    if (musica) {
      setTitulo(musica.titulo)
      setArtista(musica.artista)
      setTomOriginal(musica.tom_original || '')
      setCifra(musica.cifra || '')
      
      // Extrai tom da cifra se disponível
      const keyFromCifra = extractKey(musica.cifra || '')
      const finalKey = musica.tom_original || keyFromCifra || 'C'
      setOriginalKey(finalKey)
    }
    setLoading(false)
  }, [musicaId, setOriginalKey])

  const handlePrint = () => {
    window.print()
  }

  // Extrai acordes únicos da cifra
  const uniqueChords = extractChords(cifra)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando...</div>
      </div>
    )
  }

  if (!cifra) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href={`/musicas/${musicaId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Voltar para Edição
          </Link>
        </div>

        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Music className="mx-auto h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 mb-4">Esta música ainda não possui cifra cadastrada.</p>
          <Link
            href={`/musicas/${musicaId}`}
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
      {/* Header - não imprime */}
      <div className="mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <Link
            href={`/musicas/${musicaId}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft size={18} />
            Voltar para Edição
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href={`/musicas/${musicaId}`}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna principal - Cifra */}
        <div className="lg:col-span-2">
          {/* Conteúdo da Cifra - imprime */}
          <div 
            ref={scrollContainerRef}
            className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 print:shadow-none print:border-0 overflow-y-auto max-h-[calc(100vh-200px)]"
          >
            <ChordViewer 
              chordProContent={cifra}
              semitones={semitones}
              title={titulo}
              artist={artista}
            />
          </div>
          
          {/* Rodapé - só aparece na impressão */}
          <div className="mt-8 pt-4 border-t text-center text-sm text-slate-400 hidden print:block">
            <p>ChordSet - {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Sidebar - não imprime */}
        <div className="space-y-4 print:hidden">
          {/* Controles de Transposição */}
          <TransposeControl
            originalKey={originalKey}
            currentKey={currentKey}
            semitones={semitones}
            onTranspose={transpose}
            onReset={resetTranspose}
          />

          {/* Metrônomo */}
          <Metronome defaultBpm={100} />

          {/* Autoscroll */}
          <Autoscroll targetRef={scrollContainerRef} />

          {/* Diagramas de Acordes */}
          {uniqueChords.length > 0 && (
            <ChordDiagramPanel 
              chords={uniqueChords}
              semitones={semitones}
            />
          )}
        </div>
      </div>
    </div>
  )
}

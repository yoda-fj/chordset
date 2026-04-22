'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Music, Check, ChevronLeft, ChevronRight, Menu, X, Maximize2, Minimize2, ZoomIn, ZoomOut } from 'lucide-react'
import Link from 'next/link'
import { transposeLine } from '@/utils/chord-transposer'

export default function SetlistPage() {
  const params = useParams()
  const router = useRouter()
  const eventoId = parseInt(params.id as string)

  const [evento, setEvento] = useState<any>(null)
  const [musicas, setMusicas] = useState<any[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [currentTom, setCurrentTom] = useState<string | null>(null)
  const [transposedCifra, setTransposedCifra] = useState('')
  const [showSidebar, setShowSidebar] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollSpeed, setScrollSpeed] = useState<0 | 1 | 2 | 3>(3)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fontSize, setFontSize] = useState(16)
  
  // Helper functions for transposition
  const NOTAS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  function getSemitones(from: string, to: string): number {
    const fromIdx = NOTAS.indexOf(from.toUpperCase().replace('b', '#').replace('B', '#'))
    const toIdx = NOTAS.indexOf(to.toUpperCase().replace('b', '#').replace('B', '#'))
    if (fromIdx === -1 || toIdx === -1) return 0
    return (toIdx - fromIdx + 12) % 12
  }
  
  function transposeCifra(cifra: string, semitones: number): string {
    if (!semitones) return cifra
    const lines = cifra.split('\n')
    return lines.map(line => transposeLine(line, semitones)).join('\n')
  }

  // Load data
  useEffect(() => {
    async function loadData() {
      try {
        const [eventoRes, musicasRes] = await Promise.all([
          fetch(`/api/eventos/${eventoId}`),
          fetch(`/api/eventos/${eventoId}/musicas`)
        ])

        if (!eventoRes.ok) throw new Error('Evento não encontrado')

        const eventoData = await eventoRes.json()
        setEvento(eventoData)

        if (musicasRes.ok) {
          const musicasData = await musicasRes.json()
          setMusicas(musicasData)
          if (musicasData.length > 0) {
            const tom = musicasData[0].tom_evento || musicasData[0].musicas?.tom_original || 'C'
            setCurrentTom(tom)
            // Initial transpose
            const cifra = musicasData[0].musicas?.cifra || ''
            const tomOriginal = musicasData[0].musicas?.tom_original || 'C'
            const semitones = getSemitones(tomOriginal, tom)
            setTransposedCifra(transposeCifra(cifra, semitones))
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [eventoId])

  // Scroll control effect
  useEffect(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current)
      scrollIntervalRef.current = null
    }
    
    // Stopped (3) = don't scroll
    if (scrollSpeed === 3) return
    
    if (scrollContainerRef.current) {
      const speeds: Record<number, number> = { 1: 100, 2: 60, 0: 30 }
      const speed = speeds[scrollSpeed] || 30
      
      scrollIntervalRef.current = setInterval(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop += 1
          const maxScroll = scrollContainerRef.current.scrollHeight - scrollContainerRef.current.clientHeight
          if (scrollContainerRef.current.scrollTop >= maxScroll) {
            setScrollSpeed(3)
          }
        }
      }, speed)
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
  }, [scrollSpeed])

  // Keep screen awake - requests on user interaction
  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    let wakeLockRequested = false
    
    async function requestWakeLock() {
      if ('wakeLock' in navigator && !wakeLockRequested) {
        try {
          wakeLockRequested = true
          wakeLock = await navigator.wakeLock.request('screen')
          wakeLockRef.current = wakeLock
        } catch (err) {
          wakeLockRequested = false
        }
      }
    }
    
    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        wakeLockRequested = false
        requestWakeLock()
      }
    }
    
    function handleFirstInteraction() {
      requestWakeLock()
      document.removeEventListener('touchstart', handleFirstInteraction)
      document.removeEventListener('click', handleFirstInteraction)
    }
    
    document.addEventListener('touchstart', handleFirstInteraction)
    document.addEventListener('click', handleFirstInteraction)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('touchstart', handleFirstInteraction)
      document.removeEventListener('click', handleFirstInteraction)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (wakeLock) {
        wakeLock.release()
      }
    }
  }, [])

  // Fullscreen handling
  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const cycleScrollSpeed = () => {
    setScrollSpeed(prev => {
      if (prev === 3) return 1
      if (prev === 1) return 2
      if (prev === 2) return 0
      return 3
    })
  }

  const goNext = () => {
    if (selectedIndex < musicas.length - 1) {
      const next = selectedIndex + 1
      setSelectedIndex(next)
      const tom = musicas[next].tom_evento || musicas[next].musicas?.tom_original || 'C'
      setCurrentTom(tom)
      const cifra = musicas[next].musicas?.cifra || ''
      const tomOriginal = musicas[next].musicas?.tom_original || 'C'
      setTransposedCifra(transposeCifra(cifra, getSemitones(tomOriginal, tom)))
    }
  }

  const goPrev = () => {
    if (selectedIndex > 0) {
      const prev = selectedIndex - 1
      setSelectedIndex(prev)
      const tom = musicas[prev].tom_evento || musicas[prev].musicas?.tom_original || 'C'
      setCurrentTom(tom)
      const cifra = musicas[prev].musicas?.cifra || ''
      const tomOriginal = musicas[prev].musicas?.tom_original || 'C'
      setTransposedCifra(transposeCifra(cifra, getSemitones(tomOriginal, tom)))
    }
  }


  const selectMusica = (index: number) => {
    setSelectedIndex(index)
    const tom = musicas[index].tom_evento || musicas[index].musicas?.tom_original || 'C'
    setCurrentTom(tom)
    const cifra = musicas[index].musicas?.cifra || ''
    const tomOriginal = musicas[index].musicas?.tom_original || 'C'
    setTransposedCifra(transposeCifra(cifra, getSemitones(tomOriginal, tom)))
  }

  const toggleComplete = (index: number) => {
    setMusicas(prev => prev.map((m, i) => 
      i === index ? { ...m, confirmada: !m.confirmada } : m
    ))
  }

  const toggleFullscreen = async () => {
    if (!isFullscreen) {
      try {
        await document.documentElement.requestFullscreen()
      } catch (err) {}
    } else {
      try {
        await document.exitFullscreen()
      } catch (err) {}
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (error || !evento) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{error || 'Evento não encontrado'}</p>
        <Link href="/eventos" className="text-indigo-600 mt-4 inline-block">Voltar</Link>
      </div>
    )
  }

  const selectedMusica = musicas[selectedIndex]
  const cifra = selectedMusica?.musicas?.cifra || ''
  const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const scrollLabels: Record<number, string> = { 3: '⏹', 1: '▶ 1x', 2: '▶▶ 2x', 0: '▶▶▶ 3x' }
  const scrollColors: Record<number, string> = {
    3: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    1: 'bg-blue-500 text-white hover:bg-blue-600',
    2: 'bg-blue-600 text-white hover:bg-blue-700',
    0: 'bg-blue-700 text-white hover:bg-blue-800'
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-bold text-gray-900">{evento.nome}</h1>
            <p className="text-sm text-gray-500">{selectedIndex + 1} de {musicas.length}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={currentTom || 'C'}
            onChange={(e) => {
              const newTom = e.target.value
              setCurrentTom(newTom)
              const cifra = selectedMusica?.musicas?.cifra || ''
              const tomOriginal = selectedMusica?.musicas?.tom_original || 'C'
              setTransposedCifra(transposeCifra(cifra, getSemitones(tomOriginal, newTom)))
            }}
            className="px-3 py-2 border rounded-lg text-sm bg-white"
          >
            {keys.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          
          <button
            onClick={cycleScrollSpeed}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${scrollColors[scrollSpeed]}`}
          >
            {scrollLabels[scrollSpeed]}
          </button>
          
          <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 hover:bg-gray-100 rounded-lg md:hidden">
            {showSidebar ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <button onClick={toggleFullscreen} className="p-2 hover:bg-gray-100 rounded-lg">
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
          
          <button onClick={() => setFontSize(f => Math.max(12, f - 2))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ZoomOut size={20} />
          </button>
          
          <button onClick={() => setFontSize(f => Math.min(28, f + 2))} className="p-2 hover:bg-gray-100 rounded-lg">
            <ZoomIn size={20} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`
          ${showSidebar ? 'w-72' : 'w-0'} 
          bg-white border-r transition-all duration-200 overflow-hidden flex-shrink-0 hidden lg:block
        `}>
          <div className="w-72 overflow-y-auto h-full">
            <div className="p-2">
              {musicas.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => selectMusica(index)}
                  className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${index === selectedIndex ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${item.confirmada ? 'bg-green-500 text-white' : index === selectedIndex ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {item.confirmada ? <Check size={14} /> : index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${item.confirmada ? 'line-through text-gray-500' : ''}`}>
                        {item.musicas?.titulo}
                      </div>
                      <div className="text-sm text-gray-500 truncate">{item.musicas?.artista}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        {showSidebar && (
          <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setShowSidebar(false)} />
        )}
        
        {/* Mobile sidebar */}
        <aside className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} fixed left-0 top-0 bottom-0 w-72 bg-white z-50 transition-transform duration-200 md:hidden overflow-y-auto`}>
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold">Repertório</h2>
            <button onClick={() => setShowSidebar(false)} className="p-2"><X size={20} /></button>
          </div>
          <div className="p-2">
            {musicas.map((item, index) => (
              <button
                key={item.id}
                onClick={() => { selectMusica(index); setShowSidebar(false) }}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${index === selectedIndex ? 'bg-indigo-100 text-indigo-900' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs ${item.confirmada ? 'bg-green-500 text-white' : index === selectedIndex ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {item.confirmada ? <Check size={14} /> : index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium truncate ${item.confirmada ? 'line-through text-gray-500' : ''}`}>{item.musicas?.titulo}</div>
                    <div className="text-sm text-gray-500 truncate">{item.musicas?.artista}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main content - Cifra */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {musicas.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Music size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhuma música no repertório</p>
              </div>
            </div>
          ) : !cifra ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Music size={48} className="mx-auto mb-4 opacity-50" />
                <p>Esta música não tem cifra</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto p-4 md:p-6 min-h-0" ref={scrollContainerRef}>
                <div className="max-w-3xl mx-auto">
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedMusica?.musicas?.titulo}</h2>
                    <p className="text-gray-600">{selectedMusica?.musicas?.artista}</p>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
                    {transposedCifra}
                  </pre>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-white border-t px-4 py-3 shrink-0">
                <div className="flex items-center justify-between max-w-3xl mx-auto">
                  <button onClick={goPrev} disabled={selectedIndex === 0} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronLeft size={20} />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>

                  <button
                    onClick={() => toggleComplete(selectedIndex)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${selectedMusica?.confirmada ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <Check size={20} />
                    <span className="hidden sm:inline">{selectedMusica?.confirmada ? 'Concluída' : 'Marcar como concluída'}</span>
                  </button>

                  <button onClick={goNext} disabled={selectedIndex === musicas.length - 1} className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                    <span className="hidden sm:inline">Próxima</span>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}

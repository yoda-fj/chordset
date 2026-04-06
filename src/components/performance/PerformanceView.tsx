'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Play,
  Pause,
  Settings,
  Minus,
  Plus,
} from 'lucide-react'
import { EventoMusicaWithMusica } from '@/types/database'

interface PerformanceViewProps {
  eventoId: number
  musicas: EventoMusicaWithMusica[]
  eventoNome: string
}

export function PerformanceView({
  eventoId,
  musicas,
  eventoNome,
}: PerformanceViewProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoScrolling, setIsAutoScrolling] = useState(false)
  const [scrollSpeed, setScrollSpeed] = useState(50)
  const [showSettings, setShowSettings] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const lyricsRef = useRef<HTMLDivElement>(null)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const currentMusica = musicas[currentIndex]
  const totalMusicas = musicas.length

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          goToPrevious()
          break
        case 'ArrowRight':
        case ' ':
          e.preventDefault()
          goToNext()
          break
        case 'Escape':
          exitPerformance()
          break
        case 'ArrowUp':
          e.preventDefault()
          if (isAutoScrolling) {
            setScrollSpeed((prev) => Math.min(prev + 10, 200))
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          if (isAutoScrolling) {
            setScrollSpeed((prev) => Math.max(prev - 10, 10))
          }
          break
      }
    },
    [currentIndex, isAutoScrolling, scrollSpeed]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Auto-scroll functionality
  useEffect(() => {
    if (isAutoScrolling && lyricsRef.current) {
      scrollIntervalRef.current = setInterval(() => {
        if (lyricsRef.current) {
          lyricsRef.current.scrollTop += scrollSpeed / 20
        }
      }, 50)
    } else {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
        scrollIntervalRef.current = null
      }
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current)
      }
    }
  }, [isAutoScrolling, scrollSpeed])

  // Reset scroll when song changes
  useEffect(() => {
    if (lyricsRef.current) {
      lyricsRef.current.scrollTop = 0
    }
    setIsAutoScrolling(false)
  }, [currentIndex])

  const goToNext = () => {
    if (currentIndex < totalMusicas - 1) {
      setCurrentIndex((prev) => prev + 1)
    }
  }

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1)
    }
  }

  const exitPerformance = () => {
    router.push(`/eventos/${eventoId}`)
  }

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
    setTouchEnd(null)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (distance > minSwipeDistance) {
      // Swiped left - go next
      goToNext()
    } else if (distance < -minSwipeDistance) {
      // Swiped right - go previous
      goToPrevious()
    }

    setTouchStart(null)
    setTouchEnd(null)
  }

  // Parse cifra to highlight chords
  const renderCifra = (cifra: string | null | undefined) => {
    if (!cifra) {
      return (
        <div className="text-gray-500 italic text-center py-8">
          Nenhuma cifra disponível para esta música
        </div>
      )
    }

    const lines = cifra.split('\n')

    return lines.map((line, index) => {
      // Check if line is a chord line (contains chord patterns)
      const isChordLine =
        /^[\s]*[A-G][#b]?(m|maj|min|sus|dim|aug|add)?[0-9]*(\/[A-G][#b]?)?[\s]*$/i.test(
          line.trim()
        ) ||
        line.includes('  ') &&
          /[A-G][#b]?(m|maj|min|sus|dim|aug|add)?[0-9]*/.test(line)

      // Check if it's a section header like [Intro], [Verso], etc.
      const isSectionHeader = /^\[.*\]$/.test(line.trim())

      if (isSectionHeader) {
        return (
          <div
            key={index}
            className="text-amber-400 font-bold mt-6 mb-2 text-lg tracking-wide"
          >
            {line}
          </div>
        )
      }

      if (isChordLine) {
        return (
          <div
            key={index}
            className="text-cyan-400 font-mono text-lg sm:text-xl md:text-2xl whitespace-pre-wrap leading-relaxed"
          >
            {line}
          </div>
        )
      }

      // Regular lyrics line
      return (
        <div
          key={index}
          className="text-gray-200 text-lg sm:text-xl md:text-2xl whitespace-pre-wrap leading-relaxed"
        >
          {line || '\u00A0'}
        </div>
      )
    })
  }

  if (!currentMusica) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-xl mb-4">Nenhuma música no setlist</p>
          <button
            onClick={exitPerformance}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Voltar ao Evento
          </button>
        </div>
      </div>
    )
  }

  const musica = currentMusica.musicas
  const tom = currentMusica.tom_evento || musica.tom_original || '-'

  return (
    <div
      className="fixed inset-0 bg-gray-950 text-white overflow-hidden flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={exitPerformance}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            title="Sair do Modo Performance (Esc)"
          >
            <X size={20} />
          </button>
          <div>
            <h1 className="text-sm text-gray-400 truncate max-w-[150px] sm:max-w-xs">
              {eventoNome}
            </h1>
            <div className="text-lg sm:text-xl font-bold text-white">
              {currentIndex + 1}/{totalMusicas}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setIsAutoScrolling(!isAutoScrolling)}
            className={`p-2 rounded-lg transition-colors ${
              isAutoScrolling
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
            title={isAutoScrolling ? 'Pausar scroll (↑/↓ para velocidade)' : 'Iniciar auto-scroll'}
          >
            {isAutoScrolling ? <Pause size={20} /> : <Play size={20} />}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-gray-600' : 'bg-gray-800 hover:bg-gray-700'
            }`}
            title="Configurações"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Settings panel */}
      {showSettings && (
        <div className="absolute top-16 right-4 sm:right-6 bg-gray-900 border border-gray-700 rounded-lg p-4 z-20 shadow-xl">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm text-gray-400">Velocidade scroll</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setScrollSpeed((prev) => Math.max(prev - 10, 10))}
                  className="p-1 rounded bg-gray-800 hover:bg-gray-700"
                >
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center text-sm">{scrollSpeed}%</span>
                <button
                  onClick={() => setScrollSpeed((prev) => Math.min(prev + 10, 200))}
                  className="p-1 rounded bg-gray-800 hover:bg-gray-700"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Song info */}
      <div className="px-4 sm:px-6 py-4 bg-gray-900/50 border-b border-gray-800 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white truncate">
              {musica.titulo}
            </h2>
            <p className="text-lg sm:text-xl text-gray-400 truncate">
              {musica.artista}
            </p>
          </div>
          <div className="shrink-0">
            <div className="text-3xl sm:text-4xl md:text-5xl font-bold text-amber-400">
              {tom}
            </div>
          </div>
        </div>
        {currentMusica.observacoes && (
          <div className="mt-2 text-sm text-amber-300">
            {currentMusica.observacoes}
          </div>
        )}
      </div>

      {/* Lyrics/Cifra area */}
      <div
        ref={lyricsRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-6"
        style={{ scrollBehavior: isAutoScrolling ? 'auto' : 'smooth' }}
      >
        <div className="max-w-4xl mx-auto">
          {renderCifra(musica.cifra)}
        </div>
        {/* Bottom spacer for scrolling */}
        <div className="h-32" />
      </div>

      {/* Navigation footer */}
      <footer className="flex items-center justify-between px-4 sm:px-6 py-3 bg-gray-900/80 backdrop-blur-sm border-t border-gray-800 shrink-0">
        <button
          onClick={goToPrevious}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={24} />
          <span className="hidden sm:inline">Anterior</span>
        </button>

        <div className="text-center">
          <div className="text-sm text-gray-500">
            {currentIndex + 1} de {totalMusicas}
          </div>
        </div>

        <button
          onClick={goToNext}
          disabled={currentIndex === totalMusicas - 1}
          className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <span className="hidden sm:inline">Próxima</span>
          <ChevronRight size={24} />
        </button>
      </footer>
    </div>
  )
}

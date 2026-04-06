'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { PerformanceView } from '@/components/performance/PerformanceView'
import { EventoMusicaWithMusica, Evento } from '@/types/database'
import { mockEventos, mockEventoMusicas } from '@/lib/mockData'

export default function PerformancePage() {
  const params = useParams()
  const eventoId = parseInt(params.id as string)

  const [evento, setEvento] = useState<Evento | null>(null)
  const [musicas, setMusicas] = useState<EventoMusicaWithMusica[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Mock data loading - substitute with real Supabase call
    const loadData = () => {
      try {
        const foundEvento = mockEventos.find((e) => e.id === eventoId)
        
        if (!foundEvento) {
          setError('Evento não encontrado')
          setLoading(false)
          return
        }

        const eventoMusicas = mockEventoMusicas
          .filter((em) => em.evento_id === eventoId)
          .sort((a, b) => a.ordem - b.ordem)

        setEvento(foundEvento)
        setMusicas(eventoMusicas)
      } catch (err) {
        setError('Erro ao carregar dados do evento')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [eventoId])

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-xl">Carregando...</div>
      </div>
    )
  }

  if (error || !evento) {
    return (
      <div className="fixed inset-0 bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-4">{error || 'Erro desconhecido'}</p>
          <a
            href={`/eventos/${eventoId}`}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            Voltar ao Evento
          </a>
        </div>
      </div>
    )
  }

  return (
    <PerformanceView
      eventoId={eventoId}
      musicas={musicas}
      eventoNome={evento.nome}
    />
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Trash2, Plus, Play, Square } from 'lucide-react'
import * as Tone from 'tone'

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
  const [playingId, setPlayingId] = useState<number | null>(null)
  const seqRef = useRef<any>(null)

  useEffect(() => {
    fetchPatterns()
    return () => {
      if (seqRef.current) {
        seqRef.current.stop()
        seqRef.current.dispose()
      }
    }
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

  const stopPlayback = () => {
    if (seqRef.current) {
      seqRef.current.stop()
      seqRef.current.dispose()
      seqRef.current = null
    }
    Tone.Transport.stop()
    setPlayingId(null)
  }

  const playPattern = async (pattern: DrumPattern) => {
    if (playingId === pattern.id) {
      stopPlayback()
      return
    }

    stopPlayback()

    await Tone.start()

    const noteMap: Record<string, string> = {
      kick: 'C1', snare: 'D1', hihatClosed: 'F#1', hihatOpen: 'A#1',
      crash: 'C2', ride: 'D2', tomLow: 'E2', tomMid: 'F2', tomHigh: 'G2'
    }

    const urls = {
      'C1': '/drum-samples/Kick-V01-Yamaha-16x16.wav',
      'D1': '/drum-samples/SNARE-V01-CustomWorks-6x13.wav',
      'F#1': '/drum-samples/HiHat-closed-V01-Yamaha-14.wav',
      'A#1': '/drum-samples/HiHat-open-V01-Yamaha-14.wav',
      'C2': '/drum-samples/Crash-V01-Pure.wav',
      'D2': '/drum-samples/Ride-V01-Pure.wav',
      'E2': '/drum-samples/TOM-LOW-V01-Yamaha-12x8.wav',
      'F2': '/drum-samples/TOM-MID-V01-Yamaha-10x9.wav',
      'G2': '/drum-samples/TOM-HIGH-V01-Yamaha-7x5.wav',
    }

    const sampler = new Tone.Sampler({ urls }).toDestination()
    sampler.volume.value = 6

    Tone.Transport.bpm.value = pattern.bpm

    const steps = JSON.parse(pattern.steps)
    const instruments = ['kick', 'snare', 'hihatClosed', 'hihatOpen', 'crash', 'ride', 'tomLow', 'tomMid', 'tomHigh']

    const stepArray = new Array(16).fill(0).map((_, i) => i)
    const seq = new Tone.Sequence(
      (time: any, stepIdx: number) => {
        instruments.forEach((inst, instIdx) => {
          if (steps[instIdx]?.[stepIdx]) {
            sampler.triggerAttackRelease(noteMap[inst], '16n', time)
          }
        })
      },
      stepArray,
      '16n'
    )

    seqRef.current = seq
    seq.start(0)
    Tone.Transport.start()
    setPlayingId(pattern.id)
  }

  const deletePattern = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este ritmo?')) return
    try {
      const res = await fetch(`/api/drum-patterns/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error || 'Erro ao excluir')
        return
      }
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
              className={`flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-md transition ${playingId === pattern.id ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => playPattern(pattern)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition ${
                    playingId === pattern.id
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                >
                  {playingId === pattern.id ? <Square size={18} /> : <Play size={18} />}
                </button>
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

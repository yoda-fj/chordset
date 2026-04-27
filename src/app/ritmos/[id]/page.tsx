'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Square, Save, Volume2 } from 'lucide-react'
import * as Tone from 'tone'
import { getSamplerUrls } from '@/lib/drum-samples'

const INSTRUMENTS = [
  { key: 'kick', label: 'Kick', color: '#ef4444' },
  { key: 'snare', label: 'Snare', color: '#f97316' },
  { key: 'hihatClosed', label: 'HiHat CL', color: '#eab308' },
  { key: 'hihatOpen', label: 'HiHat OP', color: '#84cc16' },
  { key: 'crash', label: 'Crash', color: '#22c55e' },
  { key: 'ride', label: 'Ride', color: '#14b8a6' },
  { key: 'tomLow', label: 'Tom Low', color: '#3b82f6' },
  { key: 'tomMid', label: 'Tom Mid', color: '#8b5cf6' },
  { key: 'tomHigh', label: 'Tom High', color: '#a855f7' },
]

const NOTE_MAP: Record<string, string> = {
  kick: 'C1',
  snare: 'D1',
  hihatClosed: 'F#1',
  hihatOpen: 'A#1',
  crash: 'C2',
  ride: 'D2',
  tomLow: 'E2',
  tomMid: 'F2',
  tomHigh: 'G2',
}

const TOTAL_STEPS = 16

export default function DrumPatternEditorPage() {
  const router = useRouter()
  const params = useParams()
  const patternId = params.id as string | undefined
  const isNew = patternId === 'new'

  const [nome, setNome] = useState('')
  const [bpm, setBpm] = useState(120)
  const [kit, setKit] = useState('kit1')
  const [steps, setSteps] = useState<Record<string, boolean[]>>(() => {
    const initial: Record<string, boolean[]> = {}
    INSTRUMENTS.forEach(inst => {
      initial[inst.key] = new Array(TOTAL_STEPS).fill(false)
    })
    return initial
  })
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [sampler, setSampler] = useState<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [seq, setSeq] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  // Load sampler
  useEffect(() => {
    let s: any = null
    const loadSampler = () => {
      const urls = getSamplerUrls(kit)
      s = new Tone.Sampler({
        urls,
        onload: () => {
          setIsLoaded(true)
        },
        onerror: (err: any) => {
          console.error('Sampler load error:', err)
        }
      }).toDestination()
      s.volume.value = 6
      setSampler(s)
    }
    loadSampler()
    return () => { if (s) s.dispose() }
  }, [kit])

  // Load existing pattern
  useEffect(() => {
    if (isNew) return
    const load = async () => {
      try {
        const res = await fetch(`/api/drum-patterns/${patternId}`)
        if (!res.ok) throw new Error('Erro')
        const data = await res.json()
        setNome(data.nome)
        setBpm(data.bpm)
        setKit(data.kit)
        if (data.steps) {
          const parsed = typeof data.steps === 'string' ? JSON.parse(data.steps) : data.steps
          // Convert array-of-arrays [instIdx][stepIdx] to Record<string, boolean[]> {kick: [...], snare: [...]}
          const converted: Record<string, boolean[]> = {}
          INSTRUMENTS.forEach((inst, idx) => {
            if (parsed[idx]) {
              converted[inst.key] = parsed[idx].map((v: number) => Boolean(v))
            } else {
              converted[inst.key] = new Array(16).fill(false)
            }
          })
          setSteps(converted)
        }
      } catch {
        alert('Erro ao carregar ritmo')
        router.push('/ritmos')
      }
    }
    load()
  }, [patternId, isNew, router])

  const toggleStep = useCallback((instrument: string, stepIndex: number) => {
    setSteps(prev => ({
      ...prev,
      [instrument]: prev[instrument].map((v, i) => i === stepIndex ? !v : v)
    }))
  }, [])

  const startPlayback = async () => {
    if (!sampler || !isLoaded) return
    await Tone.start()
    Tone.Transport.bpm.value = bpm

    const stepArray = new Array(TOTAL_STEPS).fill(0).map((_, i) => i)
    const sequence = new Tone.Sequence(
      (time: any, stepIdx: number) => {
        setCurrentStep(stepIdx)
        INSTRUMENTS.forEach(inst => {
          if (steps[inst.key][stepIdx]) {
            const note = NOTE_MAP[inst.key]
            sampler.triggerAttackRelease(note, '16n', time)
          }
        })
      },
      stepArray,
      '16n'
    )

    sequence.start(0)
    Tone.Transport.start()
    setSeq(sequence)
    setIsPlaying(true)
  }

  const stopPlayback = () => {
    if (seq) {
      seq.stop()
      seq.dispose()
      setSeq(null)
    }
    Tone.Transport.stop()
    setIsPlaying(false)
    setCurrentStep(-1)
  }

  const savePattern = async () => {
    setSaving(true)
    try {
      const payload = { nome, bpm, kit, steps }
      const url = isNew ? '/api/drum-patterns' : `/api/drum-patterns/${patternId}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) throw new Error('Erro ao salvar')
      router.push('/ritmos')
    } catch {
      alert('Erro ao salvar ritmo')
    } finally {
      setSaving(false)
    }
  }

  const testSound = (instrument: string) => {
    if (!sampler || !isLoaded) return
    const note = NOTE_MAP[instrument]
    sampler.triggerAttackRelease(note, '8n')
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/ritmos" className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">{isNew ? 'Novo Ritmo' : 'Editar Ritmo'}</h1>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            placeholder="Ex: Rock Básico"
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="w-24">
          <label className="block text-sm font-medium mb-1">BPM</label>
          <input
            type="number"
            value={bpm}
            onChange={e => setBpm(Number(e.target.value))}
            min={40}
            max={300}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>
        <div className="w-32">
          <label className="block text-sm font-medium mb-1">Kit</label>
          <select
            value={kit}
            onChange={e => setKit(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="kit1">Kit 1</option>
            <option value="kit2">Kit 2</option>
          </select>
        </div>
        <div className="flex items-end gap-2">
          <button
            onClick={isPlaying ? stopPlayback : startPlayback}
            disabled={!isLoaded}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              isPlaying
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            } disabled:opacity-50`}
          >
            {isPlaying ? <><Square size={18} /> Parar</> : <><Play size={18} /> Tocar</>}
          </button>
          <button
            onClick={savePattern}
            disabled={saving || !nome}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {/* Status */}
      <div className="mb-4">
        {!isLoaded ? (
          <span className="text-orange-500">⏳ Carregando samples...</span>
        ) : (
          <span className="text-green-500">✓ Samples prontos</span>
        )}
      </div>

      {/* Sequencer Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Beat numbers */}
          <div className="flex items-center mb-1">
            <div className="w-28" />
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`w-8 text-center text-xs font-mono ${
                  i % 4 === 0 ? 'font-bold text-blue-600' : 'text-gray-400'
                } ${currentStep === i ? 'text-red-500' : ''}`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          {/* Instrument rows */}
          {INSTRUMENTS.map(inst => (
            <div key={inst.key} className="flex items-center mb-1">
              <button
                onClick={() => testSound(inst.key)}
                className="w-28 flex items-center gap-1 px-2 py-1 text-sm font-medium text-left hover:bg-gray-100 rounded"
                title="Testar som"
              >
                <Volume2 size={12} className="text-gray-400" />
                {inst.label}
              </button>
              {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                <button
                  key={i}
                  onClick={() => toggleStep(inst.key, i)}
                  className={`w-8 h-8 rounded mx-0.5 transition-all ${
                    steps[inst.key][i]
                      ? 'shadow-sm'
                      : 'bg-gray-100 hover:bg-gray-200'
                  } ${currentStep === i ? 'ring-2 ring-red-400' : ''}`}
                  style={
                    steps[inst.key][i]
                      ? { backgroundColor: inst.color, opacity: 0.9 }
                      : undefined
                  }
                />
              ))}
            </div>
          ))}

          {/* Beat markers */}
          <div className="flex items-center mt-2">
            <div className="w-28" />
            {Array.from({ length: TOTAL_STEPS / 4 }, (_, i) => (
              <div
                key={i}
                className="w-32 text-center text-xs text-gray-400 border-t pt-1"
              >
                {i + 1}ª batida
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

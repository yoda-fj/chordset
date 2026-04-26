'use client'

import { useState, useEffect } from 'react'
import * as Tone from 'tone'
import { getSamplerUrls } from '@/lib/drum-samples'

const PRESET_GROOVES: Record<string, { name: string; bpm: number; pattern: { time: number; note: string }[] }> = {
  'rock-8': {
    name: 'Rock (8ths)',
    bpm: 120,
    pattern: [
      { time: 0, note: 'C1' },
      { time: 0, note: 'F#1' },
      { time: 1, note: 'F#1' },
      { time: 2, note: 'D1' },
      { time: 2, note: 'F#1' },
      { time: 3, note: 'F#1' },
      { time: 4, note: 'C1' },
      { time: 4, note: 'F#1' },
      { time: 5, note: 'F#1' },
      { time: 6, note: 'D1' },
      { time: 6, note: 'F#1' },
      { time: 7, note: 'F#1' },
    ]
  },
  'rock-fill': {
    name: 'Rock com Fill',
    bpm: 120,
    pattern: [
      { time: 0, note: 'C1' },
      { time: 0, note: 'F#1' },
      { time: 2, note: 'D1' },
      { time: 2, note: 'F#1' },
      { time: 4, note: 'C1' },
      { time: 4, note: 'F#1' },
      { time: 6, note: 'D1' },
      { time: 6, note: 'E2' },
      { time: 6.5, note: 'F2' },
      { time: 7, note: 'G2' },
    ]
  },
  'pop': {
    name: 'Pop',
    bpm: 100,
    pattern: [
      { time: 0, note: 'C1' },
      { time: 0, note: 'F#1' },
      { time: 2, note: 'D1' },
      { time: 2, note: 'F#1' },
      { time: 4, note: 'C1' },
      { time: 4, note: 'F#1' },
      { time: 6, note: 'D1' },
      { time: 6, note: 'F#1' },
    ]
  },
}

const DRUM_PADS = [
  { note: 'C1', label: 'Kick', color: 'bg-red-500' },
  { note: 'D1', label: 'Snare', color: 'bg-orange-500' },
  { note: 'F#1', label: 'Hi-Hat', color: 'bg-yellow-500' },
  { note: 'A#1', label: 'Open HH', color: 'bg-green-500' },
  { note: 'C2', label: 'Crash', color: 'bg-blue-500' },
  { note: 'D2', label: 'Ride', color: 'bg-indigo-500' },
  { note: 'E2', label: 'Tom L', color: 'bg-purple-500' },
  { note: 'F2', label: 'Tom M', color: 'bg-pink-500' },
  { note: 'G2', label: 'Tom H', color: 'bg-rose-500' },
]

export default function DrumDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedGroove, setSelectedGroove] = useState('rock-8')
  const [bpm, setBpm] = useState(120)
  const [sequence, setSequence] = useState<Tone.Sequence | null>(null)

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${time}] ${msg}`])
  }

  // Initialize sampler
  useEffect(() => {
    addLog('Criando Sampler...')
    const s = new Tone.Sampler({
      urls: getSamplerUrls('kit1'),
      baseUrl: '',
      onload: () => {
        addLog('✓ Samples carregados!')
        setIsLoaded(true)
      },
      onerror: (e) => {
        addLog('✗ Erro ao carregar: ' + e)
      }
    }).toDestination()
    s.volume.value = 6
    setSampler(s)
    addLog('Sampler criado, esperando carregamento...')

    return () => {
      s.dispose()
    }
  }, [])

  // Test single pad
  const testPad = (note: string) => {
    if (!sampler || !isLoaded) {
      addLog('Sampler ainda não carregou!')
      return
    }
    addLog(`Tocando: ${note}`)
    sampler.triggerAttackRelease(note, '8n')
  }

  // Start playback
  const startPlayback = async () => {
    if (!sampler || !isLoaded) {
      addLog('Sampler não carregou!')
      return
    }

    try {
      await Tone.start()
      addLog('✓ AudioContext started')
    } catch (e) {
      addLog('✗ Tone.start erro: ' + e)
      return
    }

    const pattern = PRESET_GROOVES[selectedGroove]?.pattern
    if (!pattern) {
      addLog('✗ Pattern não encontrado')
      return
    }

    addLog(`Pattern: ${pattern.length} hits`)

    // Build steps array
    const steps: (string[] | null)[] = Array(16).fill(null)
    pattern.forEach(hit => {
      const stepIndex = Math.floor(hit.time * 2) % 16
      if (!steps[stepIndex]) steps[stepIndex] = []
      steps[stepIndex]!.push(hit.note)
    })

    addLog('Steps: ' + steps.map(s => s?.length || 0).join('-'))

    // Create sequence
    const currentBpm = bpm || PRESET_GROOVES[selectedGroove].bpm
    Tone.Transport.bpm.value = currentBpm
    addLog(`BPM: ${currentBpm}`)

    const seq = new Tone.Sequence((time, stepNotes) => {
      if (stepNotes && Array.isArray(stepNotes) && stepNotes.length > 0) {
        stepNotes.forEach(note => {
          sampler!.triggerAttackRelease(note, '16n', time)
        })
      }
    }, steps, '16n')

    addLog('Sequence criada, iniciando...')
    seq.start(0)
    Tone.Transport.start()
    setSequence(seq)
    setIsPlaying(true)
    addLog('▶ PLAY!')
  }

  // Stop playback
  const stopPlayback = () => {
    if (sequence) {
      sequence.stop()
      sequence.dispose()
      setSequence(null)
    }
    Tone.Transport.stop()
    Tone.Transport.cancel()
    setIsPlaying(false)
    addLog('■ STOP')
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Drum Debug</h1>

        {/* Status */}
        <div className="bg-white rounded-lg p-4 border">
          <div className="flex gap-4">
            <span className={`px-2 py-1 rounded ${isLoaded ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              Samples: {isLoaded ? '✓' : '⏳'}
            </span>
            <span className={`px-2 py-1 rounded ${isPlaying ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
              {isPlaying ? '▶ Tocando' : '⏹ Parado'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg p-4 border space-y-4">
          <div className="flex gap-4 items-center">
            <select
              value={selectedGroove}
              onChange={(e) => setSelectedGroove(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              {Object.entries(PRESET_GROOVES).map(([id, g]) => (
                <option key={id} value={id}>{g.name}</option>
              ))}
            </select>
            <input
              type="number"
              value={bpm}
              onChange={(e) => setBpm(Number(e.target.value))}
              className="px-3 py-2 border rounded w-20"
              placeholder="BPM"
            />
            <button
              onClick={isPlaying ? stopPlayback : startPlayback}
              disabled={!isLoaded}
              className={`px-4 py-2 rounded font-bold ${isLoaded ? (isPlaying ? 'bg-red-500 text-white' : 'bg-green-500 text-white') : 'bg-gray-300 text-gray-500'}`}
            >
              {isPlaying ? '■ STOP' : '▶ PLAY'}
            </button>
          </div>
        </div>

        {/* Drum Pads */}
        <div className="bg-white rounded-lg p-4 border">
          <h2 className="font-bold mb-4">Pads</h2>
          <div className="grid grid-cols-3 gap-2">
            {DRUM_PADS.map(pad => (
              <button
                key={pad.note}
                onClick={() => testPad(pad.note)}
                disabled={!isLoaded}
                className={`p-4 rounded-xl font-medium text-white ${pad.color} hover:brightness-110 disabled:opacity-50`}
              >
                {pad.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logs */}
        <div className="bg-black rounded-lg p-4 border">
          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold text-white">Console</h2>
            <button
              onClick={() => setLogs([])}
              className="text-xs text-gray-400 hover:text-white"
            >
              Limpar
            </button>
          </div>
          <textarea
            value={logs.join('\n')}
            readOnly
            className="w-full h-64 bg-black text-green-400 font-mono text-sm p-2 rounded resize-none"
            placeholder="Logs aparecerão aqui..."
          />
        </div>
      </div>
    </div>
  )
}

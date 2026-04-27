'use client'

import { useState, useEffect } from 'react'
import * as Tone from 'tone'
import { getSamplerUrls } from '@/lib/drum-samples'

const PATTERN_ROCK_8 = [
  { time: 0, note: 'C1' },
  { time: 0, note: 'F#1' },
  { time: 2, note: 'D1' },
  { time: 2, note: 'F#1' },
  { time: 4, note: 'C1' },
  { time: 4, note: 'F#1' },
  { time: 6, note: 'D1' },
  { time: 6, note: 'F#1' },
]

const SAMPLE_URLS = {
  'C1': '/samples/drums/kick/V01-EQ-KD.wav',
  'D1': '/samples/drums/snare/V01-EQ-SD.wav',
  'F#1': '/samples/drums/hihat-closed/HHats-CL-V01-SABIAN-AAX.wav',
  'A#1': '/samples/drums/hihat-closed/HHats-OP-V01-SABIAN-AAX.wav',
  'C2': '/samples/drums/crash/14-Crash-V01-SABIAN-14.wav',
  'D2': '/samples/drums/ride/Ride-V01-ROBMOR-SABIAN-22.wav',
  'E2': '/samples/drums/tom/V01-TTom13.wav',
  'F2': '/samples/drums/tom/V01-TTom 10.wav',
  'G2': '/samples/drums/tom/V03-TTom 10.wav',
}

export default function DrumDebugPage() {
  const [logs, setLogs] = useState<string[]>([])
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [bpm, setBpm] = useState(120)
  const [seq, setSeq] = useState<Tone.Sequence | null>(null)

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`])
  }

  useEffect(() => {
    addLog('Init sampler with explicit URLs...')
    addLog('Version: 21dcaa2 - /data/samples/drums/')
    const s = new Tone.Sampler({
      urls: SAMPLE_URLS,
      onload: () => {
        addLog('Samples loaded!')
        setIsLoaded(true)
      },
      onerror: (err) => {
        addLog('Load error: ' + err)
      }
    }).toDestination()
    s.volume.value = 6
    setSampler(s)
    return () => { s.dispose() }
  }, [])

  const testDirect = (note: string) => {
    if (!sampler || !isLoaded) {
      addLog('Not ready: sampler=' + !!sampler + ' loaded=' + isLoaded)
      return
    }
    addLog('Testing membrane oscillator...')
    // Test audio with a simple synth first
    const synth = new Tone.MembraneSynth().toDestination()
    synth.triggerAttackRelease('C1', '8n')
    addLog('MembraneSynth played')
    
    setTimeout(() => {
      addLog('Now trying sampler...')
      try {
        sampler.triggerAttackRelease('C1', '8n')
        addLog('Sampler triggerAttackRelease done')
      } catch (e) {
        addLog('Sampler error: ' + e)
      }
    }, 500)
  }

  const startSeq = async () => {
    if (!sampler || !isLoaded) return
    await Tone.start()
    addLog('AudioContext started')
    
    Tone.Transport.bpm.value = bpm
    addLog('BPM: ' + bpm)
    
    // Use setInterval to trigger sounds
    let step = 0
    const intervalMs = (60 / bpm) * 1000 / 4  // 16th notes
    addLog('Interval: ' + intervalMs + 'ms')
    
    const timerId = setInterval(() => {
      addLog('Timer tick: ' + step)
      PATTERN_ROCK_8.forEach(hit => {
        if (Math.floor(hit.time * 2) % 16 === step) {
          addLog('Play: ' + hit.note)
          sampler.triggerAttackRelease(hit.note, '16n')
        }
      })
      step = (step + 1) % 16
    }, intervalMs)
    
    Tone.Transport.start()
    setSeq({ stop: () => clearInterval(timerId) } as any)
    setIsPlaying(true)
    addLog('Started with setInterval')
  }

  const stopSeq = () => {
    if (seq) {
      seq.stop()
      seq.dispose()
      setSeq(null)
    }
    Tone.Transport.stop()
    setIsPlaying(false)
    addLog('Stopped')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '2rem' }}>
      <div style={{ maxWidth: '40rem', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Drum Debug</h1>
        
        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          Status: 
          <span style={{ color: isLoaded ? 'green' : 'orange' }}>
            {isLoaded ? '✓ Samples OK' : '⏳ Loading...'}
          </span>
          {' | '}
          <span style={{ color: isPlaying ? 'red' : 'gray' }}>
            {isPlaying ? '▶ Playing' : '⏹ Stopped'}
          </span>
        </div>

        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <label>BPM:</label>
          <input 
            type="number" 
            value={bpm} 
            onChange={e => setBpm(Number(e.target.value))}
            style={{ width: '4rem', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.25rem' }}
          />
          <button 
            onClick={isPlaying ? stopSeq : startSeq}
            disabled={!isLoaded}
            style={{ 
              padding: '0.5rem 1rem', 
              background: isPlaying ? '#dc2626' : '#16a34a', 
              color: 'white', 
              borderRadius: '0.25rem',
              fontWeight: 'bold',
              opacity: isLoaded ? 1 : 0.5
            }}
          >
            {isPlaying ? '■ STOP' : '▶ PLAY'}
          </button>
        </div>

        <div style={{ background: 'white', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
          <h2 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Direct Test (no Transport)</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => testDirect('C1')} disabled={!isLoaded} style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', borderRadius: '0.25rem' }}>Kick</button>
            <button onClick={() => testDirect('D1')} disabled={!isLoaded} style={{ padding: '0.5rem 1rem', background: '#f97316', color: 'white', borderRadius: '0.25rem' }}>Snare</button>
            <button onClick={() => testDirect('F#1')} disabled={!isLoaded} style={{ padding: '0.5rem 1rem', background: '#eab308', color: 'white', borderRadius: '0.25rem' }}>HiHat</button>
          </div>
        </div>

        <div style={{ background: 'black', padding: '1rem', borderRadius: '0.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: 'bold' }}>Console</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={async () => {
                  const text = logs.join('\n')
                  try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                      await navigator.clipboard.writeText(text)
                      addLog('Copied to clipboard!')
                    } else {
                      throw new Error('Clipboard API not available')
                    }
                  } catch (err) {
                    // Fallback for HTTP or unsupported browsers
                    const ta = document.createElement('textarea')
                    ta.value = text
                    ta.style.position = 'fixed'
                    ta.style.left = '-9999px'
                    document.body.appendChild(ta)
                    ta.focus()
                    ta.select()
                    try {
                      document.execCommand('copy')
                      addLog('Copied to clipboard!')
                    } catch {
                      addLog('Copy failed. Select console text manually.')
                    }
                    document.body.removeChild(ta)
                  }
                }}
                style={{ fontSize: '0.75rem', color: '#9ca3af', background: 'none', border: '1px solid #374151', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}
              >
                📋 Copy
              </button>
              <button onClick={() => setLogs([])} style={{ fontSize: '0.75rem', color: '#9ca3af', background: 'none', border: '1px solid #374151', borderRadius: '0.25rem', padding: '0.25rem 0.5rem', cursor: 'pointer' }}>Clear</button>
            </div>
          </div>
          <textarea 
            readOnly 
            value={logs.join('\n')} 
            placeholder="Logs..."
            style={{ width: '100%', height: '16rem', background: 'black', color: '#22c55e', fontFamily: 'monospace', fontSize: '0.875rem', padding: '0.5rem', borderRadius: '0.25rem' }}
          />
        </div>

      </div>
    </div>
  )
}
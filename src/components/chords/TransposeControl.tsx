'use client'

import { useState } from 'react'
import { getAllKeys, formatKeyName, transposeCifra } from '@/utils/chord-transposer'

interface TransposeControlProps {
  musicaId: number
  tomOriginal: string | null
  cifra: string | null
  semitones: number
  onTranspose: (newTom: string, newCifra: string) => void
}

export function TransposeControl({ 
  musicaId, 
  tomOriginal, 
  cifra,
  semitones,
  onTranspose 
}: TransposeControlProps) {
  const [selectedTom, setSelectedTom] = useState(tomOriginal || 'C')
  const [saving, setSaving] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  
  const keys = getAllKeys()
  
  const handleTranspose = async (newTom: string) => {
    if (!tomOriginal || !cifra) return
    
    setSaving(true)
    setSelectedTom(newTom)
    setShowDropdown(false)
    
    try {
      // Calcula a cifra transposta
      const transposedCifra = transposeCifra(cifra, tomOriginal, newTom)
      
      // Salva no banco
      const response = await fetch(`/api/musicas/${musicaId}/transpose`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tom_original: newTom }),
      })
      
      if (!response.ok) {
        throw new Error('Erro ao salvar')
      }
      
      // Atualiza a UI com o novo tom e nova cifra
      onTranspose(newTom, transposedCifra)
    } catch (error) {
      console.error('[Transpose] Error:', error)
      alert('Erro ao transpor')
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Tom:</span>
      
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          disabled={saving}
          className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors disabled:opacity-50 flex items-center gap-1"
        >
          {saving ? (
            <span className="animate-spin">⏳</span>
          ) : (
            <>
              <span>{selectedTom}</span>
              <span className="text-xs opacity-70">({formatKeyName(selectedTom)})</span>
            </>
          )}
          <span className="ml-1">▼</span>
        </button>
        
        {showDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg z-20 grid grid-cols-4 gap-1 p-2 min-w-[200px]">
              {keys.map((key) => (
                <button
                  key={key}
                  onClick={() => handleTranspose(key)}
                  className={`px-2 py-1 rounded text-sm hover:bg-indigo-100 transition-colors ${
                    key === selectedTom 
                      ? 'bg-indigo-500 text-white hover:bg-indigo-600' 
                      : 'text-gray-700'
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
'use client'

import React from 'react'

interface CifraPreviewProps {
  cifra: string
  className?: string
}

/**
 * Converte formato ChordPro ([Am7]) para visualização com acordes acima da letra
 */
function chordProToVisualLines(cifraText: string): string[] {
  const lines = cifraText.split('\n')
  const result: string[] = []
  
  for (const line of lines) {
    // Se é linha de seção [Intro], [Refrão], etc.
    if (/^\s*\[.+\]\s*$/.test(line)) {
      result.push(line)
      continue
    }
    
    // Se é linha vazia
    if (!line.trim()) {
      result.push(line)
      continue
    }
    
    // Verifica se a linha tem acordes no formato ChordPro
    const chordRegex = /\[([A-G][#b]?(?:m|maj|min|dim|aug|sus|add|7|9|11|13|4|5|6|M|°|ø|\+)*(?:\/[A-G][#b]?)?)\]/g
    
    // Se não tem acordes, é linha de letra pura ou comentário
    if (!chordRegex.test(line)) {
      result.push(line)
      continue
    }
    
    // Extrai acordes e suas posições
    const chords: { chord: string; position: number }[] = []
    let match
    let lineWithoutChords = line
    
    // Precisamos calcular posições considerando o texto sem os colchetes
    let offset = 0
    chordRegex.lastIndex = 0
    
    while ((match = chordRegex.exec(line)) !== null) {
      const chord = match[1]
      const chordWithBrackets = match[0]
      const position = match.index - offset
      chords.push({ chord, position })
      offset += chordWithBrackets.length - chord.length
    }
    
    // Remove os colchetes para obter a letra pura
    const lyricsLine = line.replace(chordRegex, '$1')
    
    // Cria linha de acordes posicionados
    let chordLine = ''
    let lastPos = 0
    
    for (const { chord, position } of chords) {
      // Adiciona espaços até a posição do acorde
      while (chordLine.length < position) {
        chordLine += ' '
      }
      chordLine += chord
    }
    
    // Adiciona as linhas: acordes primeiro, depois letra
    if (chordLine.trim()) {
      result.push(chordLine)
    }
    result.push(lyricsLine)
  }
  
  return result
}

export function CifraPreview({ cifra, className = '' }: CifraPreviewProps) {
  const visualLines = chordProToVisualLines(cifra)
  
  return (
    <div className={`bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto ${className}`}>
      <pre className="font-mono text-sm leading-relaxed whitespace-pre">
        {visualLines.join('\n')}
      </pre>
    </div>
  )
}

export default CifraPreview

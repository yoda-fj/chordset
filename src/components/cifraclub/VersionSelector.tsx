'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, Guitar, Piano, Music, ChevronRight } from 'lucide-react'

interface CifraVersion {
  type: string
  label: string
  url: string
  instrument?: string
  difficulty?: string
}

interface VersionSelectorProps {
  isOpen: boolean
  onClose: () => void
  artist: string
  song: string
  onSelectVersion: (version: CifraVersion) => void
}

const INSTRUMENT_ICONS: Record<string, React.ReactNode> = {
  violao: <Guitar size={20} />,
  teclado: <Piano size={20} />,
  ukulele: <Music size={20} />,
  baixo: <Music size={20} />,
  guitarra: <Guitar size={20} />,
  cavaco: <Music size={20} />,
  viola: <Music size={20} />,
}

export function VersionSelector({ isOpen, onClose, artist, song, onSelectVersion }: VersionSelectorProps) {
  const [versions, setVersions] = useState<CifraVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !artist || !song) return

    async function fetchVersions() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/cifraclub/versions?artist=${encodeURIComponent(artist)}&song=${encodeURIComponent(song)}`)
        const data = await response.json()

        if (!data.success) {
          throw new Error(data.error || 'Erro ao buscar versões')
        }

        setVersions(data.versions || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao buscar versões')
        // Fallback: versão principal
        setVersions([{
          type: 'principal',
          label: 'Violão (Principal)',
          url: `https://www.cifraclub.com.br/${artist}/${song}`,
          instrument: 'violao',
        }])
      } finally {
        setLoading(false)
      }
    }

    fetchVersions()
  }, [isOpen, artist, song])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-raised rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Escolher Versão</h3>
            <p className="text-sm text-ink-muted">
              Selecione a versão ou instrumento desejado
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-ink-faint hover:text-ink-muted"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-brand" />
              <span className="ml-2 text-ink-muted">Buscando versões...</span>
            </div>
          ) : error && versions.length <= 1 ? (
            <div className="p-3 bg-brand/10 border border-brand/30 rounded-lg text-brand text-sm mb-4">
              {error}
            </div>
          ) : null}

          <div className="space-y-2">
            {versions.map((version) => (
              <button
                key={version.type}
                onClick={() => onSelectVersion(version)}
                className="w-full text-left p-4 border rounded-lg hover:bg-surface transition-colors flex items-center gap-4 group"
              >
                <div className="w-10 h-10 rounded-full bg-brand/15 text-brand flex items-center justify-center flex-shrink-0">
                  {INSTRUMENT_ICONS[version.instrument || 'violao'] || <Music size={20} />}
                </div>
                
                <div className="flex-1">
                  <div className="font-medium group-hover:text-brand transition-colors">
                    {version.label}
                  </div>
                  {version.difficulty && version.difficulty !== 'padrao' && (
                    <div className="text-xs text-ink-muted capitalize">
                      Dificuldade: {version.difficulty}
                    </div>
                  )}
                </div>

                <ChevronRight size={18} className="text-ink-faint group-hover:text-brand transition-colors" />
              </button>
            ))}
          </div>

          {versions.length === 0 && !loading && (
            <div className="text-center py-8 text-ink-muted">
              Nenhuma versão encontrada
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-surface">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-ink-muted hover:text-ink text-center"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}

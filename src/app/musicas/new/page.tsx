'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Download, X, Search, Camera, Music } from 'lucide-react'
import Link from 'next/link'
import { TagInput } from '@/components/setlist/TagInput'
import { ImportPhotoModal } from '@/components/ocr/ImportPhotoModal'

const TOM_OPCOES = ['C', 'Cm', 'D', 'Dm', 'E', 'Em', 'F', 'Fm', 'G', 'Gm', 'A', 'Am', 'B', 'Bm']

const TAG_SUGGESTIONS = ['louvor', 'adoracao', 'hino', 'clássico', 'contemporâneo', 'rock', 'gospel', 'natal', 'páscoa']

interface SearchResult {
  id: string;
  titulo: string;
  artista: string;
  tom?: string | null;
  url: string;
  image?: string;
}

interface ImportData {
  titulo: string;
  artista: string;
  tom_original?: string;
  cifra?: string;
  provider: string;
}

interface ExtractedData {
  titulo: string;
  artista: string;
  tom: string | null;
  cifra: string;
  observacoes?: string | null;
}

export default function NewMusicaPage() {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [artista, setArtista] = useState('')
  const [tomOriginal, setTomOriginal] = useState('')
  const [cifra, setCifra] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Import states
  const [showImport, setShowImport] = useState(false)
  const [showPhotoImport, setShowPhotoImport] = useState(false)
  const [importQuery, setImportQuery] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importResults, setImportResults] = useState<SearchResult[]>([])
  const [importError, setImportError] = useState<string | null>(null)
  const [selectedSong, setSelectedSong] = useState<ImportData | null>(null)
  const [importingSong, setImportingSong] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim() || !artista.trim()) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/musicas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          titulo: titulo.trim(),
          artista: artista.trim(),
          tom_original: tomOriginal || undefined,
          cifra: cifra.trim() || undefined,
          tags,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao salvar música')
      }

      router.push('/musicas')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar música')
      setSaving(false)
    }
  }

  // Import functions
  const handleSearchImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!importQuery.trim()) return

    setImportLoading(true)
    setImportError(null)
    setImportResults([])

    try {
      const response = await fetch('/api/import-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: importQuery.trim(), provider: 'cifraclub' }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || 'Erro ao buscar músicas')
      }

      setImportResults(data.results || [])

      if (data.results?.length === 0) {
        setImportError('Nenhuma música encontrada. Tente outro termo.')
      }
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erro ao buscar músicas')
    } finally {
      setImportLoading(false)
    }
  }

  const handlePhotoImport = (data: ExtractedData) => {
    setTitulo(data.titulo)
    setArtista(data.artista)
    setTomOriginal(data.tom || '')
    setCifra(data.cifra)
    setTags(data.observacoes ? [data.observacoes] : [])
  }

  const handleSelectResult = async (result: SearchResult) => {
    setImportingSong(true)
    setImportError(null)

    try {
      const response = await fetch('/api/import-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: result.url, provider: 'cifraclub', save: false }),
      })

      const data = await response.json()

      if (!data.success || !data.song) {
        throw new Error(data.error || 'Erro ao importar música')
      }

      // Fill form with imported data
      setTitulo(data.song.titulo)
      setArtista(data.song.artista)
      setTomOriginal(data.song.tom_original || '')
      setCifra(data.song.cifra || '')
      setTags([data.song.provider])
      
      setSelectedSong({
        titulo: data.song.titulo,
        artista: data.song.artista,
        tom_original: data.song.tom_original,
        cifra: data.song.cifra,
        provider: data.song.provider,
      })

      // Close import modal
      setShowImport(false)
      setImportResults([])
      setImportQuery('')
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Erro ao importar música')
    } finally {
      setImportingSong(false)
    }
  }

  const isValid = titulo.trim() && artista.trim()

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/musicas"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Voltar para Músicas
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nova Música</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white p-6 rounded-lg border space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: Amazing Grace"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Artista *
            </label>
            <input
              type="text"
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
              placeholder="Ex: John Newton"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tom Original
            </label>
            <select
              value={tomOriginal}
              onChange={(e) => setTomOriginal(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Selecionar tom...</option>
              {TOM_OPCOES.map((tom) => (
                <option key={tom} value={tom}>
                  {tom}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Tom em que a música foi originalmente gravada
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <TagInput
              tags={tags}
              onChange={setTags}
              suggestions={TAG_SUGGESTIONS}
              placeholder="Adicionar tag..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Adicione tags para facilitar a organização (ex: louvor, hino, clássico)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cifra
            </label>
            <textarea
              value={cifra}
              onChange={(e) => setCifra(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              placeholder="Cole aqui a cifra da música...&#10;&#10;Exemplo:&#10;Tom: G&#10;&#10;[Intro] G  D  Em  C&#10;&#10;[Verso 1]&#10;G              D&#10;Amazing grace..."
            />
            <p className="mt-1 text-xs text-gray-500">
              Use fonte monoespaçada para manter o alinhamento dos acordes
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <Download size={18} />
            Importar do Cifra Club
          </button>
          <button
            type="button"
            onClick={() => setShowPhotoImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <Camera size={18} />
            Importar via Foto
          </button>
          <Link
            href="/musicas"
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !isValid}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save size={18} />
                Salvar Música
              </>
            )}
          </button>
        </div>
      </form>

      {/* Import Modal */}
      {showImport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">Importar do Cifra Club</h3>
              <button
                onClick={() => {
                  setShowImport(false)
                  setImportQuery('')
                  setImportResults([])
                  setImportError(null)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b">
              <form onSubmit={handleSearchImport} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    value={importQuery}
                    onChange={(e) => setImportQuery(e.target.value)}
                    placeholder="Buscar música ou artista..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={importLoading || !importQuery.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {importLoading ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {importError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {importError}
                </div>
              )}

              {importLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-indigo-600" />
                  <span className="ml-2 text-gray-500">Buscando...</span>
                </div>
              ) : importResults.length > 0 ? (
                <div className="space-y-2">
                  {importResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      disabled={importingSong}
                      className="w-full text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-3"
                    >
                      {result.image ? (
                        <img
                          src={result.image}
                          alt={result.titulo}
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-gray-200 flex-shrink-0 flex items-center justify-center">
                          <Music size={20} className="text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.titulo}</div>
                        <div className="text-sm text-gray-500 truncate">{result.artista}</div>
                        {result.tom && (
                          <div className="text-xs text-indigo-600 mt-0.5">Tom: {result.tom}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Digite um termo de busca para encontrar músicas
                </div>
              )}
            </div>

            {importingSong && (
              <div className="p-4 border-t bg-gray-50">
                <div className="flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-indigo-600" />
                  <span className="ml-2 text-gray-600">Importando cifra...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Photo Import Modal */}
      <ImportPhotoModal
        isOpen={showPhotoImport}
        onClose={() => setShowPhotoImport(false)}
        onImport={handlePhotoImport}
      />
    </div>
  )
}

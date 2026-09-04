'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Loader2, Download, X, Search, Camera, Music } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { TagInput } from '@/components/setlist/TagInput'
import { ImportPhotoModal } from '@/components/ocr/ImportPhotoModal'
import { VersionSelector } from '@/components/cifraclub/VersionSelector'
import { CifraPreview } from '@/components/cifra/CifraPreview'
import { TOM_OPCOES, TAG_SUGGESTIONS_MUSICA } from '@/lib/constants'

interface SearchResult {
  id: string;
  titulo: string;
  artista: string;
  tom?: string | null;
  url: string;
  image?: string;
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
  const [cifraTab, setCifraTab] = useState<'edit' | 'preview'>('edit')
  
  // Import states
  const [showImport, setShowImport] = useState(false)
  const [showPhotoImport, setShowPhotoImport] = useState(false)
  const [importQuery, setImportQuery] = useState('')
  const [importLoading, setImportLoading] = useState(false)
  const [importResults, setImportResults] = useState<SearchResult[]>([])
  const [importError, setImportError] = useState<string | null>(null)
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

  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [showVersionSelector, setShowVersionSelector] = useState(false)

  const handleSelectResult = async (result: SearchResult) => {
    // Extrai artist e song da URL para buscar versões
    const urlParts = result.url.replace('https://www.cifraclub.com.br/', '').split('/')
    if (urlParts.length >= 2) {
      setSelectedResult(result)
      setShowVersionSelector(true)
    } else {
      // Fallback: importa direto se não conseguir extrair
      await importFromUrl(result.url)
    }
  }

  const handleSelectVersion = async (version: { type: string; label: string; url: string }) => {
    setShowVersionSelector(false)
    await importFromUrl(version.url)
  }

  const importFromUrl = async (url: string) => {
    setImportingSong(true)
    setImportError(null)

    try {
      const response = await fetch('/api/import-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, provider: 'cifraclub', save: false }),
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
          className="inline-flex items-center gap-2 text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={18} />
          Voltar para Músicas
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-ink mb-6">Nova Música</h1>

      {error && (
        <div className="mb-4 p-4 bg-danger/10 border border-danger/40 rounded-lg text-danger">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-surface-raised p-6 rounded-lg border space-y-6">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Título *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
              placeholder="Ex: Amazing Grace"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Artista *
            </label>
            <input
              type="text"
              value={artista}
              onChange={(e) => setArtista(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
              placeholder="Ex: John Newton"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Tom Original
            </label>
            <select
              value={tomOriginal}
              onChange={(e) => setTomOriginal(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand bg-surface-raised"
            >
              <option value="">Selecionar tom...</option>
              {TOM_OPCOES.map((tom) => (
                <option key={tom} value={tom}>
                  {tom}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ink-muted">
              Tom em que a música foi originalmente gravada
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Tags
            </label>
            <TagInput
              tags={tags}
              onChange={setTags}
              suggestions={TAG_SUGGESTIONS_MUSICA}
              placeholder="Adicionar tag..."
            />
            <p className="mt-1 text-xs text-ink-muted">
              Adicione tags para facilitar a organização (ex: louvor, hino, clássico)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Cifra
            </label>
            
            {/* Abas Editar/Preview */}
            <div className="flex border-b border-ink/10 mb-2">
              <button
                type="button"
                onClick={() => setCifraTab('edit')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  cifraTab === 'edit'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                Editar
              </button>
              <button
                type="button"
                onClick={() => setCifraTab('preview')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  cifraTab === 'preview'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-ink-muted hover:text-ink'
                }`}
              >
                Preview
              </button>
            </div>
            
            {/* Conteúdo da aba */}
            <div className="relative">
              {cifraTab === 'edit' ? (
                <>
                  <textarea
                    value={cifra}
                    onChange={(e) => setCifra(e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand font-mono text-sm"
                    placeholder="Cole aqui a cifra da música...&#10;&#10;Exemplo:&#10;Tom: G&#10;&#10;[Intro] G  D  Em  C&#10;&#10;[Verso 1]&#10;G              D&#10;Amazing grace..."
                  />
                  <p className="mt-1 text-xs text-ink-muted">
                    Use fonte monoespaçada para manter o alinhamento dos acordes
                  </p>
                </>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-64 overflow-y-auto">
                    {cifra.trim() ? (
                      <CifraPreview cifra={cifra} />
                    ) : (
                      <div className="p-8 text-center text-ink-faint text-sm">
                        Nenhuma cifra para preview
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => setShowImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-brand border border-brand rounded-lg hover:bg-brand/10 transition-colors"
          >
            <Download size={18} />
            Importar do Cifra Club
          </button>
          <button
            type="button"
            onClick={() => setShowPhotoImport(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-brand border border-brand rounded-lg hover:bg-brand/10 transition-colors"
          >
            <Camera size={18} />
            Importar via Foto
          </button>
          <Link
            href="/musicas"
            className="px-4 py-2 text-ink-muted hover:text-ink"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={saving || !isValid}
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
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
          <div className="bg-surface-raised rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">Importar do Cifra Club</h3>
              <button
                onClick={() => {
                  setShowImport(false)
                  setImportQuery('')
                  setImportResults([])
                  setImportError(null)
                }}
                className="text-ink-faint hover:text-ink-muted"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 border-b">
              <form onSubmit={handleSearchImport} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                  <input
                    type="text"
                    value={importQuery}
                    onChange={(e) => setImportQuery(e.target.value)}
                    placeholder="Buscar música ou artista..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={importLoading || !importQuery.trim()}
                  className="px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 disabled:opacity-50"
                >
                  {importLoading ? <Loader2 size={18} className="animate-spin" /> : 'Buscar'}
                </button>
              </form>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {importError && (
                <div className="mb-4 p-3 bg-danger/10 border border-danger/40 rounded-lg text-danger text-sm">
                  {importError}
                </div>
              )}

              {importLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-brand" />
                  <span className="ml-2 text-ink-muted">Buscando...</span>
                </div>
              ) : importResults.length > 0 ? (
                <div className="space-y-2">
                  {importResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectResult(result)}
                      disabled={importingSong}
                      className="w-full text-left p-3 border rounded-lg hover:bg-surface transition-colors disabled:opacity-50 flex items-center gap-3"
                    >
                      {result.image ? (
                        <Image
                          src={result.image}
                          alt={result.titulo}
                          width={48}
                          height={48}
                          unoptimized
                          className="w-12 h-12 rounded object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded bg-surface-overlay flex-shrink-0 flex items-center justify-center">
                          <Music size={20} className="text-ink-faint" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{result.titulo}</div>
                        <div className="text-sm text-ink-muted truncate">{result.artista}</div>
                        {result.tom && (
                          <div className="text-xs text-brand mt-0.5">Tom: {result.tom}</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-ink-muted">
                  Digite um termo de busca para encontrar músicas
                </div>
              )}
            </div>

            {importingSong && (
              <div className="p-4 border-t bg-surface">
                <div className="flex items-center justify-center">
                  <Loader2 size={20} className="animate-spin text-brand" />
                  <span className="ml-2 text-ink-muted">Importando cifra...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Version Selector Modal */}
      {selectedResult && (
        <VersionSelector
          isOpen={showVersionSelector}
          onClose={() => {
            setShowVersionSelector(false)
            setSelectedResult(null)
          }}
          artist={selectedResult.url.replace('https://www.cifraclub.com.br/', '').split('/')[0]}
          song={selectedResult.url.replace('https://www.cifraclub.com.br/', '').split('/')[1]}
          onSelectVersion={handleSelectVersion}
        />
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

'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, CheckCircle2, AlertTriangle, XCircle, CircleDashed } from 'lucide-react'
import { parseBulkImportLines, BULK_IMPORT_DELAY_MS, type BulkImportItem } from '@/lib/bulk-import'

type LineStatus = 'pending' | 'importing' | 'imported' | 'exists' | 'error'

interface BulkLine {
  item: BulkImportItem
  status: LineStatus
  titulo?: string
  artista?: string
  message?: string
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

interface BulkImportModalProps {
  isOpen: boolean
  onClose: () => void
}

export function BulkImportModal({ isOpen, onClose }: BulkImportModalProps) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [lines, setLines] = useState<BulkLine[]>([])
  const [running, setRunning] = useState(false)
  const [started, setStarted] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const cancelRef = useRef(false)

  const updateLine = (index: number, patch: Partial<BulkLine>) => {
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)))
  }

  const handleImportAll = async () => {
    const items = parseBulkImportLines(text)
    if (items.length === 0 || running) return

    cancelRef.current = false
    setCancelled(false)
    setRunning(true)
    setStarted(true)
    setLines(items.map((item) => ({ item, status: 'pending' })))

    for (let i = 0; i < items.length; i++) {
      if (cancelRef.current) break
      updateLine(i, { status: 'importing' })

      const item = items[i]

      try {
        let url: string | null = item.kind === 'url' ? item.url : null

        if (!url) {
          const query = item.kind === 'query' ? item.query : ''
          const searchRes = await fetch('/api/import-song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, provider: 'cifraclub' }),
          })
          const searchData = await searchRes.json()
          if (cancelRef.current) break
          if (!searchRes.ok || !searchData.success) {
            throw new Error(searchData.error || 'Erro ao buscar música')
          }
          const first = searchData.results?.[0]
          if (!first) {
            throw new Error('Nenhum resultado encontrado para essa busca')
          }
          url = first.url
          // Pausa também entre a busca e a importação da mesma linha
          await sleep(BULK_IMPORT_DELAY_MS)
          if (cancelRef.current) break
        }

        const importRes = await fetch('/api/import-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, provider: 'cifraclub', save: true }),
        })
        const data = await importRes.json()
        if (cancelRef.current) break

        if (!importRes.ok || !data.success) {
          updateLine(i, { status: 'error', message: data.error || 'Erro ao importar música' })
        } else if (data.alreadyExists) {
          updateLine(i, {
            status: 'exists',
            titulo: data.song?.titulo,
            artista: data.song?.artista,
          })
        } else if (data.saved) {
          updateLine(i, {
            status: 'imported',
            titulo: data.song?.titulo,
            artista: data.song?.artista,
          })
        } else {
          updateLine(i, {
            status: 'error',
            message: data.error || 'Música encontrada mas não foi possível salvar no banco',
          })
        }
      } catch (err) {
        updateLine(i, {
          status: 'error',
          message: err instanceof Error ? err.message : 'Erro ao importar música',
        })
      }

      // Pausa entre uma música e a próxima para não disparar o rate limit
      if (i < items.length - 1) await sleep(BULK_IMPORT_DELAY_MS)
    }

    // Linha que estava em andamento quando o cancelamento aconteceu volta a ficar pendente
    setLines((prev) =>
      prev.map((line) => (line.status === 'importing' ? { ...line, status: 'pending' } : line))
    )
    setRunning(false)
  }

  const handleCancel = () => {
    setCancelled(true)
    cancelRef.current = true
  }

  const handleClose = () => {
    if (running) return
    setText('')
    setLines([])
    setStarted(false)
    setCancelled(false)
    onClose()
  }

  const processedCount = lines.filter((l) => l.status !== 'pending' && l.status !== 'importing').length
  const importedCount = lines.filter((l) => l.status === 'imported').length
  const existsCount = lines.filter((l) => l.status === 'exists').length
  const errorCount = lines.filter((l) => l.status === 'error').length

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-surface-raised rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Importar várias do Cifra Club</h3>
            <p className="text-sm text-ink-muted">
              Uma música por linha: URL ou &quot;artista nome da música&quot;
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={running}
            className="text-ink-faint hover:text-ink-muted disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto">
          <div>
            <label htmlFor="bulk-import-textarea" className="block text-sm font-medium text-ink mb-1">
              Músicas para importar
            </label>
            <textarea
              id="bulk-import-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              disabled={running}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand font-mono text-sm disabled:opacity-60"
              placeholder={'https://www.cifraclub.com.br/coldplay/the-scientist\ncoldplay yellow\nu2 with or without you'}
            />
            <p className="mt-1 text-xs text-ink-muted">
              Para não disparar a proteção do Cifra Club contra acessos em rajada, as músicas são
              importadas uma de cada vez, com pausa de ~{(BULK_IMPORT_DELAY_MS / 1000).toFixed(1)}s
              entre os pedidos. Buscas em texto livre usam o primeiro resultado (versão principal).
            </p>
          </div>

          <div className="flex items-center gap-3">
            {running ? (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-4 py-2 border border-danger text-danger rounded-lg hover:bg-danger/10 transition-colors"
              >
                <X size={18} />
                Cancelar importação
              </button>
            ) : (
              <button
                type="button"
                onClick={handleImportAll}
                disabled={!text.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-on-accent rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
              >
                Importar tudo
              </button>
            )}
            {lines.length > 0 && (
              <span className="text-sm text-ink-muted">
                Progresso: {processedCount}/{lines.length}
              </span>
            )}
          </div>

          {started && !running && (
            <p className="text-sm text-ink-muted">
              {cancelled
                ? 'Importação cancelada.'
                : `Importação concluída: ${importedCount} importada(s), ${existsCount} já existia(m), ${errorCount} erro(s).`}
            </p>
          )}

          {lines.length > 0 && (
            <ul className="space-y-1 border rounded-lg divide-y divide-ink/10">
              {lines.map((line, i) => (
                <li key={i} className="flex items-start gap-2 px-3 py-2 text-sm">
                  <span className="mt-0.5 flex-shrink-0">
                    {line.status === 'pending' && <CircleDashed size={16} className="text-ink-faint" />}
                    {line.status === 'importing' && <Loader2 size={16} className="animate-spin text-brand" />}
                    {line.status === 'imported' && <CheckCircle2 size={16} className="text-success" />}
                    {line.status === 'exists' && <AlertTriangle size={16} className="text-brand" />}
                    {line.status === 'error' && <XCircle size={16} className="text-danger" />}
                  </span>
                  <div className="flex-1 min-w-0">
                    {line.status === 'imported' && (
                      <span className="text-success">
                        Importada: {line.titulo || line.item.raw}
                        {line.artista ? ` — ${line.artista}` : ''}
                      </span>
                    )}
                    {line.status === 'exists' && (
                      <span className="text-brand">
                        Já existe: {line.titulo || line.item.raw}
                        {line.artista ? ` — ${line.artista}` : ''}
                      </span>
                    )}
                    {line.status === 'error' && (
                      <>
                        <span className="text-danger">Erro: {line.item.raw}</span>
                        {line.message && (
                          <span className="block text-xs text-ink-muted">{line.message}</span>
                        )}
                      </>
                    )}
                    {(line.status === 'pending' || line.status === 'importing') && (
                      <span className="text-ink-muted">{line.item.raw}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {started && !running && (
          <div className="p-4 border-t bg-surface flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/musicas')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-on-accent rounded-lg hover:bg-brand-600 transition-colors"
            >
              Concluir
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

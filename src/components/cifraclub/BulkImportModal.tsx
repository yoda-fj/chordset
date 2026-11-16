'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, CheckCircle2, AlertTriangle, XCircle, CircleDashed, Clock } from 'lucide-react'
import { parseBulkImportLines, BULK_IMPORT_DELAY_MS, type BulkImportItem } from '@/lib/bulk-import'
import { sleepCancellable } from '@/lib/sleep'

type LineStatus = 'pending' | 'importing' | 'waiting' | 'imported' | 'exists' | 'error'

interface BulkLine {
  item: BulkImportItem
  status: LineStatus
  titulo?: string
  artista?: string
  message?: string
}

/** Máximo de tentativas por linha quando a API responde 429. */
const MAX_RETRY_ATTEMPTS = 3

/** retryAfterSec do body 429 quando ausente/inválido. */
const DEFAULT_RETRY_AFTER_SEC = 30

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
      const item = items[i]
      let attempt = 0
      let lineDone = false

      while (!lineDone) {
        if (cancelRef.current) break
        attempt += 1
        updateLine(i, { status: 'importing', message: undefined })

        try {
          // Uma única requisição por linha: o modo combinado {query, save: true}
          // busca o primeiro resultado e já importa (economiza o rate limit).
          const body =
            item.kind === 'url'
              ? { url: item.url, provider: 'cifraclub', save: true }
              : { query: item.query, provider: 'cifraclub', save: true }

          const res = await fetch('/api/import-song', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          const data = await res.json()
          if (cancelRef.current) break

          if (res.status === 429) {
            const parsedRetry = Number(data?.retryAfterSec)
            const retryAfterSec =
              Number.isFinite(parsedRetry) && parsedRetry > 0 ? Math.ceil(parsedRetry) : DEFAULT_RETRY_AFTER_SEC

            if (attempt >= MAX_RETRY_ATTEMPTS) {
              updateLine(i, {
                status: 'error',
                message: data.error || `Rate limit não liberou após ${MAX_RETRY_ATTEMPTS} tentativas`,
              })
              lineDone = true
            } else {
              updateLine(i, {
                status: 'waiting',
                message: `Aguardando rate limit (${retryAfterSec}s)...`,
              })
              if (!(await sleepCancellable(retryAfterSec * 1000, () => cancelRef.current))) break
            }
            continue
          }

          if (!res.ok || !data.success) {
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
          lineDone = true
        } catch (err) {
          updateLine(i, {
            status: 'error',
            message: err instanceof Error ? err.message : 'Erro ao importar música',
          })
          lineDone = true
        }
      }

      if (cancelRef.current) break

      // Pausa entre uma música e a próxima para não disparar o rate limit
      if (i < items.length - 1) {
        if (!(await sleepCancellable(BULK_IMPORT_DELAY_MS, () => cancelRef.current))) break
      }
    }

    // Linha que estava em andamento quando o cancelamento aconteceu volta a ficar pendente
    setLines((prev) =>
      prev.map((line) =>
        line.status === 'importing' || line.status === 'waiting'
          ? { ...line, status: 'pending', message: undefined }
          : line
      )
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

  const processedCount = lines.filter(
    (l) => l.status === 'imported' || l.status === 'exists' || l.status === 'error'
  ).length
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
              entre elas. Se o limite da API estourar, a importação aguarda e tenta de novo
              sozinha. Buscas em texto livre usam o primeiro resultado (versão principal).
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
                    {line.status === 'waiting' && <Clock size={16} className="text-brand" />}
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
                    {line.status === 'waiting' && (
                      <span className="text-ink-muted">{line.message || line.item.raw}</span>
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

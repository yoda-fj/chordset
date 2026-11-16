'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  CircleDashed,
  Clock,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Wrench,
  X,
  XCircle,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'
import { ErrorState } from '@/components/ui/EmptyState'
import type { Musica } from '@/types/database'
import { BULK_IMPORT_DELAY_MS } from '@/lib/bulk-import'
import { sleepCancellable } from '@/lib/sleep'
import {
  decideReimportResponse,
  REIMPORT_BATCH_MAX_ATTEMPTS,
} from '@/lib/reimport-batch'
import type { ReimportCandidate } from '@/lib/reimport'

type FixStatus = 'pending' | 'importing' | 'waiting' | 'choice' | 'done' | 'error'

interface FixItem {
  musica: Musica
  status: FixStatus
  message?: string
}

interface PendingChoice {
  index: number
  candidates: ReimportCandidate[]
}

export default function ReimportarCifrasPage() {
  const [musicas, setMusicas] = useState<Musica[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  const [items, setItems] = useState<FixItem[]>([])
  const [running, setRunning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [pendingChoice, setPendingChoice] = useState<PendingChoice | null>(null)

  const cancelRef = useRef(false)
  const runListRef = useRef<Musica[]>([])
  const choiceResolverRef = useRef<((url: string | null) => void) | null>(null)

  useEffect(() => {
    async function fetchMusicas() {
      try {
        setLoading(true)
        setLoadError(null)
        const response = await fetch('/api/musicas')
        if (!response.ok) throw new Error('Erro ao carregar músicas')
        setMusicas(await response.json())
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }
    fetchMusicas()
  }, [])

  const filteredMusicas = useMemo(() => {
    const term = searchTerm.toLowerCase()
    return musicas.filter(
      (m) => m.titulo.toLowerCase().includes(term) || m.artista.toLowerCase().includes(term)
    )
  }, [musicas, searchTerm])

  const filteredIds = useMemo(() => new Set(filteredMusicas.map((m) => m.id)), [filteredMusicas])

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectFiltered = () => setSelectedIds(new Set(filteredIds))

  const selectWithoutUrl = () => {
    setSelectedIds(new Set(musicas.filter((m) => !m.cifra_url).map((m) => m.id)))
  }

  const clearSelection = () => setSelectedIds(new Set())

  const updateItem = (index: number, patch: Partial<FixItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  // Pausa o lote e abre o modal de candidatas; resolve com a URL escolhida
  // (ou null quando o usuário fecha o modal, o que marca a música como erro).
  const waitForChoice = (index: number, candidates: ReimportCandidate[]) =>
    new Promise<string | null>((resolve) => {
      choiceResolverRef.current = resolve
      setPendingChoice({ index, candidates })
      updateItem(index, { status: 'choice', message: 'Aguardando escolha da versão...' })
    })

  const resolveChoice = (url: string | null) => {
    setPendingChoice(null)
    choiceResolverRef.current?.(url)
    choiceResolverRef.current = null
  }

  const processItem = async (index: number) => {
    const musica = runListRef.current[index]
    let chosenUrl: string | undefined
    let done = false
    let attempt = 0

    while (!done) {
      if (cancelRef.current) return
      attempt += 1
      updateItem(index, { status: 'importing', message: undefined })

      let res: Response
      try {
        res = await fetch('/api/musicas/reimportar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: musica.id, ...(chosenUrl ? { url: chosenUrl } : {}) }),
        })
      } catch {
        updateItem(index, { status: 'error', message: 'Falha de rede ao re-importar' })
        return
      }

      const data = await res.json().catch(() => null)
      if (cancelRef.current) return

      const decision = decideReimportResponse(res.status, data)

      switch (decision.kind) {
        case 'success':
          updateItem(index, {
            status: 'done',
            message: `Tom ${decision.tom ?? 'não detectado'} · ${decision.linhas} linhas`,
          })
          done = true
          break

        case 'needChoice': {
          const url = await waitForChoice(index, decision.candidates)
          if (cancelRef.current) return
          if (url === null) {
            updateItem(index, { status: 'error', message: 'Múltiplos resultados — nenhuma versão escolhida' })
            done = true
          } else {
            chosenUrl = url
          }
          break
        }

        case 'rateLimited':
          if (attempt >= REIMPORT_BATCH_MAX_ATTEMPTS) {
            updateItem(index, {
              status: 'error',
              message: `Rate limit não liberou após ${REIMPORT_BATCH_MAX_ATTEMPTS} tentativas`,
            })
            done = true
          } else {
            updateItem(index, { status: 'waiting', message: `Aguardando rate limit (${decision.retryAfterSec}s)...` })
            const completed = await sleepCancellable(decision.retryAfterSec * 1000, () => cancelRef.current)
            if (!completed) return
          }
          break

        case 'error':
          updateItem(index, { status: 'error', message: decision.message })
          done = true
          break
      }
    }
  }

  const handleStart = async () => {
    const selected = musicas
      .filter((m) => selectedIds.has(m.id))
      .sort((a, b) => a.titulo.localeCompare(b.titulo, 'pt-BR'))

    if (selected.length === 0 || running) return
    if (!confirm(
      `Re-importar a cifra de ${selected.length} música(s)? A cifra atual será substituída pela versão do Cifra Club.`
    )) return

    cancelRef.current = false
    setCancelled(false)
    setFinished(false)
    setRunning(true)
    runListRef.current = selected
    setItems(selected.map((musica) => ({ musica, status: 'pending' })))

    for (let i = 0; i < selected.length; i++) {
      if (cancelRef.current) break
      await processItem(i)
      if (cancelRef.current) break
      if (i < selected.length - 1) {
        const completed = await sleepCancellable(BULK_IMPORT_DELAY_MS, () => cancelRef.current)
        if (!completed) break
      }
    }

    // Música que estava em andamento quando o cancelamento aconteceu volta a ficar pendente
    setItems((prev) =>
      prev.map((item) =>
        item.status === 'importing' || item.status === 'waiting' || item.status === 'choice'
          ? { ...item, status: 'pending', message: undefined }
          : item
      )
    )
    setRunning(false)
    setFinished(true)
  }

  const handleCancel = () => {
    setCancelled(true)
    cancelRef.current = true
    // Se estiver aguardando escolha, fecha o modal e libera o lote
    if (pendingChoice) resolveChoice(null)
  }

  const handleReset = () => {
    if (running) return
    setItems([])
    setFinished(false)
    setCancelled(false)
  }

  const doneCount = items.filter((i) => i.status === 'done').length
  const errorCount = items.filter((i) => i.status === 'error').length
  const processedCount = items.filter((i) => i.status === 'done' || i.status === 'error').length

  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      </div>
    )
  }

  if (loadError) {
    return <ErrorState message={loadError} onRetry={() => window.location.reload()} />
  }

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

      <div className="flex items-start justify-between gap-4 mb-2">
        <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
          <Wrench size={22} className="text-brand" />
          Corrigir cifras
        </h1>
      </div>
      <p className="text-sm text-ink-muted mb-6 max-w-2xl">
        Re-importa a cifra de músicas já cadastradas direto do Cifra Club — útil para corrigir
        cifras que vieram com formatação quebrada. Músicas com URL salva usam a mesma página;
        as demais são buscadas por título e artista (pode pedir para escolher a versão).
        A cifra atual é <strong className="text-ink">substituída</strong>.
      </p>

      {items.length === 0 ? (
        <>
          {/* Seleção */}
          <div className="mb-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={20} />
              <input
                type="text"
                placeholder="Buscar por título ou artista..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button
                type="button"
                onClick={selectFiltered}
                className="px-3 py-1.5 border rounded-lg text-ink-muted hover:text-ink hover:bg-surface transition-colors"
              >
                Selecionar visíveis ({filteredMusicas.length})
              </button>
              <button
                type="button"
                onClick={selectWithoutUrl}
                className="px-3 py-1.5 border rounded-lg text-ink-muted hover:text-ink hover:bg-surface transition-colors"
              >
                Selecionar sem URL salva ({musicas.filter((m) => !m.cifra_url).length})
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="px-3 py-1.5 border rounded-lg text-ink-muted hover:text-ink hover:bg-surface transition-colors"
              >
                Limpar seleção
              </button>
            </div>
          </div>

          <ul className="border rounded-lg divide-y divide-ink/10 max-h-[55vh] overflow-y-auto">
            {filteredMusicas.map((musica) => (
              <li key={musica.id}>
                <label className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-surface transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(musica.id)}
                    onChange={() => toggleSelection(musica.id)}
                    className="w-4 h-4 accent-brand flex-shrink-0"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium truncate">{musica.titulo}</span>
                    <span className="block text-sm text-ink-muted truncate">{musica.artista}</span>
                  </span>
                  {musica.cifra_url ? (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-success/10 text-success rounded-full flex-shrink-0">
                      <Link2 size={12} />
                      URL salva
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-brand/10 text-brand-600 rounded-full flex-shrink-0">
                      <Search size={12} />
                      via busca
                    </span>
                  )}
                  {!musica.cifra && (
                    <span className="text-xs px-2 py-1 bg-surface-overlay text-ink-faint rounded-full flex-shrink-0">
                      sem cifra
                    </span>
                  )}
                </label>
              </li>
            ))}
            {filteredMusicas.length === 0 && (
              <li className="px-3 py-8 text-center text-ink-muted text-sm">
                Nenhuma música encontrada com esse filtro
              </li>
            )}
          </ul>

          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={handleStart}
              disabled={selectedIds.size === 0}
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-on-accent rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
            >
              <RefreshCw size={18} />
              Re-importar {selectedIds.size > 0 ? `(${selectedIds.size})` : ''}
            </button>
            <span className="text-sm text-ink-muted">
              Uma de cada vez, com pausa de ~{(BULK_IMPORT_DELAY_MS / 1000).toFixed(1)}s entre músicas
            </span>
          </div>
        </>
      ) : (
        <>
          {/* Execução */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {running ? (
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-2 px-4 py-2 border border-danger text-danger rounded-lg hover:bg-danger/10 transition-colors"
              >
                <X size={18} />
                Cancelar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 border rounded-lg text-ink-muted hover:text-ink hover:bg-surface transition-colors"
              >
                <ArrowLeft size={18} />
                Voltar à seleção
              </button>
            )}
            <span className="text-sm text-ink-muted">
              Progresso: {processedCount}/{items.length}
              {doneCount > 0 && ` · ${doneCount} corrigida(s)`}
              {errorCount > 0 && ` · ${errorCount} erro(s)`}
            </span>
          </div>

          {finished && !running && (
            <p className="mb-4 text-sm text-ink-muted">
              {cancelled
                ? 'Re-importação cancelada.'
                : `Concluída: ${doneCount} corrigida(s), ${errorCount} erro(s) de ${items.length}.`}
            </p>
          )}

          <ul className="border rounded-lg divide-y divide-ink/10">
            {items.map((item) => (
              <li key={item.musica.id} className="flex items-start gap-2 px-3 py-2.5 text-sm">
                <span className="mt-0.5 flex-shrink-0">
                  {item.status === 'pending' && <CircleDashed size={16} className="text-ink-faint" />}
                  {item.status === 'importing' && <Loader2 size={16} className="animate-spin text-brand" />}
                  {item.status === 'waiting' && <Clock size={16} className="text-brand" />}
                  {item.status === 'choice' && <AlertTriangle size={16} className="text-brand" />}
                  {item.status === 'done' && <CheckCircle2 size={16} className="text-success" />}
                  {item.status === 'error' && <XCircle size={16} className="text-danger" />}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{item.musica.titulo}</span>
                  <span className="text-ink-muted"> — {item.musica.artista}</span>
                  {item.status === 'done' && (
                    <span className="block text-xs text-success">{item.message}</span>
                  )}
                  {item.status === 'error' && (
                    <span className="block text-xs text-danger">{item.message}</span>
                  )}
                  {(item.status === 'waiting' || item.status === 'choice') && (
                    <span className="block text-xs text-ink-muted">{item.message}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Modal de escolha de versão (needChoice) */}
      {pendingChoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-raised rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-medium">Escolha a versão</h3>
              <button
                onClick={() => resolveChoice(null)}
                className="text-ink-faint hover:text-ink-muted"
                aria-label="Pular esta música"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-ink-muted mb-3">
                Mais de um resultado para &quot;{runListRef.current[pendingChoice.index]?.titulo}&quot;.
                Escolha a versão para re-importar (ou feche para pular esta música).
              </p>
              <div className="space-y-2">
                {pendingChoice.candidates.map((candidate) => (
                  <button
                    key={candidate.url}
                    type="button"
                    onClick={() => resolveChoice(candidate.url)}
                    className="w-full text-left p-3 border rounded-lg hover:bg-surface transition-colors"
                  >
                    <div className="font-medium">{candidate.titulo}</div>
                    <div className="text-sm text-ink-muted">{candidate.artista}</div>
                    <div className="text-xs text-ink-faint truncate mt-1">{candidate.url}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

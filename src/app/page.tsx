'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Play, Music, Calendar, LayoutTemplate, Guitar, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import type { EventoWithTemplate } from '@/types/database'

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

export default function Home() {
  const [eventos, setEventos] = useState<EventoWithTemplate[] | null>(null)

  useEffect(() => {
    fetch('/api/eventos')
      .then((r) => (r.ok ? r.json() : []))
      .then(setEventos)
      .catch(() => setEventos([]))
  }, [])

  const hoje = new Date().toISOString().slice(0, 10)
  const showDeHoje = eventos?.find(
    (e) => e.data === hoje && e.status !== 'cancelado'
  )
  const proximos =
    eventos
      ?.filter((e) => e.data && e.data >= hoje && e.status !== 'cancelado')
      .sort((a, b) => (a.data! < b.data! ? -1 : 1))
      .slice(0, 3) ?? []

  return (
    <div className="space-y-10">
      {/* Hero */}
      <motion.div {...fadeUp} className="text-center pt-10 pb-4">
        <h1 className="font-display text-4xl md:text-stage-lg font-bold text-ink mb-3">
          ChordSet
        </h1>
        <p className="text-lg text-ink-muted">
          Seu repertório, do ensaio ao palco.
        </p>
      </motion.div>

      {/* Show de hoje */}
      {eventos === null ? (
        <Skeleton className="h-28 max-w-2xl mx-auto" />
      ) : showDeHoje ? (
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="max-w-2xl mx-auto">
          <Link href={`/eventos/${showDeHoje.id}/setlist`} className="block group">
            <div className="flex items-center justify-between gap-4 rounded-xl2 border border-brand/40 bg-brand/10 px-6 py-5 transition-colors group-hover:bg-brand/15">
              <div>
                <p className="text-sm font-medium text-brand mb-1">🎤 Show de hoje</p>
                <p className="font-display text-xl font-semibold text-ink">
                  {showDeHoje.nome}
                </p>
                {showDeHoje.local && (
                  <p className="text-sm text-ink-muted">{showDeHoje.local}</p>
                )}
              </div>
              <span className="inline-flex items-center gap-2 rounded-xl2 bg-brand px-6 py-4 text-stage-sm font-semibold text-zinc-950 transition-transform group-hover:scale-105">
                <Play size={22} />
                Começar show
              </span>
            </div>
          </Link>
        </motion.div>
      ) : proximos.length > 0 ? (
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="max-w-2xl mx-auto">
          <Card className="py-4">
            <p className="text-sm font-medium text-ink-muted mb-3">Próximos eventos</p>
            <ul className="divide-y divide-ink/10">
              {proximos.map((e) => (
                <li key={e.id}>
                  <Link
                    href={`/eventos/${e.id}`}
                    className="flex items-center justify-between py-2.5 group"
                  >
                    <span className="text-ink group-hover:text-brand transition-colors">
                      {e.nome}
                    </span>
                    <span className="text-sm text-ink-faint">
                      {new Date(e.data!).toLocaleDateString('pt-BR')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      ) : (
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="max-w-2xl mx-auto text-center">
          <p className="text-ink-muted mb-4">Nenhum evento por aqui ainda.</p>
          <Link
            href="/eventos/new"
            className="inline-flex items-center gap-2 rounded-xl2 bg-brand px-6 py-3 font-medium text-zinc-950 hover:bg-brand-600 transition-colors"
          >
            Criar primeiro evento
            <ArrowRight size={18} />
          </Link>
        </motion.div>
      )}

      {/* Seções */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {[
          { href: '/musicas', label: 'Músicas', desc: 'Repertório e cifras', icon: Music },
          { href: '/eventos', label: 'Eventos', desc: 'Shows e setlists', icon: Calendar },
          { href: '/templates', label: 'Templates', desc: 'Setlists modelo', icon: LayoutTemplate },
          { href: '/ensaios', label: 'Ensaios', desc: 'Sessões de prática', icon: Guitar },
        ].map(({ href, label, desc, icon: Icon }, i) => (
          <motion.div
            key={href}
            {...fadeUp}
            transition={{ delay: 0.1 + i * 0.05 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link href={href} className="block h-full">
              <Card className="h-full transition-colors hover:border-brand/40 hover:bg-surface-overlay">
                <Icon size={24} className="text-brand mb-3" />
                <p className="font-display font-semibold text-ink">{label}</p>
                <p className="text-sm text-ink-faint">{desc}</p>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

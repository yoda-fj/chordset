import Link from 'next/link'

export default function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-ink mb-4">
        Bem-vindo ao Setlist Tools
      </h1>
      <p className="text-lg text-ink-muted mb-8">
        Gerencie seus templates e eventos musicais
      </p>
      <div className="flex justify-center gap-4">
        <Link
          href="/templates"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-zinc-950 bg-brand hover:bg-brand-600"
        >
          Ver Templates
        </Link>
        <Link
          href="/eventos"
          className="inline-flex items-center px-6 py-3 border border-ink/20 text-base font-medium rounded-md text-ink bg-surface-raised hover:bg-surface"
        >
          Ver Eventos
        </Link>
      </div>
    </div>
  )
}

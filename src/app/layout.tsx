import type { Metadata } from 'next'
import { Space_Grotesk, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import ClientLayout from '@/components/ui/ClientLayout'
import { ThemeProvider } from '@/components/ui/ThemeProvider'

// Fase 1.3 — Fontes via next/font/google com CSS variables
const display = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
})

const sans = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
})

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'ChordSet',
    template: '%s · ChordSet',
  },
  description: 'Seu repertório, do ensaio ao palco — cifras, setlists e ritmos em um só lugar.',
  applicationName: 'ChordSet',
}

const navLinkClass =
  'text-ink-muted hover:text-ink px-3 py-2 rounded-md text-sm font-medium transition-colors'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${display.variable} ${mono.variable} font-sans bg-surface text-ink antialiased`}
      >
        <ThemeProvider>
          <div className="min-h-screen bg-surface">
            <nav className="bg-surface-raised border-b border-ink/10 site-nav">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                  <div className="flex items-center">
                    <Link
                      href="/"
                      className="text-xl font-bold font-display text-brand"
                    >
                      ChordSet
                    </Link>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Link href="/ritmos" className={navLinkClass}>
                      Ritmos
                    </Link>
                    <Link href="/eventos" className={navLinkClass}>
                      Eventos
                    </Link>
                    <Link href="/templates" className={navLinkClass}>
                      Templates
                    </Link>
                    <Link href="/musicas" className={navLinkClass}>
                      Músicas
                    </Link>
                    <Link href="/ensaios" className={navLinkClass}>
                      Ensaios
                    </Link>
                  </div>
                </div>
              </div>
            </nav>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 site-main">
              <ClientLayout>{children}</ClientLayout>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

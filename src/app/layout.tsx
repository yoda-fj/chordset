import type { Metadata } from 'next'
import { Space_Grotesk, Instrument_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import ClientLayout from '@/components/ui/ClientLayout'
import { ThemeProvider } from '@/components/ui/ThemeProvider'
import { SiteNav } from '@/components/layout/SiteNav'

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
          <div className="min-h-screen bg-surface pb-20 md:pb-0">
            <SiteNav />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 site-main">
              <ClientLayout>{children}</ClientLayout>
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}

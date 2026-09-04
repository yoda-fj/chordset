'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

/**
 * Tema dark-first do ChordSet (Fase 1.2).
 * defaultTheme 'dark' + enableSystem false: o Backstage nasce escuro.
 * As CSS vars de :root já são escuras, então não há flash claro no cold start
 * mesmo antes do script inline do next-themes rodar.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

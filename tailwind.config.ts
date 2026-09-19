import type { Config } from 'tailwindcss'

/**
 * Design tokens ChordSet (Fase 1.1)
 * Cores semânticas via CSS variables (RGB triplets) com <alpha-value>,
 * definidas em src/app/globals.css. Dark-first: :root já é escuro.
 */
const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          overlay: 'rgb(var(--surface-overlay) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--ink-faint) / <alpha-value>)',
        },
        // Âmbar de palco — acento de marca (variável por tema; escala estática removida)
        brand: {
          DEFAULT: 'rgb(var(--brand) / <alpha-value>)',
          600: 'rgb(var(--brand-600) / <alpha-value>)',
        },
        chord: 'rgb(var(--chord) / <alpha-value>)', // acordes (verde "go")
        section: 'rgb(var(--section) / <alpha-value>)', // cabeçalhos de seção
        tab: 'rgb(var(--tab) / <alpha-value>)', // tablatura
        danger: 'rgb(var(--danger) / <alpha-value>)',
        success: 'rgb(var(--success) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        chord: ['var(--font-mono)', 'monospace'], // cifras e tabs
      },
      fontSize: {
        // Escala tipográfica de palco (leitura à distância)
        'stage-sm': ['20px', '1.6'],
        'stage-md': ['28px', '1.5'],
        'stage-lg': ['40px', '1.3'],
        'stage-xl': ['64px', '1.1'],
      },
      borderRadius: {
        xl2: '1rem',
      },
      borderColor: {
        // Borda padrão sutil no dark-first (substitui o gray-200 do preflight)
        DEFAULT: 'rgb(var(--ink) / 0.12)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      keyframes: {
        // Pulso único do metrônomo (Fase 2.4): flash que nasce cheio e apaga
        'ping-once': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.6)', opacity: '0.6' },
          '100%': { transform: 'scale(1)', opacity: '0.9' },
        },
      },
      animation: {
        'ping-once': 'ping-once 0.3s ease-out',
      },
    },
  },
  plugins: [],
}

export default config

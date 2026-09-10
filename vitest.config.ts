import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    exclude: ['**/node_modules/**', '**/.next/**'],
    setupFiles: ['./vitest.setup.ts'],
    // Testes de componente (*.test.tsx) usam jsdom via docblock:
    // // @vitest-environment jsdom
  },
})

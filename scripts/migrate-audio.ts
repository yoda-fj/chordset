/**
 * Migra arquivos de áudio legados de public/<dir>-audio/ para o storage
 * persistente (AUDIO_STORAGE_PATH, padrão ./data/audio).
 *
 * Idempotente: arquivos que já existem no destino (mesmo nome) são pulados.
 * Uso: node scripts/migrate-audio.ts
 */
import { readdirSync, statSync, existsSync, mkdirSync, renameSync, copyFileSync, unlinkSync } from 'fs'
import { join } from 'path'

const AUDIO_STORAGE_PATH = process.env.AUDIO_STORAGE_PATH || join(process.cwd(), 'data', 'audio')

const MIGRATIONS: Array<{ legacyDir: string; destSubdir: string }> = [
  { legacyDir: join(process.cwd(), 'public', 'musicas-audio'), destSubdir: 'musicas' },
  { legacyDir: join(process.cwd(), 'public', 'eventos-audio'), destSubdir: 'eventos' },
]

let moved = 0
let skipped = 0
let errors = 0

for (const { legacyDir, destSubdir } of MIGRATIONS) {
  if (!existsSync(legacyDir)) {
    console.log(`[migrate-audio] ${legacyDir} não existe — nada a migrar`)
    continue
  }

  const destDir = join(AUDIO_STORAGE_PATH, destSubdir)
  mkdirSync(destDir, { recursive: true })

  for (const entry of readdirSync(legacyDir)) {
    const src = join(legacyDir, entry)
    if (!statSync(src).isFile()) continue

    const dest = join(destDir, entry)
    if (existsSync(dest)) {
      console.log(`[migrate-audio] PULADO (já existe): ${entry}`)
      skipped++
      continue
    }

    try {
      try {
        renameSync(src, dest)
      } catch {
        // rename falha entre filesystems diferentes (EXDEV) — fallback copy+delete
        copyFileSync(src, dest)
        unlinkSync(src)
      }
      console.log(`[migrate-audio] MOVIDO: ${src} -> ${dest}`)
      moved++
    } catch (err) {
      console.error(`[migrate-audio] ERRO ao mover ${entry}:`, err)
      errors++
    }
  }
}

console.log(`[migrate-audio] Concluído: ${moved} movido(s), ${skipped} pulado(s), ${errors} erro(s)`)
if (errors > 0) process.exit(1)

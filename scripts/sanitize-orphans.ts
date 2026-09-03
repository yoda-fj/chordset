// Sanitiza registros órfãos (FKs penduradas) no banco ChordSet.
// Uso:
//   node scripts/sanitize-orphans.ts [--db <caminho>] [--dry-run|--apply]
// Padrão: --dry-run (só reporta, não escreve nada).
// --apply: antes de qualquer escrita, copia o arquivo .db para
// <db>.bak-<timestamp> e também exporta um backup JSON (src/lib/backup.ts).
import Database from 'better-sqlite3'
import { copyFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exportBackup } from '../src/lib/backup.ts'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function parseArgs(argv: string[]): { dbPath: string; apply: boolean } {
  let dbPath = process.env.DATABASE_PATH || join(projectRoot, 'data', 'chordset.db')
  let apply = false
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--db') {
      dbPath = argv[++i]
    } else if (argv[i] === '--apply') {
      apply = true
    } else if (argv[i] === '--dry-run') {
      apply = false
    }
  }
  return { dbPath: resolve(dbPath), apply }
}

interface OrphanCheck {
  label: string
  findSql: string
  // Como remover no modo --apply. 'delete' remove as linhas órfãs;
  // 'nullify' zera a coluna FK (usado para musicas.drum_pattern_id).
  mode: 'delete' | 'nullify'
  fixSql: string
}

const checks: OrphanCheck[] = [
  {
    label: 'evento_musicas.evento_id -> eventos',
    findSql: `SELECT em.id FROM evento_musicas em
              LEFT JOIN eventos e ON e.id = em.evento_id WHERE e.id IS NULL`,
    mode: 'delete',
    fixSql: `DELETE FROM evento_musicas WHERE id IN (
               SELECT em.id FROM evento_musicas em
               LEFT JOIN eventos e ON e.id = em.evento_id WHERE e.id IS NULL)`,
  },
  {
    label: 'evento_musicas.musica_id -> musicas',
    findSql: `SELECT em.id FROM evento_musicas em
              LEFT JOIN musicas m ON m.id = em.musica_id WHERE m.id IS NULL`,
    mode: 'delete',
    fixSql: `DELETE FROM evento_musicas WHERE id IN (
               SELECT em.id FROM evento_musicas em
               LEFT JOIN musicas m ON m.id = em.musica_id WHERE m.id IS NULL)`,
  },
  {
    label: 'template_musicas.template_id -> templates',
    findSql: `SELECT tm.id FROM template_musicas tm
              LEFT JOIN templates t ON t.id = tm.template_id WHERE t.id IS NULL`,
    mode: 'delete',
    fixSql: `DELETE FROM template_musicas WHERE id IN (
               SELECT tm.id FROM template_musicas tm
               LEFT JOIN templates t ON t.id = tm.template_id WHERE t.id IS NULL)`,
  },
  {
    label: 'template_musicas.musica_id -> musicas',
    findSql: `SELECT tm.id FROM template_musicas tm
              LEFT JOIN musicas m ON m.id = tm.musica_id WHERE m.id IS NULL`,
    mode: 'delete',
    fixSql: `DELETE FROM template_musicas WHERE id IN (
               SELECT tm.id FROM template_musicas tm
               LEFT JOIN musicas m ON m.id = tm.musica_id WHERE m.id IS NULL)`,
  },
  {
    label: 'practice_sessions.musica_id -> musicas',
    findSql: `SELECT ps.id FROM practice_sessions ps
              LEFT JOIN musicas m ON m.id = ps.musica_id WHERE m.id IS NULL`,
    mode: 'delete',
    fixSql: `DELETE FROM practice_sessions WHERE id IN (
               SELECT ps.id FROM practice_sessions ps
               LEFT JOIN musicas m ON m.id = ps.musica_id WHERE m.id IS NULL)`,
  },
  {
    label: 'musicas.drum_pattern_id -> drum_patterns',
    findSql: `SELECT m.id FROM musicas m
              LEFT JOIN drum_patterns dp ON dp.id = m.drum_pattern_id
              WHERE m.drum_pattern_id IS NOT NULL AND dp.id IS NULL`,
    mode: 'nullify',
    fixSql: `UPDATE musicas SET drum_pattern_id = NULL WHERE id IN (
               SELECT m.id FROM musicas m
               LEFT JOIN drum_patterns dp ON dp.id = m.drum_pattern_id
               WHERE m.drum_pattern_id IS NOT NULL AND dp.id IS NULL)`,
  },
]

const { dbPath, apply } = parseArgs(process.argv.slice(2))
console.log(`Banco: ${dbPath}`)
console.log(`Modo: ${apply ? 'APPLY (vai escrever!)' : 'DRY-RUN (somente leitura)'}`)

const db = new Database(dbPath, apply ? {} : { readonly: true })
try {
  const report = checks.map(check => {
    const ids = (db.prepare(check.findSql).all() as { id: number }[]).map(r => r.id)
    return { check, ids }
  })

  let total = 0
  for (const { check, ids } of report) {
    total += ids.length
    const preview = ids.slice(0, 10).join(', ') + (ids.length > 10 ? ` ... (+${ids.length - 10})` : '')
    console.log(`  ${check.label}: ${ids.length} órfão(s)${ids.length ? ` [ids: ${preview}]` : ''}`)
  }
  console.log(`Total de órfãos: ${total}`)

  if (apply && total > 0) {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    const bakPath = `${dbPath}.bak-${stamp}`
    copyFileSync(dbPath, bakPath)
    console.log(`Cópia de segurança do arquivo: ${bakPath}`)

    const jsonPath = `${dbPath}.backup-${stamp}.json`
    writeFileSync(jsonPath, JSON.stringify(exportBackup(db), null, 2), 'utf-8')
    console.log(`Backup JSON (exportBackup): ${jsonPath}`)

    const fix = db.transaction(() => {
      for (const { check, ids } of report) {
        if (ids.length === 0) continue
        const info = db.prepare(check.fixSql).run()
        const verbo = check.mode === 'nullify' ? 'anulado(s)' : 'removido(s)'
        console.log(`  ${check.label}: ${info.changes} ${verbo}`)
      }
    })
    fix()
    console.log('Sanitização aplicada com sucesso.')
  } else if (apply) {
    console.log('Nada a fazer: nenhum órfão encontrado.')
  } else {
    console.log('Dry-run: nenhuma escrita realizada. Rode com --apply para corrigir.')
  }
} finally {
  db.close()
}

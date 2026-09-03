// Exporta o banco SQLite para um arquivo JSON de backup.
// Uso:
//   node scripts/backup-export.ts [arquivo-saida.json]
// Banco: --db <caminho> ou env DATABASE_PATH ou data/chordset.db
import Database from 'better-sqlite3'
import { writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { exportBackup } from '../src/lib/backup.ts'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function parseArgs(argv: string[]): { dbPath: string; output: string } {
  let dbPath = process.env.DATABASE_PATH || join(projectRoot, 'data', 'chordset.db')
  let output = ''
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--db') {
      dbPath = argv[++i]
    } else {
      output = argv[i]
    }
  }
  if (!output) {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
    output = join(projectRoot, `chordset-backup-${stamp}.json`)
  }
  return { dbPath: resolve(dbPath), output: resolve(output) }
}

const { dbPath, output } = parseArgs(process.argv.slice(2))
const db = new Database(dbPath, { readonly: true })
try {
  const backup = exportBackup(db)
  writeFileSync(output, JSON.stringify(backup, null, 2), 'utf-8')
  const total = Object.values(backup.tables).reduce((acc, rows) => acc + rows.length, 0)
  console.log(`Backup exportado de ${dbPath}`)
  for (const [table, rows] of Object.entries(backup.tables)) {
    console.log(`  ${table}: ${rows.length} linhas`)
  }
  console.log(`Total: ${total} linhas -> ${output}`)
} finally {
  db.close()
}

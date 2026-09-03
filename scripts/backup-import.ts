// Restaura um backup JSON no banco SQLite (transação única).
// Uso:
//   node scripts/backup-import.ts <arquivo-backup.json> [--db <caminho>]
// Banco: --db <caminho> ou env DATABASE_PATH ou data/chordset.db
// Se o banco de destino não existir/estiver sem schema, aplica data/schema.sql antes.
import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { importBackup, validateBackup, BACKUP_TABLES } from '../src/lib/backup.ts'

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function parseArgs(argv: string[]): { dbPath: string; input: string } {
  let dbPath = process.env.DATABASE_PATH || join(projectRoot, 'data', 'chordset.db')
  let input = ''
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--db') {
      dbPath = argv[++i]
    } else {
      input = argv[i]
    }
  }
  if (!input) {
    console.error('Erro: informe o arquivo de backup JSON.')
    console.error('Uso: node scripts/backup-import.ts <arquivo-backup.json> [--db <caminho>]')
    process.exit(1)
  }
  return { dbPath: resolve(dbPath), input: resolve(input) }
}

const { dbPath, input } = parseArgs(process.argv.slice(2))

let raw: unknown
try {
  raw = JSON.parse(readFileSync(input, 'utf-8'))
} catch (error) {
  console.error(`Erro: JSON inválido em ${input}: ${(error as Error).message}`)
  process.exit(1)
}

// Valida o formato ANTES de abrir/escrever no banco
const validation = validateBackup(raw)
if (!validation.ok) {
  console.error(`Erro: ${validation.error}`)
  process.exit(1)
}

const db = new Database(dbPath)
try {
  // Garante o schema em bancos novos/vazios
  const hasSchema = BACKUP_TABLES.some(
    (t) => db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?").get(t) !== undefined
  )
  if (!hasSchema) {
    console.log('Schema não encontrado; aplicando data/schema.sql...')
    db.exec(readFileSync(join(projectRoot, 'data', 'schema.sql'), 'utf-8'))
  }

  const counts = importBackup(db, validation.data)
  console.log(`Backup importado de ${input} para ${dbPath}`)
  for (const [table, count] of Object.entries(counts)) {
    console.log(`  ${table}: ${count} linhas`)
  }
} catch (error) {
  console.error(`Erro ao importar (rollback aplicado): ${(error as Error).message}`)
  process.exit(1)
} finally {
  db.close()
}

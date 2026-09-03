import type Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'

// Migrations versionadas do ChordSet.
// Cada migration roda uma única vez, em ordem, dentro de uma transação,
// e é registrada na tabela schema_migrations.

interface Migration {
  version: number
  name: string
  up: (db: Database.Database) => void
}

function ensureSchemaMigrationsTable(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

// Migration 001: schema base (data/schema.sql) + convergência de bancos
// antigos que possam ter tabelas sem as colunas adicionadas historicamente
// via ALTERs ad-hoc em initSchema().
function migration001(db: Database.Database) {
  const schema = readFileSync(join(process.cwd(), 'data', 'schema.sql'), 'utf-8')
  db.exec(schema)

  const hasColumn = (table: string, column: string) =>
    (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[])
      .some(col => col.name === column)

  const addColumn = (table: string, column: string, ddl: string) => {
    if (!hasColumn(table, column)) {
      console.log(`[Migration 001] Adding ${column} column to ${table}...`)
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
    }
  }

  addColumn('musicas', 'observacao', 'observacao TEXT')
  addColumn('musicas', 'audio_url', 'audio_url TEXT')
  addColumn('musicas', 'groove', 'groove TEXT')
  addColumn('musicas', 'drum_pattern_id', 'drum_pattern_id INTEGER REFERENCES drum_patterns(id) ON DELETE SET NULL')
  addColumn('musicas', 'bpm', 'bpm INTEGER DEFAULT 120')
  addColumn('musicas', 'volume', 'volume REAL DEFAULT 0.7')
  addColumn('eventos', 'audio_url', 'audio_url TEXT')
}

// Migration 002: índice UNIQUE em evento_musicas(evento_id, ordem).
// Só é criado se não houver duplicatas; caso contrário, loga warning e pula
// (a migration ainda é registrada como aplicada para não bloquear o boot —
// rode scripts/sanitize-orphans.ts e reordene antes de recriar o índice).
function migration002(db: Database.Database) {
  const dupes = db.prepare(`
    SELECT evento_id, ordem, COUNT(*) AS n
    FROM evento_musicas
    GROUP BY evento_id, ordem
    HAVING n > 1
  `).all() as { evento_id: number; ordem: number; n: number }[]

  if (dupes.length > 0) {
    console.warn(
      `[Migration 002] WARNING: ${dupes.length} par(es) (evento_id, ordem) duplicados em evento_musicas; ` +
      `índice UNIQUE NÃO criado. Duplicatas: ` +
      dupes.map(d => `(evento=${d.evento_id}, ordem=${d.ordem}, n=${d.n})`).join(', ')
    )
    return
  }

  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_evento_musicas_evento_ordem
    ON evento_musicas(evento_id, ordem)
  `)
}

export const migrations: Migration[] = [
  { version: 1, name: 'schema-base', up: migration001 },
  { version: 2, name: 'evento-musicas-unique-ordem', up: migration002 },
]

export function applyMigrations(db: Database.Database): void {
  ensureSchemaMigrationsTable(db)
  const applied = new Set(
    (db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[])
      .map(r => r.version)
  )

  const sorted = [...migrations].sort((a, b) => a.version - b.version)
  for (const migration of sorted) {
    if (applied.has(migration.version)) continue
    const run = db.transaction(() => {
      migration.up(db)
      db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(migration.version)
    })
    run()
    console.log(`[Migration] Aplicada ${String(migration.version).padStart(3, '0')} (${migration.name})`)
  }
}

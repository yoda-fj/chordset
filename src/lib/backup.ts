import type Database from 'better-sqlite3'

// =====================================
// BACKUP EXPORT/IMPORT (JSON)
// Núcleo puro: recebe uma instância de Database (better-sqlite3),
// usado tanto pelas rotas /api/backup/* quanto pelos scripts CLI.
// =====================================

export const BACKUP_FORMAT = 'chordset-backup'
export const BACKUP_VERSION = 1

// Ordem de inserção respeitando FKs (pais antes dos filhos)
export const BACKUP_TABLES = [
  'drum_patterns',
  'musicas',
  'templates',
  'template_musicas',
  'eventos',
  'evento_musicas',
  'practice_sessions',
] as const

export type BackupTable = (typeof BACKUP_TABLES)[number]

export type BackupRow = Record<string, unknown>

export interface BackupData {
  format: typeof BACKUP_FORMAT
  version: number
  exported_at: string
  tables: Record<BackupTable, BackupRow[]>
}

export type ValidateBackupResult =
  | { ok: true; data: BackupData }
  | { ok: false; error: string }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function tableExists(db: Database.Database, table: string): boolean {
  const row = db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(table)
  return row !== undefined
}

/**
 * Exporta todas as tabelas do banco para o formato JSON de backup.
 */
export function exportBackup(db: Database.Database): BackupData {
  const tables = {} as Record<BackupTable, BackupRow[]>
  for (const table of BACKUP_TABLES) {
    tables[table] = tableExists(db, table)
      ? (db.prepare(`SELECT * FROM ${table}`).all() as BackupRow[])
      : []
  }
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exported_at: new Date().toISOString(),
    tables,
  }
}

/**
 * Valida o formato do backup SEM escrever nada no banco.
 * Deve ser chamado antes de importBackup.
 */
export function validateBackup(raw: unknown): ValidateBackupResult {
  if (!isPlainObject(raw)) {
    return { ok: false, error: 'Backup inválido: esperado um objeto JSON' }
  }
  if (raw.format !== BACKUP_FORMAT) {
    return { ok: false, error: `Backup inválido: format deve ser "${BACKUP_FORMAT}"` }
  }
  if (raw.version !== BACKUP_VERSION) {
    return { ok: false, error: `Backup inválido: versão ${BACKUP_VERSION} esperada, recebida ${String(raw.version)}` }
  }
  if (!isPlainObject(raw.tables)) {
    return { ok: false, error: 'Backup inválido: "tables" deve ser um objeto' }
  }
  for (const table of BACKUP_TABLES) {
    const rows = raw.tables[table]
    if (!Array.isArray(rows)) {
      return { ok: false, error: `Backup inválido: tabela "${table}" ausente ou não é um array` }
    }
    for (let i = 0; i < rows.length; i++) {
      if (!isPlainObject(rows[i])) {
        return { ok: false, error: `Backup inválido: linha ${i} da tabela "${table}" não é um objeto` }
      }
    }
  }
  return { ok: true, data: raw as unknown as BackupData }
}

/**
 * Restaura o backup no banco em TRANSAÇÃO ÚNICA:
 * apaga todas as tabelas e reinsere as linhas preservando os ids.
 * Assume que validateBackup já passou. Em caso de erro, faz rollback
 * completo (o banco fica como estava).
 *
 * Retorna a contagem de linhas importadas por tabela.
 */
export function importBackup(
  db: Database.Database,
  backup: BackupData
): Record<BackupTable, number> {
  const previousFk = db.pragma('foreign_keys', { simple: true }) as number
  db.pragma('foreign_keys = OFF')

  const counts = {} as Record<BackupTable, number>

  const runImport = db.transaction((data: BackupData) => {
    // Apaga filhos antes dos pais
    for (const table of [...BACKUP_TABLES].reverse()) {
      if (tableExists(db, table)) {
        db.prepare(`DELETE FROM ${table}`).run()
      }
    }

    for (const table of BACKUP_TABLES) {
      counts[table] = 0
      if (!tableExists(db, table)) continue

      const columns = (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
        (c) => c.name
      )
      if (columns.length === 0) continue

      const placeholders = columns.map(() => '?').join(', ')
      const stmt = db.prepare(
        `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
      )

      for (const row of data.tables[table]) {
        stmt.run(columns.map((col) => row[col] ?? null))
        counts[table]++
      }
    }
  })

  try {
    runImport(backup)
  } finally {
    db.pragma(`foreign_keys = ${previousFk ? 'ON' : 'OFF'}`)
  }

  return counts
}

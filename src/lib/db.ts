import Database from 'better-sqlite3'
import { join } from 'path'
import { applyMigrations } from './migrations'

const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'chordset.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.pragma('busy_timeout = 5000')
    db.pragma('synchronous = NORMAL')
    initSchema()
  }
  return db
}

function initSchema() {
  if (!db) return
  try {
    applyMigrations(db)
  } catch (error) {
    console.error('Erro ao inicializar schema:', error)
    throw error
  }
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}

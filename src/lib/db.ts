import Database from 'better-sqlite3'
import { join } from 'path'
import { readFileSync } from 'fs'

const DB_PATH = join(process.cwd(), 'data', 'chordset.db')

let db: Database.Database | null = null

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    initSchema()
  }
  return db
}

function initSchema() {
  if (!db) return
  
  try {
    const schema = readFileSync(join(process.cwd(), 'data', 'schema.sql'), 'utf-8')
    db.exec(schema)
  } catch (error) {
    console.error('Erro ao inicializar schema:', error)
  }
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}

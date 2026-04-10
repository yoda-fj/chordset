import Database from 'better-sqlite3'
import { join } from 'path'
import { readFileSync, existsSync } from 'fs'

const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'chordset.db')

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
    
    // Migration: make data column nullable if it's still NOT NULL
    const tableInfo = db.prepare("PRAGMA table_info(eventos)").all() as any[]
    const dataColumn = tableInfo.find(col => col.name === 'data')
    if (dataColumn && dataColumn.notnull === 1) {
      console.log('[Migration] Making data column nullable...')
      db.exec(`
        CREATE TABLE IF NOT EXISTS eventos_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          data DATE,
          hora TEXT,
          local TEXT,
          status TEXT DEFAULT 'rascunho',
          template_id INTEGER,
          tags TEXT DEFAULT '[]',
          observacoes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (template_id) REFERENCES templates(id)
        );
        INSERT INTO eventos_new (id, nome, data, hora, local, status, template_id, tags, observacoes, created_at, updated_at)
        SELECT id, nome, data, hora, local, status, template_id, tags, observacoes, created_at, updated_at FROM eventos;
        DROP TABLE eventos;
        ALTER TABLE eventos_new RENAME TO eventos;
      `)
      console.log('[Migration] Done!')
    }
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

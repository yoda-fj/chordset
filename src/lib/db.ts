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
    
    try {
      const musicasColumns = db.prepare("PRAGMA table_info(musicas)").all() as any[]
      const hasObservacao = musicasColumns.some(col => col.name === 'observacao')
      const hasAudioUrl = musicasColumns.some(col => col.name === 'audio_url')

      if (!hasObservacao) {
        console.log('[Migration] Adding observacao column to musicas...')
        db.exec('ALTER TABLE musicas ADD COLUMN observacao TEXT')
      }
      if (!hasAudioUrl) {
        console.log('[Migration] Adding audio_url column to musicas...')
        db.exec('ALTER TABLE musicas ADD COLUMN audio_url TEXT')
      }
    } catch (e) {
      // Columns may already exist in some installations
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

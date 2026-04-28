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
      const hasGroove = musicasColumns.some(col => col.name === 'groove')

      if (!hasObservacao) {
        console.log('[Migration] Adding observacao column to musicas...')
        db.exec('ALTER TABLE musicas ADD COLUMN observacao TEXT')
      }
      if (!hasAudioUrl) {
        console.log('[Migration] Adding audio_url column to musicas...')
        db.exec('ALTER TABLE musicas ADD COLUMN audio_url TEXT')
      }
      if (!hasGroove) {
        console.log('[Migration] Adding groove column to musicas...')
        db.exec('ALTER TABLE musicas ADD COLUMN groove TEXT')
      }
      
      const hasDrumPatternId = musicasColumns.some(col => col.name === 'drum_pattern_id')
      if (!hasDrumPatternId) {
        console.log('[Migration] Adding drum_pattern_id column to musicas...')
        db.exec('ALTER TABLE musicas ADD COLUMN drum_pattern_id INTEGER REFERENCES drum_patterns(id) ON DELETE SET NULL')
      }

      const hasBpm = musicasColumns.some(col => col.name === 'bpm')
      if (!hasBpm) {
        console.log('[Migration] Adding bpm column to musicas...')
        db.exec('ALTER TABLE musicas ADD COLUMN bpm INTEGER DEFAULT 120')
      }

      const hasVolume = musicasColumns.some(col => col.name === 'volume')
      if (!hasVolume) {
        console.log('[Migration] Adding volume column to musicas...')
        db.exec('ALTER TABLE musicas ADD COLUMN volume REAL DEFAULT 0.7')
      }

      // Migrate eventos table
      try {
        const eventosColumns = db.prepare("PRAGMA table_info(eventos)").all() as any[]
        const hasEventoAudioUrl = eventosColumns.some(col => col.name === 'audio_url')
        if (!hasEventoAudioUrl) {
          console.log('[Migration] Adding audio_url column to eventos...')
          db.exec('ALTER TABLE eventos ADD COLUMN audio_url TEXT')
        }
      } catch (e) {
        // ignore
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

import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync } from 'fs'

const DB_PATH = process.env.DATABASE_PATH || join(process.cwd(), 'data', 'chordset.db')

if (!existsSync(DB_PATH)) {
  console.log('Banco não encontrado, nada para migrar.')
  process.exit(0)
}

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')

// Check current schema
const tableInfo = db.prepare("PRAGMA table_info(eventos)").all() as any[]
const dataColumn = tableInfo.find(col => col.name === 'data')

console.log('Schema atual da coluna data:', dataColumn)

if (dataColumn && dataColumn.notnull === 1) {
  console.log('Migração necessária: alterando data NOT NULL → NULL...')
  
  // SQLite doesn't support ALTER COLUMN directly
  // We need to recreate the table
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
  
  console.log('Migração concluída!')
} else {
  console.log('Schema já está correto, nada para fazer.')
}

db.close()
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync } from 'fs'
import { join } from 'path'
import { applyMigrations } from './migrations'

const baseSchema = () => readFileSync(join(process.cwd(), 'data', 'schema.sql'), 'utf-8')

function createTestDb(): Database.Database {
  const db = new Database(':memory:')
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('busy_timeout = 5000')
  db.pragma('synchronous = NORMAL')
  return db
}

describe('migrations', () => {
  let db: Database.Database

  beforeEach(() => {
    db = createTestDb()
  })

  afterEach(() => {
    db.close()
  })

  it('aplica todas as migrations e registra em schema_migrations', () => {
    applyMigrations(db)
    const rows = db.prepare('SELECT version FROM schema_migrations ORDER BY version').all() as { version: number }[]
    expect(rows.map(r => r.version)).toEqual([1, 2])

    const tables = (db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[])
      .map(t => t.name)
    for (const t of ['musicas', 'templates', 'template_musicas', 'eventos', 'evento_musicas', 'practice_sessions', 'drum_patterns']) {
      expect(tables).toContain(t)
    }
  })

  it('é idempotente: rodar 2x não falha e não duplica registros', () => {
    applyMigrations(db)
    applyMigrations(db)
    const rows = db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[]
    expect(rows).toHaveLength(2)
  })

  it('cria índice UNIQUE em evento_musicas(evento_id, ordem) quando não há duplicatas', () => {
    applyMigrations(db)
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_evento_musicas_evento_ordem'").all()
    expect(indexes).toHaveLength(1)
  })

  it('UNIQUE(evento_id, ordem) rejeita duplicata', () => {
    applyMigrations(db)
    db.prepare("INSERT INTO musicas (titulo, artista) VALUES ('M1', 'A')").run()
    db.prepare("INSERT INTO eventos (nome) VALUES ('E1')").run()
    db.prepare('INSERT INTO evento_musicas (evento_id, musica_id, ordem) VALUES (1, 1, 1)').run()
    expect(() =>
      db.prepare('INSERT INTO evento_musicas (evento_id, musica_id, ordem) VALUES (1, 1, 1)').run()
    ).toThrow()
  })

  it('pula o índice UNIQUE (com warning) quando já existem duplicatas', () => {
    // Banco "legado": schema base completo, mas sem schema_migrations
    // e com duplicatas em (evento_id, ordem)
    db.exec(baseSchema())
    db.exec(`
      INSERT INTO musicas (titulo, artista) VALUES ('M1', 'A');
      INSERT INTO eventos (nome) VALUES ('E1');
      INSERT INTO evento_musicas (evento_id, musica_id, ordem) VALUES (1, 1, 1), (1, 1, 1);
    `)
    applyMigrations(db)
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_evento_musicas_evento_ordem'").all()
    expect(indexes).toHaveLength(0)
    // Migration ainda é registrada (não bloqueia boot)
    const rows = db.prepare('SELECT version FROM schema_migrations').all()
    expect(rows).toHaveLength(2)
  })
})

describe('integridade referencial (foreign_keys = ON)', () => {
  let db: Database.Database

  beforeEach(() => {
    db = createTestDb()
    applyMigrations(db)
    db.prepare("INSERT INTO musicas (titulo, artista) VALUES ('M1', 'A')").run()
    db.prepare("INSERT INTO eventos (nome) VALUES ('E1')").run()
    db.prepare("INSERT INTO templates (nome) VALUES ('T1')").run()
    db.prepare('INSERT INTO evento_musicas (evento_id, musica_id, ordem) VALUES (1, 1, 1)').run()
    db.prepare('INSERT INTO template_musicas (template_id, musica_id, ordem) VALUES (1, 1, 1)').run()
    db.prepare('INSERT INTO practice_sessions (musica_id) VALUES (1)').run()
  })

  afterEach(() => {
    db.close()
  })

  it('deletar música remove em cascade evento_musicas, template_musicas e practice_sessions', () => {
    db.prepare('DELETE FROM musicas WHERE id = 1').run()
    expect(db.prepare('SELECT COUNT(*) AS n FROM evento_musicas').get()).toEqual({ n: 0 })
    expect(db.prepare('SELECT COUNT(*) AS n FROM template_musicas').get()).toEqual({ n: 0 })
    expect(db.prepare('SELECT COUNT(*) AS n FROM practice_sessions').get()).toEqual({ n: 0 })
  })

  it('deletar evento remove em cascade evento_musicas', () => {
    db.prepare('DELETE FROM eventos WHERE id = 1').run()
    expect(db.prepare('SELECT COUNT(*) AS n FROM evento_musicas').get()).toEqual({ n: 0 })
  })

  it('rejeita INSERT de órfão (musica_id inexistente)', () => {
    expect(() =>
      db.prepare('INSERT INTO evento_musicas (evento_id, musica_id, ordem) VALUES (1, 999, 2)').run()
    ).toThrow()
  })
})

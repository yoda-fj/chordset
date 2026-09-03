import { describe, it, expect, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import { readFileSync, mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { fileURLToPath } from 'url'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  BACKUP_TABLES,
  exportBackup,
  importBackup,
  validateBackup,
  type BackupData,
} from './backup'

const SCHEMA = readFileSync(
  fileURLToPath(new URL('../../data/schema.sql', import.meta.url)),
  'utf-8'
)

function createSeededDb(): Database.Database {
  const db = new Database(':memory:')
  db.exec(SCHEMA)

  db.prepare(
    "INSERT INTO drum_patterns (id, nome, bpm, kit, steps) VALUES (1, 'Rock Básico', 120, 'kit1', '[[\"kick\"],[\"snare\"]]')"
  ).run()
  db.prepare(
    "INSERT INTO musicas (id, titulo, artista, tom_original, cifra, tags, observacao, groove, drum_pattern_id, bpm, volume) VALUES (1, 'Trem Azul', 'Lô Borges', 'D', '[D]Trem azul', '[\"mpb\",\"acustico\"]', 'tocar devagar', '{\"swing\":0.1}', 1, 90, 0.5)"
  ).run()
  db.prepare(
    "INSERT INTO musicas (id, titulo, artista, bpm, volume) VALUES (2, 'Paisagem na Janela', 'Lô Borges', 100, 0.8)"
  ).run()
  db.prepare(
    "INSERT INTO templates (id, nome, descricao, tags) VALUES (1, 'Culto Domingo', 'Setlist padrão', '[\"igreja\"]')"
  ).run()
  db.prepare(
    'INSERT INTO template_musicas (id, template_id, musica_id, ordem, tom_sugerido) VALUES (1, 1, 1, 1, ?)'
  ).run('E')
  db.prepare(
    "INSERT INTO eventos (id, nome, data, hora, local, status, template_id, tags) VALUES (1, 'Ensaio Geral', '2026-09-10', '19:30:00', 'Estúdio', 'confirmado', 1, '[\"ensaio\"]')"
  ).run()
  db.prepare(
    'INSERT INTO evento_musicas (id, evento_id, musica_id, ordem, tom_evento, confirmada, responsavel) VALUES (1, 1, 2, 1, ?, 1, ?)'
  ).run('F', 'Ana')
  db.prepare(
    "INSERT INTO practice_sessions (id, musica_id, status, difficulty, total_practice_time_seconds, notes) VALUES (1, 1, 'practiced', 'hard', 1800, 'revisar ponte')"
  ).run()

  return db
}

function snapshot(db: Database.Database): Record<string, unknown[]> {
  const snap: Record<string, unknown[]> = {}
  for (const table of BACKUP_TABLES) {
    snap[table] = db.prepare(`SELECT * FROM ${table} ORDER BY id`).all()
  }
  return snap
}

const tmpDirs: string[] = []
afterEach(() => {
  while (tmpDirs.length) rmSync(tmpDirs.pop()!, { recursive: true, force: true })
})

describe('backup export/import (round-trip)', () => {
  it('exporta e reimporta em banco limpo preservando contagens e conteúdo', () => {
    const source = createSeededDb()
    const backup = exportBackup(source)

    expect(backup.format).toBe(BACKUP_FORMAT)
    expect(backup.version).toBe(BACKUP_VERSION)
    expect(typeof backup.exported_at).toBe('string')

    // Banco destino LIMPO (em memória, só schema)
    const target = new Database(':memory:')
    target.exec(SCHEMA)

    const validation = validateBackup(backup)
    expect(validation.ok).toBe(true)
    if (!validation.ok) return

    const counts = importBackup(target, validation.data)
    expect(counts).toEqual({
      drum_patterns: 1,
      musicas: 2,
      templates: 1,
      template_musicas: 1,
      eventos: 1,
      evento_musicas: 1,
      practice_sessions: 1,
    })

    // Conteúdo idêntico em todas as tabelas
    expect(snapshot(target)).toEqual(snapshot(source))

    source.close()
    target.close()
  })

  it('round-trip via arquivo temporário (disco)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'chordset-backup-'))
    tmpDirs.push(dir)

    const source = createSeededDb()
    const backup = exportBackup(source)
    source.close()

    const targetPath = join(dir, 'restore.db')
    const target = new Database(targetPath)
    target.exec(SCHEMA)

    const validation = validateBackup(JSON.parse(JSON.stringify(backup)))
    expect(validation.ok).toBe(true)
    if (!validation.ok) return
    importBackup(target, validation.data)
    target.close()

    // Relê do disco e compara
    const reopened = new Database(targetPath, { readonly: true })
    const source2 = createSeededDb()
    expect(snapshot(reopened)).toEqual(snapshot(source2))
    reopened.close()
    source2.close()
  })

  it('import substitui dados existentes do destino', () => {
    const source = createSeededDb()
    const backup = exportBackup(source)
    source.close()

    const target = createSeededDb()
    target
      .prepare("INSERT INTO musicas (titulo, artista) VALUES ('Extra', 'Alguém')")
      .run()

    const validation = validateBackup(backup)
    if (!validation.ok) throw new Error('backup deveria ser válido')
    importBackup(target, validation.data)

    const titles = target.prepare('SELECT titulo FROM musicas ORDER BY id').all() as { titulo: string }[]
    expect(titles.map((t) => t.titulo)).toEqual(['Trem Azul', 'Paisagem na Janela'])
    target.close()
  })
})

describe('validateBackup', () => {
  it('rejeita payloads inválidos', () => {
    expect(validateBackup(null).ok).toBe(false)
    expect(validateBackup('string').ok).toBe(false)
    expect(validateBackup({}).ok).toBe(false)
    expect(validateBackup({ format: 'outro', version: 1, tables: {} }).ok).toBe(false)
    expect(validateBackup({ format: BACKUP_FORMAT, version: 99, tables: {} }).ok).toBe(false)

    const tablesVazias = Object.fromEntries(BACKUP_TABLES.map((t) => [t, []]))
    expect(validateBackup({ format: BACKUP_FORMAT, version: 1, tables: tablesVazias }).ok).toBe(true)

    const faltando = { ...tablesVazias } as Record<string, unknown>
    delete faltando.musicas
    expect(validateBackup({ format: BACKUP_FORMAT, version: 1, tables: faltando }).ok).toBe(false)

    const naoArray = { ...tablesVazias, eventos: 'nope' }
    expect(validateBackup({ format: BACKUP_FORMAT, version: 1, tables: naoArray }).ok).toBe(false)
  })
})

describe('importBackup atomicidade', () => {
  it('faz rollback completo quando uma linha viola constraint', () => {
    const source = createSeededDb()
    const backup = exportBackup(source)
    source.close()

    const target = createSeededDb()
    const before = snapshot(target)

    // Corrompe: música sem titulo (NOT NULL) — válido no formato, inválido no banco
    const broken: BackupData = JSON.parse(JSON.stringify(backup))
    ;(broken.tables.musicas[0] as { titulo?: string }).titulo = undefined
    delete (broken.tables.musicas[0] as { titulo?: string }).titulo

    expect(() => importBackup(target, broken)).toThrow()
    // Banco intacto após rollback
    expect(snapshot(target)).toEqual(before)
    target.close()
  })
})

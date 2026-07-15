import { getDb } from './db'
import type { DrumPattern, CreateDrumPatternInput, UpdateDrumPatternInput } from '@/types/database'

export const drumPatternsDb = {
  getAll(): DrumPattern[] {
    const db = getDb()
    return db.prepare('SELECT * FROM drum_patterns ORDER BY created_at DESC').all() as DrumPattern[]
  },

  getById(id: number): DrumPattern | null {
    const db = getDb()
    const row = db.prepare('SELECT * FROM drum_patterns WHERE id = ?').get(id) as DrumPattern | undefined
    return row ?? null
  },

  create(input: CreateDrumPatternInput): DrumPattern {
    const db = getDb()
    const result = db.prepare(
      'INSERT INTO drum_patterns (nome, bpm, kit, steps) VALUES (?, ?, ?, ?)'
    ).run(input.nome, input.bpm || 120, input.kit || 'kit1', JSON.stringify(input.steps))

    const insertId = Number(result.lastInsertRowid)
    const pattern = this.getById(insertId)
    if (!pattern) throw new Error('Erro ao criar ritmo')
    return pattern
  },

  update(id: number, input: UpdateDrumPatternInput): DrumPattern {
    const existing = this.getById(id)
    if (!existing) throw new Error('Ritmo não encontrado')

    const db = getDb()
    db.prepare(
      'UPDATE drum_patterns SET nome = ?, bpm = ?, kit = ?, steps = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(
      input.nome ?? existing.nome,
      input.bpm ?? existing.bpm,
      input.kit ?? existing.kit,
      input.steps !== undefined ? JSON.stringify(input.steps) : existing.steps,
      id
    )

    const pattern = this.getById(id)
    if (!pattern) throw new Error('Ritmo não encontrado')
    return pattern
  },

  // Quantas músicas usam este ritmo (pra safe delete)
  countUsage(id: number): number {
    const db = getDb()
    const row = db.prepare('SELECT COUNT(*) as count FROM musicas WHERE drum_pattern_id = ?').get(id) as { count: number }
    return row.count
  },

  delete(id: number): void {
    const db = getDb()
    db.prepare('DELETE FROM drum_patterns WHERE id = ?').run(id)
  }
}

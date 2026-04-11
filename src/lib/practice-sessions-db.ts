import { getDb } from './db'
import type { PracticeSession, PracticeSessionInsert, PracticeSessionUpdate, PracticeSessionWithMusica } from '@/types/practice'

export const practiceSessionsDb = {
  // Buscar todas as sessões com dados da música
  getAll(): PracticeSessionWithMusica[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT 
        ps.*,
        m.id as m_id,
        m.titulo,
        m.artista,
        m.tom_original,
        m.cifra
      FROM practice_sessions ps
      JOIN musicas m ON ps.musica_id = m.id
      ORDER BY 
        CASE ps.status 
          WHEN 'needs_practice' THEN 1 
          WHEN 'practiced' THEN 2 
          WHEN 'mastered' THEN 3 
        END,
        ps.last_practiced_at DESC NULLS LAST
    `)
    
    const rows = stmt.all() as any[]
    return rows.map(row => ({
      id: row.id,
      musica_id: row.musica_id,
      status: row.status,
      difficulty: row.difficulty,
      total_practice_time_seconds: row.total_practice_time_seconds,
      last_practiced_at: row.last_practiced_at,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      musicas: {
        id: row.m_id,
        titulo: row.titulo,
        artista: row.artista,
        tom_original: row.tom_original,
        cifra: row.cifra,
      },
    }))
  },

  // Buscar por ID
  getById(id: number): PracticeSessionWithMusica | null {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT 
        ps.*,
        m.id as m_id,
        m.titulo,
        m.artista,
        m.tom_original,
        m.cifra
      FROM practice_sessions ps
      JOIN musicas m ON ps.musica_id = m.id
      WHERE ps.id = ?
    `)
    
    const row = stmt.get(id) as any
    if (!row) return null
    
    return {
      id: row.id,
      musica_id: row.musica_id,
      status: row.status,
      difficulty: row.difficulty,
      total_practice_time_seconds: row.total_practice_time_seconds,
      last_practiced_at: row.last_practiced_at,
      notes: row.notes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      musicas: {
        id: row.m_id,
        titulo: row.titulo,
        artista: row.artista,
        tom_original: row.tom_original,
        cifra: row.cifra,
      },
    }
  },

  // Buscar sessão de uma música específica
  getByMusicaId(musicaId: number): PracticeSession | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM practice_sessions WHERE musica_id = ?')
    return stmt.get(musicaId) as PracticeSession | null
  },

  // Criar nova sessão
  create(input: PracticeSessionInsert): PracticeSession {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO practice_sessions (musica_id, status, difficulty, total_practice_time_seconds, last_practiced_at, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      input.musica_id,
      input.status,
      input.difficulty,
      input.total_practice_time_seconds,
      input.last_practiced_at,
      input.notes
    )
    
    return this.getById(result.lastInsertRowid as number)!
  },

  // Atualizar sessão
  update(id: number, input: PracticeSessionUpdate): PracticeSession | null {
    const db = getDb()
    const sets: string[] = []
    const values: any[] = []

    if (input.status !== undefined) {
      sets.push('status = ?')
      values.push(input.status)
    }
    if (input.difficulty !== undefined) {
      sets.push('difficulty = ?')
      values.push(input.difficulty)
    }
    if (input.total_practice_time_seconds !== undefined) {
      sets.push('total_practice_time_seconds = ?')
      values.push(input.total_practice_time_seconds)
    }
    if (input.last_practiced_at !== undefined) {
      sets.push('last_practiced_at = ?')
      values.push(input.last_practiced_at)
    }
    if (input.notes !== undefined) {
      sets.push('notes = ?')
      values.push(input.notes)
    }

    if (sets.length === 0) {
      return this.getById(id)
    }

    sets.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE practice_sessions SET ${sets.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)

    return this.getById(id)
  },

  // Deletar sessão
  delete(id: number): void {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM practice_sessions WHERE id = ?')
    stmt.run(id)
  },

  // Adicionar tempo de prática
  addPracticeTime(id: number, seconds: number): PracticeSession | null {
    const db = getDb()
    const stmt = db.prepare(`
      UPDATE practice_sessions 
      SET total_practice_time_seconds = total_practice_time_seconds + ?,
          last_practiced_at = CURRENT_TIMESTAMP,
          status = CASE 
            WHEN status = 'needs_practice' THEN 'practiced'
            ELSE status
          END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `)
    stmt.run(seconds, id)
    return this.getById(id)
  },

  // Marcar como dominada
  markAsMastered(id: number): PracticeSession | null {
    return this.update(id, { status: 'mastered' })
  },
}

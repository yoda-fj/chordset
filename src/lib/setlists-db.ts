import { getDb } from './db'

export interface EventoMusica {
  id: number
  evento_id: number
  musica_id: number
  ordem: number
  tom_evento: string | null
  observacoes: string | null
  confirmada: boolean
  responsavel: string | null
  created_at: string
  updated_at: string
}

export interface EventoMusicaWithMusica extends EventoMusica {
  musicas: {
    id: number
    titulo: string
    artista: string
    tom_original: string | null
    cifra: string | null
  }
}

export interface CreateEventoMusicaInput {
  evento_id: number
  musica_id: number
  ordem: number
  tom_evento?: string
  observacoes?: string
  confirmada?: boolean
  responsavel?: string
}

export interface UpdateEventoMusicaInput {
  ordem?: number
  tom_evento?: string
  observacoes?: string
  confirmada?: boolean
  responsavel?: string
}

export const setlistsDb = {
  // Get all musicas for an evento (with musica details)
  getByEventoId(eventoId: number): EventoMusicaWithMusica[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT 
        em.*,
        m.titulo,
        m.artista,
        m.tom_original,
        m.cifra
      FROM evento_musicas em
      JOIN musicas m ON em.musica_id = m.id
      WHERE em.evento_id = ?
      ORDER BY em.ordem ASC
    `)
    const rows = stmt.all(eventoId) as any[]
    return rows.map(row => ({
      id: row.id,
      evento_id: row.evento_id,
      musica_id: row.musica_id,
      ordem: row.ordem,
      tom_evento: row.tom_evento,
      observacoes: row.observacoes,
      confirmada: Boolean(row.confirmada),
      responsavel: row.responsavel,
      created_at: row.created_at,
      updated_at: row.updated_at,
      musicas: {
        id: row.musica_id,
        titulo: row.titulo,
        artista: row.artista,
        tom_original: row.tom_original,
        cifra: row.cifra
      }
    }))
  },

  // Create a new musica in evento
  create(input: CreateEventoMusicaInput): EventoMusica {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO evento_musicas (evento_id, musica_id, ordem, tom_evento, observacoes, confirmada, responsavel)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      input.evento_id,
      input.musica_id,
      input.ordem,
      input.tom_evento || null,
      input.observacoes || null,
      input.confirmada ? 1 : 0,
      input.responsavel || null
    )
    
    const created = this.getById(result.lastInsertRowid as number)
    if (!created) throw new Error('Erro ao criar evento_musica')
    return created
  },

  // Get by ID
  getById(id: number): EventoMusica | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM evento_musicas WHERE id = ?')
    const row = stmt.get(id) as any
    if (!row) return null
    return {
      ...row,
      confirmada: Boolean(row.confirmada)
    }
  },

  // Update a evento_musica
  update(id: number, input: UpdateEventoMusicaInput): EventoMusica {
    const db = getDb()
    const sets: string[] = []
    const values: any[] = []

    if (input.ordem !== undefined) {
      sets.push('ordem = ?')
      values.push(input.ordem)
    }
    if (input.tom_evento !== undefined) {
      sets.push('tom_evento = ?')
      values.push(input.tom_evento)
    }
    if (input.observacoes !== undefined) {
      sets.push('observacoes = ?')
      values.push(input.observacoes)
    }
    if (input.confirmada !== undefined) {
      sets.push('confirmada = ?')
      values.push(input.confirmada ? 1 : 0)
    }
    if (input.responsavel !== undefined) {
      sets.push('responsavel = ?')
      values.push(input.responsavel)
    }

    if (sets.length === 0) {
      const item = this.getById(id)
      if (!item) throw new Error('Evento música não encontrada')
      return item
    }

    sets.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE evento_musicas SET ${sets.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)

    const updated = this.getById(id)
    if (!updated) throw new Error('Evento música não encontrada')
    return updated
  },

  // Delete a evento_musica
  delete(id: number): void {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM evento_musicas WHERE id = ?')
    stmt.run(id)
  },

  // Delete all musicas for an evento
  deleteByEventoId(eventoId: number): void {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM evento_musicas WHERE evento_id = ?')
    stmt.run(eventoId)
  },

  // Reorder musicas in evento
  reorder(eventoId: number, orderedIds: number[]): void {
    const db = getDb()
    const updateStmt = db.prepare(`
      UPDATE evento_musicas SET ordem = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `)
    
    const transaction = db.transaction(() => {
      orderedIds.forEach((id, index) => {
        updateStmt.run(index + 1, id)
      })
    })
    
    transaction()
  },

  // Copy musicas from template to evento (when creating evento from template)
  copyFromTemplate(templateId: number, eventoId: number): number {
    const db = getDb()
    
    // Get template musicas
    const templateMusicas = db.prepare(`
      SELECT * FROM template_musicas WHERE template_id = ? ORDER BY ordem
    `).all(templateId) as any[]

    if (templateMusicas.length === 0) return 0

    // Insert them as evento_musicas
    const insertStmt = db.prepare(`
      INSERT INTO evento_musicas (evento_id, musica_id, ordem, tom_evento, observacoes)
      VALUES (?, ?, ?, ?, ?)
    `)

    const transaction = db.transaction(() => {
      templateMusicas.forEach((tm) => {
        insertStmt.run(
          eventoId,
          tm.musica_id,
          tm.ordem,
          tm.tom_sugerido,
          tm.observacoes
        )
      })
    })

    transaction()
    return templateMusicas.length
  }
}

import { getDb } from './db'

export interface TemplateMusica {
  id: number
  template_id: number
  musica_id: number
  ordem: number
  tom_sugerido: string | null
  observacoes: string | null
  created_at: string
}

export interface TemplateMusicaWithMusica extends TemplateMusica {
  musicas: {
    id: number
    titulo: string
    artista: string
    tom_original: string | null
  }
}

export interface CreateTemplateMusicaInput {
  template_id: number
  musica_id: number
  ordem: number
  tom_sugerido?: string
  observacoes?: string
}

export interface UpdateTemplateMusicaInput {
  ordem?: number
  tom_sugerido?: string
  observacoes?: string
}

export const templateMusicasDb = {
  // Get all musicas for a template (with musica details)
  getByTemplateId(templateId: number): TemplateMusicaWithMusica[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT 
        tm.*,
        m.titulo,
        m.artista,
        m.tom_original
      FROM template_musicas tm
      JOIN musicas m ON tm.musica_id = m.id
      WHERE tm.template_id = ?
      ORDER BY tm.ordem ASC
    `)
    const rows = stmt.all(templateId) as any[]
    return rows.map(row => ({
      id: row.id,
      template_id: row.template_id,
      musica_id: row.musica_id,
      ordem: row.ordem,
      tom_sugerido: row.tom_sugerido,
      observacoes: row.observacoes,
      created_at: row.created_at,
      musicas: {
        id: row.musica_id,
        titulo: row.titulo,
        artista: row.artista,
        tom_original: row.tom_original
      }
    }))
  },

  // Create a new musica in template
  create(input: CreateTemplateMusicaInput): TemplateMusica {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO template_musicas (template_id, musica_id, ordem, tom_sugerido, observacoes)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      input.template_id,
      input.musica_id,
      input.ordem,
      input.tom_sugerido || null,
      input.observacoes || null
    )
    
    const created = this.getById(result.lastInsertRowid as number)
    if (!created) throw new Error('Erro ao criar template_musica')
    return created
  },

  // Get by ID
  getById(id: number): TemplateMusica | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM template_musicas WHERE id = ?')
    const row = stmt.get(id) as any
    if (!row) return null
    return row
  },

  // Update a template_musica
  update(id: number, input: UpdateTemplateMusicaInput): TemplateMusica {
    const db = getDb()
    const sets: string[] = []
    const values: any[] = []

    if (input.ordem !== undefined) {
      sets.push('ordem = ?')
      values.push(input.ordem)
    }
    if (input.tom_sugerido !== undefined) {
      sets.push('tom_sugerido = ?')
      values.push(input.tom_sugerido)
    }
    if (input.observacoes !== undefined) {
      sets.push('observacoes = ?')
      values.push(input.observacoes)
    }

    if (sets.length === 0) {
      const item = this.getById(id)
      if (!item) throw new Error('Template música não encontrada')
      return item
    }

    values.push(id)

    const stmt = db.prepare(`
      UPDATE template_musicas SET ${sets.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)

    const updated = this.getById(id)
    if (!updated) throw new Error('Template música não encontrada')
    return updated
  },

  // Delete a template_musica
  delete(id: number): void {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM template_musicas WHERE id = ?')
    stmt.run(id)
  },

  // Delete all musicas for a template
  deleteByTemplateId(templateId: number): void {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM template_musicas WHERE template_id = ?')
    stmt.run(templateId)
  },

  // Reorder musicas in template
  reorder(templateId: number, orderedIds: number[]): void {
    const db = getDb()
    const updateStmt = db.prepare(`
      UPDATE template_musicas SET ordem = ? WHERE id = ? AND template_id = ?
    `)
    
    const transaction = db.transaction(() => {
      orderedIds.forEach((id, index) => {
        updateStmt.run(index + 1, id, templateId)
      })
    })
    
    transaction()
  }
}

import { getDb } from './db'

export type EventoStatus = 'rascunho' | 'confirmado' | 'realizado' | 'cancelado'

export interface Evento {
  id: number
  nome: string
  data: string
  hora: string | null
  local: string | null
  status: EventoStatus
  template_id: number | null
  tags: string[]
  observacoes: string | null
  created_at: string
  updated_at: string
}

export interface Template {
  id: number
  nome: string
  descricao: string | null
  tags: string[]
  created_at: string
}

export interface EventoWithTemplate extends Evento {
  templates?: Template | null
}

export interface CreateEventoInput {
  nome: string
  data?: string | null
  hora?: string
  local?: string
  status?: EventoStatus
  template_id?: number
  tags?: string[]
  observacoes?: string
}

export interface UpdateEventoInput {
  nome?: string
  data?: string
  hora?: string
  local?: string
  status?: EventoStatus
  template_id?: number
  tags?: string[]
  observacoes?: string
}

export const eventosDb = {
  getAll(): EventoWithTemplate[] {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT e.*, t.nome as template_nome, t.descricao as template_descricao, t.tags as template_tags, t.created_at as template_created_at
      FROM eventos e
      LEFT JOIN templates t ON e.template_id = t.id
      ORDER BY e.data DESC, e.hora ASC
    `)
    const rows = stmt.all() as any[]
    return rows.map(row => ({
      id: row.id,
      nome: row.nome,
      data: row.data,
      hora: row.hora,
      local: row.local,
      status: row.status,
      template_id: row.template_id,
      tags: JSON.parse(row.tags || '[]'),
      observacoes: row.observacoes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      templates: row.template_nome ? {
        id: row.template_id,
        nome: row.template_nome,
        descricao: row.template_descricao,
        tags: JSON.parse(row.template_tags || '[]'),
        created_at: row.template_created_at
      } : null
    }))
  },

  getById(id: number): EventoWithTemplate | null {
    const db = getDb()
    const stmt = db.prepare(`
      SELECT e.*, t.nome as template_nome, t.descricao as template_descricao, t.tags as template_tags, t.created_at as template_created_at
      FROM eventos e
      LEFT JOIN templates t ON e.template_id = t.id
      WHERE e.id = ?
    `)
    const row = stmt.get(id) as any
    if (!row) return null
    
    return {
      id: row.id,
      nome: row.nome,
      data: row.data,
      hora: row.hora,
      local: row.local,
      status: row.status,
      template_id: row.template_id,
      tags: JSON.parse(row.tags || '[]'),
      observacoes: row.observacoes,
      created_at: row.created_at,
      updated_at: row.updated_at,
      templates: row.template_nome ? {
        id: row.template_id,
        nome: row.template_nome,
        descricao: row.template_descricao,
        tags: JSON.parse(row.template_tags || '[]'),
        created_at: row.template_created_at
      } : null
    }
  },

  create(input: CreateEventoInput): Evento {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO eventos (nome, data, hora, local, status, template_id, tags, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      input.nome,
      input.data || null,
      input.hora || null,
      input.local || null,
      input.status || 'rascunho',
      input.template_id || null,
      JSON.stringify(input.tags || []),
      input.observacoes || null
    )
    
    const evento = this.getById(result.lastInsertRowid as number)
    if (!evento) throw new Error('Erro ao criar evento')
    return evento
  },

  update(id: number, input: UpdateEventoInput): Evento {
    const db = getDb()
    const sets: string[] = []
    const values: any[] = []

    if (input.nome !== undefined) {
      sets.push('nome = ?')
      values.push(input.nome)
    }
    if (input.data !== undefined) {
      sets.push('data = ?')
      values.push(input.data)
    }
    if (input.hora !== undefined) {
      sets.push('hora = ?')
      values.push(input.hora)
    }
    if (input.local !== undefined) {
      sets.push('local = ?')
      values.push(input.local)
    }
    if (input.status !== undefined) {
      sets.push('status = ?')
      values.push(input.status)
    }
    if (input.template_id !== undefined) {
      sets.push('template_id = ?')
      values.push(input.template_id)
    }
    if (input.tags !== undefined) {
      sets.push('tags = ?')
      values.push(JSON.stringify(input.tags))
    }
    if (input.observacoes !== undefined) {
      sets.push('observacoes = ?')
      values.push(input.observacoes)
    }

    if (sets.length === 0) {
      const evento = this.getById(id)
      if (!evento) throw new Error('Evento não encontrado')
      return evento
    }

    sets.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE eventos SET ${sets.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)

    const evento = this.getById(id)
    if (!evento) throw new Error('Evento não encontrado')
    return evento
  },

  delete(id: number): void {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM eventos WHERE id = ?')
    stmt.run(id)
  }
}

// Templates
export const templatesDb = {
  getAll(): Template[] {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM templates ORDER BY nome ASC')
    const rows = stmt.all() as any[]
    return rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }))
  },

  getById(id: number): Template | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM templates WHERE id = ?')
    const row = stmt.get(id) as any
    if (!row) return null
    return {
      ...row,
      tags: JSON.parse(row.tags || '[]')
    }
  },

  create(nome: string, descricao?: string, tags?: string[]): Template {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO templates (nome, descricao, tags)
      VALUES (?, ?, ?)
    `)
    const result = stmt.run(nome, descricao || null, JSON.stringify(tags || []))
    
    const template = this.getById(result.lastInsertRowid as number)
    if (!template) throw new Error('Erro ao criar template')
    return template
  }
}

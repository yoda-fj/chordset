import { getDb } from './db'
import { parseTags, stringifyTags } from '@/utils/tag-utils'
import type {
  Evento,
  EventoWithTemplate,
  Template,
  CreateEventoInput,
  UpdateEventoInput,
  UpdateTemplateInput,
} from '@/types/database'

// Shape cru da linha do JOIN eventos+templates (tags serializadas)
type EventoRow = Omit<Evento, 'tags'> & { tags: string | null } & {
  template_nome: string | null
  template_descricao: string | null
  template_tags: string | null
  template_created_at: string | null
}

function rowToEvento(row: EventoRow): EventoWithTemplate {
  return {
    id: row.id,
    nome: row.nome,
    data: row.data,
    hora: row.hora,
    local: row.local,
    status: row.status,
    template_id: row.template_id,
    tags: parseTags(row.tags),
    observacoes: row.observacoes,
    audio_url: row.audio_url,
    created_at: row.created_at,
    updated_at: row.updated_at,
    templates: row.template_nome ? {
      id: row.template_id as number,
      nome: row.template_nome,
      descricao: row.template_descricao,
      tags: parseTags(row.template_tags),
      created_at: row.template_created_at as string
    } : null
  }
}

const EVENTO_SELECT = `
  SELECT e.*, t.nome as template_nome, t.descricao as template_descricao, t.tags as template_tags, t.created_at as template_created_at
  FROM eventos e
  LEFT JOIN templates t ON e.template_id = t.id
`

// Shape cru da linha de templates (tags serializadas)
type TemplateRow = Omit<Template, 'tags'> & { tags: string | null }

function rowToTemplate(row: TemplateRow): Template {
  return { ...row, tags: parseTags(row.tags) }
}

export const eventosDb = {
  getAll(): EventoWithTemplate[] {
    const db = getDb()
    const stmt = db.prepare(`${EVENTO_SELECT} ORDER BY e.data DESC, e.hora ASC`)
    const rows = stmt.all() as EventoRow[]
    return rows.map(rowToEvento)
  },

  getById(id: number): EventoWithTemplate | null {
    const db = getDb()
    const stmt = db.prepare(`${EVENTO_SELECT} WHERE e.id = ?`)
    const row = stmt.get(id) as EventoRow | undefined
    if (!row) return null
    return rowToEvento(row)
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
      stringifyTags(input.tags),
      input.observacoes || null
    )

    const insertId = Number(result.lastInsertRowid)
    const evento = this.getById(insertId)
    if (!evento) throw new Error('Erro ao criar evento')
    return evento
  },

  update(id: number, input: UpdateEventoInput): Evento {
    const db = getDb()
    const sets: string[] = []
    const values: (string | number | null)[] = []

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
      values.push(stringifyTags(input.tags))
    }
    if (input.audio_url !== undefined) {
      sets.push('audio_url = ?')
      values.push(input.audio_url)
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
    const rows = stmt.all() as TemplateRow[]
    return rows.map(rowToTemplate)
  },

  getById(id: number): Template | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM templates WHERE id = ?')
    const row = stmt.get(id) as TemplateRow | undefined
    if (!row) return null
    return rowToTemplate(row)
  },

  create(nome: string, descricao?: string, tags?: string[]): Template {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO templates (nome, descricao, tags)
      VALUES (?, ?, ?)
    `)
    const result = stmt.run(nome, descricao || null, stringifyTags(tags))

    const insertId = Number(result.lastInsertRowid)
    const template = this.getById(insertId)
    if (!template) throw new Error('Erro ao criar template')
    return template
  },

  update(id: number, input: UpdateTemplateInput): Template {
    const db = getDb()
    const sets: string[] = []
    const values: (string | number | null)[] = []

    if (input.nome !== undefined) {
      sets.push('nome = ?')
      values.push(input.nome)
    }
    if (input.descricao !== undefined) {
      sets.push('descricao = ?')
      values.push(input.descricao)
    }
    if (input.tags !== undefined) {
      sets.push('tags = ?')
      values.push(stringifyTags(input.tags))
    }

    if (sets.length === 0) {
      const template = this.getById(id)
      if (!template) throw new Error('Template não encontrado')
      return template
    }

    values.push(id)

    const stmt = db.prepare(`
      UPDATE templates SET ${sets.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)

    const template = this.getById(id)
    if (!template) throw new Error('Template não encontrado')
    return template
  },

  delete(id: number): void {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM templates WHERE id = ?')
    stmt.run(id)
  }
}

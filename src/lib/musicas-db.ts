import { getDb } from './db'

export interface Musica {
  id: number
  titulo: string
  artista: string
  tom_original: string | null
  cifra: string | null
  tags: string[]
  observacao: string | null
  audio_url: string | null
  groove: string | null
  drum_pattern_id: number | null
  bpm: number
  volume: number
  created_at: string
  updated_at: string
}

export interface CreateMusicaInput {
  titulo: string
  artista: string
  tom_original?: string
  cifra?: string
  tags?: string[]
}

export interface UpdateMusicaInput {
  titulo?: string
  artista?: string
  tom_original?: string
  cifra?: string
  tags?: string[]
  observacao?: string | null
  audio_url?: string | null
  groove?: string | null
  drum_pattern_id?: number | null
  bpm?: number
  volume?: number
}

export const musicasDb = {
  getAll(): Musica[] {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM musicas ORDER BY titulo ASC')
    const rows = stmt.all() as any[]
    return rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      observacao: row.observacao || null,
      audio_url: row.audio_url || null,
      groove: row.groove || null,
      drum_pattern_id: row.drum_pattern_id || null,
      bpm: row.bpm || 120,
      volume: row.volume ?? 0.7
    }))
  },

  getById(id: number): Musica | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM musicas WHERE id = ?')
    const row = stmt.get(id) as any
    if (!row) return null
    return {
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      observacao: row.observacao || null,
      audio_url: row.audio_url || null,
      groove: row.groove || null,
      drum_pattern_id: row.drum_pattern_id || null,
      bpm: row.bpm || 120,
      volume: row.volume ?? 0.7
    }
  },

  create(input: CreateMusicaInput): Musica {
    const db = getDb()
    const stmt = db.prepare(`
      INSERT INTO musicas (titulo, artista, tom_original, cifra, tags)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      input.titulo,
      input.artista,
      input.tom_original || null,
      input.cifra || null,
      JSON.stringify(input.tags || [])
    )
    
    const musica = this.getById(result.lastInsertRowid as number)
    if (!musica) throw new Error('Erro ao criar música')
    return musica
  },

  update(id: number, input: UpdateMusicaInput): Musica {
    const db = getDb()
    const sets: string[] = []
    const values: any[] = []

    if (input.titulo !== undefined) {
      sets.push('titulo = ?')
      values.push(input.titulo)
    }
    if (input.artista !== undefined) {
      sets.push('artista = ?')
      values.push(input.artista)
    }
    if (input.tom_original !== undefined) {
      sets.push('tom_original = ?')
      values.push(input.tom_original)
    }
    if (input.cifra !== undefined) {
      sets.push('cifra = ?')
      values.push(input.cifra)
    }
    if (input.tags !== undefined) {
      sets.push('tags = ?')
      values.push(JSON.stringify(input.tags))
    }
    if (input.observacao !== undefined) {
      sets.push('observacao = ?')
      values.push(input.observacao)
    }
    if (input.audio_url !== undefined) {
      sets.push('audio_url = ?')
      values.push(input.audio_url)
    }
    if (input.groove !== undefined) {
      sets.push('groove = ?')
      values.push(input.groove)
    }

    if (input.drum_pattern_id !== undefined) {
      sets.push('drum_pattern_id = ?')
      values.push(input.drum_pattern_id)
    }

    if (input.bpm !== undefined) {
      sets.push('bpm = ?')
      values.push(input.bpm)
    }

    if (input.volume !== undefined) {
      sets.push('volume = ?')
      values.push(input.volume)
    }

    if (sets.length === 0) {
      const musica = this.getById(id)
      if (!musica) throw new Error('Música não encontrada')
      return musica
    }

    sets.push('updated_at = CURRENT_TIMESTAMP')
    values.push(id)

    const stmt = db.prepare(`
      UPDATE musicas SET ${sets.join(', ')} WHERE id = ?
    `)
    stmt.run(...values)

    const musica = this.getById(id)
    if (!musica) throw new Error('Música não encontrada')
    return musica
  },

  delete(id: number): void {
    const db = getDb()
    const stmt = db.prepare('DELETE FROM musicas WHERE id = ?')
    stmt.run(id)
  },

  search(query: string, tag?: string): Musica[] {
    const db = getDb()
    let sql = 'SELECT * FROM musicas WHERE (titulo LIKE ? OR artista LIKE ?)'
    const params: any[] = [`%${query}%`, `%${query}%`]
    
    if (tag) {
      sql += ' AND tags LIKE ?'
      params.push(`%"${tag}"%`)
    }
    
    sql += ' ORDER BY titulo ASC'
    
    const stmt = db.prepare(sql)
    const rows = stmt.all(...params) as any[]
    return rows.map(row => ({
      ...row,
      tags: JSON.parse(row.tags || '[]'),
      observacao: row.observacao || null,
      audio_url: row.audio_url || null,
      groove: row.groove || null,
      drum_pattern_id: row.drum_pattern_id || null,
      bpm: row.bpm || 120,
      volume: row.volume ?? 0.7
    }))
  },

  getAllTags(): string[] {
    const db = getDb()
    const stmt = db.prepare('SELECT tags FROM musicas')
    const rows = stmt.all() as any[]
    const tagsSet = new Set<string>()
    
    rows.forEach(row => {
      const tags = JSON.parse(row.tags || '[]') as string[]
      tags.forEach(tag => tagsSet.add(tag))
    })
    
    return Array.from(tagsSet).sort()
  }
}

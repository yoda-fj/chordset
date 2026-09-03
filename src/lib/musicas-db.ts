import { getDb } from './db'
import { parseTags, stringifyTags } from '@/utils/tag-utils'
import type { Musica, CreateMusicaInput, UpdateMusicaInput } from '@/types/database'

// Shape cru da linha no SQLite (tags serializada como JSON string)
type MusicaRow = Omit<Musica, 'tags'> & { tags: string | null }

function rowToMusica(row: MusicaRow): Musica {
  return {
    ...row,
    tags: parseTags(row.tags),
    observacao: row.observacao || null,
    audio_url: row.audio_url || null,
    groove: row.groove || null,
    drum_pattern_id: row.drum_pattern_id || null,
    bpm: row.bpm || 120,
    volume: row.volume ?? 0.7
  }
}

export const musicasDb = {
  getAll(): Musica[] {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM musicas ORDER BY titulo ASC')
    const rows = stmt.all() as MusicaRow[]
    return rows.map(rowToMusica)
  },

  getById(id: number): Musica | null {
    const db = getDb()
    const stmt = db.prepare('SELECT * FROM musicas WHERE id = ?')
    const row = stmt.get(id) as MusicaRow | undefined
    if (!row) return null
    return rowToMusica(row)
  },

  /**
   * Busca case-insensitive por (titulo, artista) — usado no dedup do import-song.
   * Query parametrizada, sem varrer a tabela inteira em memória.
   */
  findByTituloArtista(titulo: string, artista: string): Musica | null {
    const db = getDb()
    const stmt = db.prepare(
      'SELECT * FROM musicas WHERE lower(titulo) = lower(?) AND lower(artista) = lower(?) LIMIT 1'
    )
    const row = stmt.get(titulo, artista) as MusicaRow | undefined
    if (!row) return null
    return rowToMusica(row)
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
      stringifyTags(input.tags)
    )

    const insertId = Number(result.lastInsertRowid)
    const musica = this.getById(insertId)
    if (!musica) throw new Error('Erro ao criar música')
    return musica
  },

  update(id: number, input: UpdateMusicaInput): Musica {
    const db = getDb()
    const sets: string[] = []
    const values: (string | number | null)[] = []

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
      values.push(stringifyTags(input.tags))
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

    // Sanitize tag input - only allow alphanumeric and spaces
    const sanitizedTag = tag ? tag.replace(/[^a-zA-Z0-9\s]/g, '').trim() : undefined

    let sql = 'SELECT * FROM musicas WHERE (titulo LIKE ? OR artista LIKE ?)'
    const params: string[] = [`%${query}%`, `%${query}%`]

    if (sanitizedTag) {
      sql += ' AND tags LIKE ?'
      params.push(`%"${sanitizedTag}"%`)
    }

    sql += ' ORDER BY titulo ASC'

    const stmt = db.prepare(sql)
    const rows = stmt.all(...params) as MusicaRow[]
    return rows.map(rowToMusica)
  },

  getAllTags(): string[] {
    const db = getDb()
    const stmt = db.prepare('SELECT tags FROM musicas')
    const rows = stmt.all() as { tags: string | null }[]
    const tagsSet = new Set<string>()

    rows.forEach(row => {
      const tags = parseTags(row.tags)
      tags.forEach(tag => tagsSet.add(tag))
    })

    return Array.from(tagsSet).sort()
  }
}

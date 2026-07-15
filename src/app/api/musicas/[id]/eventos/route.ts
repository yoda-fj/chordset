import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { jsonError, parseId } from '@/lib/api-helpers'

// GET /api/musicas/[id]/eventos - Listar eventos que usam esta música
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const musicaId = parseId(id)
    
    if (musicaId === null) {
      return jsonError('ID inválido', 400)
    }
    
    const db = getDb()
    const eventos = db.prepare(`
      SELECT 
        e.id,
        e.nome,
        e.data,
        e.hora,
        e.local,
        e.status,
        em.ordem,
        em.tom_evento,
        em.confirmada
      FROM evento_musicas em
      JOIN eventos e ON em.evento_id = e.id
      WHERE em.musica_id = ?
      ORDER BY e.data DESC
    `).all(musicaId)
    
    return NextResponse.json(eventos)
  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
    return jsonError('Erro ao buscar eventos', 500)
  }
}

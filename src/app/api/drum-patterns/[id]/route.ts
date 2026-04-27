import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = getDb()
    const pattern = db.prepare('SELECT * FROM drum_patterns WHERE id = ?').get(id)
    if (!pattern) {
      return NextResponse.json({ error: 'Ritmo não encontrado' }, { status: 404 })
    }
    return NextResponse.json(pattern)
  } catch (error) {
    console.error('[drum-patterns id GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar ritmo' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { nome, bpm, kit, steps } = body

    const db = getDb()
    const exists = db.prepare('SELECT id FROM drum_patterns WHERE id = ?').get(id)
    if (!exists) {
      return NextResponse.json({ error: 'Ritmo não encontrado' }, { status: 404 })
    }

    db.prepare(
      'UPDATE drum_patterns SET nome = ?, bpm = ?, kit = ?, steps = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(nome, bpm, kit, JSON.stringify(steps), id)

    const pattern = db.prepare('SELECT * FROM drum_patterns WHERE id = ?').get(id)
    return NextResponse.json(pattern)
  } catch (error) {
    console.error('[drum-patterns id PUT]', error)
    return NextResponse.json({ error: 'Erro ao atualizar ritmo' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const db = getDb()
    const exists = db.prepare('SELECT id FROM drum_patterns WHERE id = ?').get(id)
    if (!exists) {
      return NextResponse.json({ error: 'Ritmo não encontrado' }, { status: 404 })
    }

    // Safe delete: check if any music is using this pattern
    const inUse = db.prepare('SELECT COUNT(*) as count FROM musicas WHERE drum_pattern_id = ?').get(id) as any
    if (inUse.count > 0) {
      return NextResponse.json(
        { error: 'Este ritmo está em uso por uma ou mais músicas. Desassocie-o primeiro.' },
        { status: 409 }
      )
    }

    db.prepare('DELETE FROM drum_patterns WHERE id = ?').run(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[drum-patterns id DELETE]', error)
    return NextResponse.json({ error: 'Erro ao excluir ritmo' }, { status: 500 })
  }
}

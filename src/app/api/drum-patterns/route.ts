import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

export async function GET() {
  try {
    const db = getDb()
    const patterns = db.prepare('SELECT * FROM drum_patterns ORDER BY created_at DESC').all()
    return NextResponse.json(patterns)
  } catch (error) {
    console.error('[drum-patterns GET]', error)
    return NextResponse.json({ error: 'Erro ao buscar ritmos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, bpm, kit, steps } = body

    if (!nome || !steps) {
      return NextResponse.json({ error: 'Nome e steps são obrigatórios' }, { status: 400 })
    }

    const db = getDb()
    const result = db.prepare(
      'INSERT INTO drum_patterns (nome, bpm, kit, steps) VALUES (?, ?, ?, ?)'
    ).run(nome, bpm || 120, kit || 'kit1', JSON.stringify(steps))

    const pattern = db.prepare('SELECT * FROM drum_patterns WHERE id = ?').get(result.lastInsertRowid)
    return NextResponse.json(pattern, { status: 201 })
  } catch (error) {
    console.error('[drum-patterns POST]', error)
    return NextResponse.json({ error: 'Erro ao criar ritmo' }, { status: 500 })
  }
}

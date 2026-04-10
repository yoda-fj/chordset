import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

// GET /api/templates - Listar todos os templates
export async function GET(request: NextRequest) {
  try {
    const db = getDb()
    const templates = db.prepare('SELECT * FROM templates ORDER BY created_at DESC').all()
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar templates' },
      { status: 500 }
    )
  }
}

// POST /api/templates - Criar novo template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (!body.nome) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      )
    }
    
    const db = getDb()
    const result = db.prepare(`
      INSERT INTO templates (nome, descricao, tags)
      VALUES (?, ?, ?)
    `).run(
      body.nome,
      body.descricao || null,
      JSON.stringify(body.tags || [])
    )
    
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(result.lastInsertRowid)
    
    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar template:', error)
    return NextResponse.json(
      { error: 'Erro ao criar template' },
      { status: 500 }
    )
  }
}

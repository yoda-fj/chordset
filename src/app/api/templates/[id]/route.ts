import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'

type TemplateRow = {
  id: number
  nome: string
  descricao: string | null
  tags: string
  created_at: string
  updated_at: string
}

// GET /api/templates/[id] - Obter template por ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    const template = db.prepare('SELECT * FROM templates WHERE id = ?').get(parseInt(id)) as TemplateRow | undefined
    
    if (!template) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }
    
    return NextResponse.json(template)
  } catch (error) {
    console.error('Erro ao buscar template:', error)
    return NextResponse.json({ error: 'Erro ao buscar template' }, { status: 500 })
  }
}

// PUT /api/templates/[id] - Atualizar template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const db = getDb()
    
    const existing = db.prepare('SELECT * FROM templates WHERE id = ?').get(parseInt(id)) as TemplateRow | undefined
    if (!existing) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }
    
    db.prepare(`
      UPDATE templates 
      SET nome = ?, descricao = ?, tags = ?
      WHERE id = ?
    `).run(
      body.nome || existing.nome,
      body.descricao !== undefined ? body.descricao : existing.descricao,
      JSON.stringify(body.tags || []),
      parseInt(id)
    )
    
    const updated = db.prepare('SELECT * FROM templates WHERE id = ?').get(parseInt(id)) as TemplateRow
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar template:', error)
    return NextResponse.json({ error: 'Erro ao atualizar template' }, { status: 500 })
  }
}

// DELETE /api/templates/[id] - Excluir template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const db = getDb()
    
    const existing = db.prepare('SELECT * FROM templates WHERE id = ?').get(parseInt(id))
    if (!existing) {
      return NextResponse.json({ error: 'Template não encontrado' }, { status: 404 })
    }
    
    db.prepare('DELETE FROM templates WHERE id = ?').run(parseInt(id))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir template:', error)
    return NextResponse.json({ error: 'Erro ao excluir template' }, { status: 500 })
  }
}

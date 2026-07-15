import { NextRequest, NextResponse } from 'next/server'
import { templatesDb } from '@/lib/eventos-db'
import { jsonError } from '@/lib/api-helpers'

// GET /api/templates - Listar todos os templates (ordenados por nome)
export async function GET() {
  try {
    const templates = templatesDb.getAll()
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Erro ao buscar templates:', error)
    return jsonError('Erro ao buscar templates', 500)
  }
}

// POST /api/templates - Criar novo template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.nome) {
      return jsonError('Nome é obrigatório', 400)
    }

    const template = templatesDb.create(body.nome, body.descricao, body.tags)

    return NextResponse.json(template, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar template:', error)
    return jsonError('Erro ao criar template', 500)
  }
}

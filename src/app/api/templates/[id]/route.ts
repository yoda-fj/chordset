import { NextRequest, NextResponse } from 'next/server'
import { templatesDb } from '@/lib/eventos-db'
import { jsonError, parseId } from '@/lib/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/templates/[id] - Obter template por ID
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const templateId = parseId(id)
    if (templateId === null) {
      return jsonError('ID inválido', 400)
    }

    const template = templatesDb.getById(templateId)

    if (!template) {
      return jsonError('Template não encontrado', 404)
    }

    return NextResponse.json(template)
  } catch (error) {
    console.error('Erro ao buscar template:', error)
    return jsonError('Erro ao buscar template', 500)
  }
}

// PUT /api/templates/[id] - Atualizar template
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const templateId = parseId(id)
    if (templateId === null) {
      return jsonError('ID inválido', 400)
    }

    const existing = templatesDb.getById(templateId)
    if (!existing) {
      return jsonError('Template não encontrado', 404)
    }

    const body = await request.json()
    const updated = templatesDb.update(templateId, {
      nome: body.nome,
      descricao: body.descricao,
      tags: body.tags,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Erro ao atualizar template:', error)
    return jsonError('Erro ao atualizar template', 500)
  }
}

// DELETE /api/templates/[id] - Excluir template
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const templateId = parseId(id)
    if (templateId === null) {
      return jsonError('ID inválido', 400)
    }

    const existing = templatesDb.getById(templateId)
    if (!existing) {
      return jsonError('Template não encontrado', 404)
    }

    templatesDb.delete(templateId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao excluir template:', error)
    return jsonError('Erro ao excluir template', 500)
  }
}

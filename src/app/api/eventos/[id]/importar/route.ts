import { NextRequest, NextResponse } from 'next/server'
import { templateMusicasDb } from '@/lib/template-musicas-db'
import { setlistsDb } from '@/lib/setlists-db'
import { jsonError, parseId } from '@/lib/api-helpers'

// POST /api/eventos/[id]/importar - Importar músicas de um template para o evento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventoId = parseId(id)

    if (eventoId === null) {
      return jsonError('ID inválido', 400)
    }

    const body = await request.json()
    const { template_id } = body

    if (!template_id) {
      return jsonError('template_id é obrigatório', 400)
    }

    // Buscar músicas do template
    const templateMusicas = templateMusicasDb.getByTemplateId(template_id)

    if (templateMusicas.length === 0) {
      return jsonError('Template não tem músicas', 400)
    }

    // Copiar músicas para o evento (transacional)
    const quantidade = setlistsDb.copyFromTemplate(template_id, eventoId)

    return NextResponse.json({
      sucesso: true,
      quantidade,
    })
  } catch (error) {
    console.error('Erro ao importar do template:', error)
    return jsonError('Erro ao importar músicas do template', 500)
  }
}

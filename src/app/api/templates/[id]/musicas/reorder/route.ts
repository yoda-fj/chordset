import { NextRequest, NextResponse } from 'next/server'
import { templateMusicasDb } from '@/lib/template-musicas-db'
import { jsonError, parseId } from '@/lib/api-helpers'

// POST /api/templates/[id]/musicas/reorder - Reordenar músicas do template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const templateId = parseId(id)
    
    if (templateId === null) {
      return jsonError('ID inválido', 400)
    }
    
    const body = await request.json()
    
    if (!body.orderedIds || !Array.isArray(body.orderedIds)) {
      return jsonError('orderedIds é obrigatório e deve ser um array', 400)
    }
    
    templateMusicasDb.reorder(templateId, body.orderedIds)
    
    const musicas = templateMusicasDb.getByTemplateId(templateId)
    return NextResponse.json(musicas)
  } catch (error) {
    console.error('Erro ao reordenar músicas:', error)
    return jsonError('Erro ao reordenar músicas', 500)
  }
}

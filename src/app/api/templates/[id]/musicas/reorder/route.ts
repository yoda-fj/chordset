import { NextRequest, NextResponse } from 'next/server'
import { templateMusicasDb } from '@/lib/template-musicas-db'

// POST /api/templates/[id]/musicas/reorder - Reordenar músicas do template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const templateId = parseInt(id)
    
    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    
    const body = await request.json()
    
    if (!body.orderedIds || !Array.isArray(body.orderedIds)) {
      return NextResponse.json(
        { error: 'orderedIds é obrigatório e deve ser um array' },
        { status: 400 }
      )
    }
    
    templateMusicasDb.reorder(templateId, body.orderedIds)
    
    const musicas = templateMusicasDb.getByTemplateId(templateId)
    return NextResponse.json(musicas)
  } catch (error) {
    console.error('Erro ao reordenar músicas:', error)
    return NextResponse.json(
      { error: 'Erro ao reordenar músicas' },
      { status: 500 }
    )
  }
}

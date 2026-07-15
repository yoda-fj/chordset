import { NextRequest, NextResponse } from 'next/server'
import { templateMusicasDb } from '@/lib/template-musicas-db'
import { jsonError, parseId } from '@/lib/api-helpers'

// GET /api/templates/[id]/musicas - Listar músicas do template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const templateId = parseId(id)
    
    if (templateId === null) {
      return jsonError('ID inválido', 400)
    }
    
    const musicas = templateMusicasDb.getByTemplateId(templateId)
    return NextResponse.json(musicas)
  } catch (error) {
    console.error('Erro ao buscar músicas do template:', error)
    return jsonError('Erro ao buscar músicas do template', 500)
  }
}

// POST /api/templates/[id]/musicas - Adicionar música ao template
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
    const { musica_id, ordem, tom_sugerido, observacoes } = body
    
    if (!musica_id) {
      return jsonError('musica_id é obrigatório', 400)
    }
    
    // Se não informar ordem, pegar a próxima
    let ordemNum = ordem
    if (!ordemNum) {
      const musicas = templateMusicasDb.getByTemplateId(templateId)
      ordemNum = musicas.length + 1
    }
    
    const created = templateMusicasDb.create({
      template_id: templateId,
      musica_id,
      ordem: ordemNum,
      tom_sugerido,
      observacoes,
    })
    
    return NextResponse.json(created)
  } catch (error) {
    console.error('Erro ao adicionar música ao template:', error)
    return jsonError('Erro ao adicionar música ao template', 500)
  }
}

// DELETE /api/templates/[id]/musicas - Remover música do template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const templateId = parseId(id)
    
    if (templateId === null) {
      return jsonError('ID inválido', 400)
    }
    
    const { searchParams } = new URL(request.url)
    const musicaId = searchParams.get('musica_id')
    
    if (!musicaId) {
      return jsonError('musica_id é obrigatório', 400)
    }
    
    // Remover todas as ocorrências dessa música no template
    // Na verdade, vamos remover pelo ID da tabela template_musicas
    templateMusicasDb.delete(parseInt(musicaId))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover música do template:', error)
    return jsonError('Erro ao remover música do template', 500)
  }
}

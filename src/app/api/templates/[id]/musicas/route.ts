import { NextRequest, NextResponse } from 'next/server'
import { templateMusicasDb } from '@/lib/template-musicas-db'

// GET /api/templates/[id]/musicas - Listar músicas do template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const templateId = parseInt(id)
    
    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    
    const musicas = templateMusicasDb.getByTemplateId(templateId)
    return NextResponse.json(musicas)
  } catch (error) {
    console.error('Erro ao buscar músicas do template:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar músicas do template' },
      { status: 500 }
    )
  }
}

// POST /api/templates/[id]/musicas - Adicionar música ao template
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
    const { musica_id, ordem, tom_sugerido, observacoes } = body
    
    if (!musica_id) {
      return NextResponse.json({ error: 'musica_id é obrigatório' }, { status: 400 })
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
    return NextResponse.json(
      { error: 'Erro ao adicionar música ao template' },
      { status: 500 }
    )
  }
}

// DELETE /api/templates/[id]/musicas - Remover música do template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const templateId = parseInt(id)
    
    if (isNaN(templateId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    
    const { searchParams } = new URL(request.url)
    const musicaId = searchParams.get('musica_id')
    
    if (!musicaId) {
      return NextResponse.json({ error: 'musica_id é obrigatório' }, { status: 400 })
    }
    
    // Remover todas as ocorrências dessa música no template
    // Na verdade, vamos remover pelo ID da tabela template_musicas
    templateMusicasDb.delete(parseInt(musicaId))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao remover música do template:', error)
    return NextResponse.json(
      { error: 'Erro ao remover música do template' },
      { status: 500 }
    )
  }
}

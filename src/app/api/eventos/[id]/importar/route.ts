import { NextRequest, NextResponse } from 'next/server'
import { eventosDb } from '@/lib/eventos-db'
import { templateMusicasDb } from '@/lib/template-musicas-db'
import { setlistsDb } from '@/lib/setlists-db'

// POST /api/eventos/[id]/importar - Importar músicas de um template para o evento
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const eventoId = parseInt(id)
    
    if (isNaN(eventoId)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    }
    
    const body = await request.json()
    const { template_id } = body
    
    if (!template_id) {
      return NextResponse.json({ error: 'template_id é obrigatório' }, { status: 400 })
    }
    
    // Buscar músicas do template
    const templateMusicas = templateMusicasDb.getByTemplateId(template_id)
    
    if (templateMusicas.length === 0) {
      return NextResponse.json({ error: 'Template não tem músicas' }, { status: 400 })
    }
    
    // Copiar cada música para o evento
    const musicasImportadas = []
    for (const tm of templateMusicas) {
      const created = setlistsDb.create({
        evento_id: eventoId,
        musica_id: tm.musica_id,
        ordem: tm.ordem,
        tom_evento: tm.tom_sugerido || undefined,
        observacoes: tm.observacoes || undefined,
      })
      musicasImportadas.push(created)
    }
    
    return NextResponse.json({
      sucesso: true,
      quantidade: musicasImportadas.length,
      musicas: musicasImportadas
    })
  } catch (error) {
    console.error('Erro ao importar do template:', error)
    return NextResponse.json(
      { error: 'Erro ao importar músicas do template' },
      { status: 500 }
    )
  }
}

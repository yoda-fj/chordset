import { NextRequest, NextResponse } from 'next/server'
import { eventosDb } from '@/lib/eventos-db'
import { setlistsDb } from '@/lib/setlists-db'
import { jsonError } from '@/lib/api-helpers'

// GET /api/eventos - Listar todos os eventos
export async function GET() {
  try {
    const eventos = eventosDb.getAll()
    return NextResponse.json(eventos)
  } catch (error) {
    console.error('Erro ao buscar eventos:', error)
    return jsonError('Erro ao buscar eventos', 500)
  }
}

// POST /api/eventos - Criar novo evento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validação
    if (!body.nome) {
      return jsonError('Nome é obrigatório', 400)
    }
    
    // Data é obrigatória apenas se não for lista de estudo
    if (!body.data && !body.isStudyList) {
      return jsonError('Nome e data são obrigatórios', 400)
    }
    
    const evento = eventosDb.create({
      nome: body.nome,
      data: body.data,
      hora: body.hora,
      local: body.local,
      status: body.status,
      template_id: body.template_id,
      tags: body.tags || [],
      observacoes: body.observacoes
    })
    
    // Se tem template_id, copiar musicas do template para o evento
    if (evento.template_id) {
      const musicasCopiadas = setlistsDb.copyFromTemplate(evento.template_id, evento.id)
      console.log(`Copiadas ${musicasCopiadas} musicas do template ${evento.template_id} para o evento ${evento.id}`)
    }
    
    return NextResponse.json(evento, { status: 201 })
  } catch (error) {
    console.error('Erro ao criar evento:', error)
    return jsonError('Erro ao criar evento', 500)
  }
}

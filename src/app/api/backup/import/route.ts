import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { importBackup, validateBackup } from '@/lib/backup'
import { jsonError } from '@/lib/api-helpers'

// POST /api/backup/import - Restaurar backup JSON no banco (transação única)
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonError('JSON inválido', 400)
  }

  // Valida o formato ANTES de qualquer escrita no banco
  const validation = validateBackup(body)
  if (!validation.ok) {
    return jsonError(validation.error, 400)
  }

  try {
    const counts = importBackup(getDb(), validation.data)
    return NextResponse.json({ ok: true, tables: counts })
  } catch (error) {
    console.error('[backup import]', error)
    return jsonError('Erro ao importar backup', 500)
  }
}

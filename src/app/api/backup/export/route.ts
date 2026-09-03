import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db'
import { exportBackup } from '@/lib/backup'
import { jsonError } from '@/lib/api-helpers'

// POST /api/backup/export - Exportar backup completo do banco em JSON
export async function POST() {
  try {
    const backup = exportBackup(getDb())
    const stamp = backup.exported_at.slice(0, 19).replace(/[:T]/g, '-')
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="chordset-backup-${stamp}.json"`,
      },
    })
  } catch (error) {
    console.error('[backup export]', error)
    return jsonError('Erro ao exportar backup', 500)
  }
}

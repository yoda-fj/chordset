import { NextRequest, NextResponse } from 'next/server'
import { search } from '@/lib/cifraclub-scraper/search'
import { getScraper } from '@/lib/cifraclub-scraper/cifraclub'
import { normalizeImportedSong } from '@/lib/import-pipeline'
import { musicasDb } from '@/lib/musicas-db'
import { jsonError } from '@/lib/api-helpers'
import { reimportarSchema } from '@/lib/validation'
import { buildReimportUpdate, parseCifraClubUrl, resolveReimportTarget } from '@/lib/reimport'

export const runtime = 'nodejs'

// POST /api/musicas/reimportar - Re-importa a cifra de uma música existente
// POST { id: 1 }            → usa cifra_url salva; sem URL, busca titulo+artista
// POST { id: 1, url: ... }  → força uma URL específica (escolha do usuário)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsedBody = reimportarSchema.safeParse(body)
    if (!parsedBody.success) {
      return jsonError('Payload inválido', 400, parsedBody.error.issues)
    }

    const { id, url: bodyUrl } = parsedBody.data

    const musica = musicasDb.getById(id)
    if (!musica) {
      return jsonError('Música não encontrada', 404)
    }

    let targetUrl = bodyUrl || musica.cifra_url

    if (!targetUrl) {
      const searchResult = await search(`${musica.titulo} ${musica.artista}`)
      const resolved = resolveReimportTarget(null, searchResult.songs)

      if (resolved.kind === 'notFound') {
        return jsonError(
          `Nenhum resultado no Cifra Club para "${musica.titulo} — ${musica.artista}". ` +
          'Verifique o título/artista ou importe manualmente.',
          404
        )
      }

      if (resolved.kind === 'needChoice') {
        return NextResponse.json({ needChoice: true, candidates: resolved.candidates })
      }

      targetUrl = resolved.url
    }

    const parsed = parseCifraClubUrl(targetUrl)
    if (!parsed) {
      return jsonError('URL inválida do Cifra Club', 400)
    }

    const scrapeResult = await getScraper().scrape(parsed.artist, parsed.song, parsed.version)

    if ('error' in scrapeResult) {
      return jsonError(scrapeResult.error, 502)
    }

    const song = normalizeImportedSong({
      titulo: scrapeResult.name,
      artista: scrapeResult.artist,
      url: targetUrl,
      provider: 'cifraclub',
      cifraLines: scrapeResult.cifra,
      scrapedKey: scrapeResult.key,
    })

    const updated = musicasDb.update(id, buildReimportUpdate(musica, song, targetUrl))

    return NextResponse.json({
      success: true,
      tom: updated.tom_original,
      linhas: song.cifra.split('\n').length,
    })
  } catch (error) {
    console.error('[Reimportar] Error:', error)
    return jsonError('Erro interno ao processar requisição', 500)
  }
}

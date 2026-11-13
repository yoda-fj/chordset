import { NextRequest, NextResponse } from 'next/server'
import { search } from '@/lib/cifraclub-scraper/search'
import { getScraper } from '@/lib/cifraclub-scraper/cifraclub'
import { normalizeImportedSong, saveImportedSong } from '@/lib/import-pipeline'
import { importSongSchema } from '@/lib/validation'

// Força runtime Node.js (não Edge) pra Playwright funcionar
export const runtime = 'nodejs'

const CIFRACLUB_BASE = 'https://www.cifraclub.com.br/'

// Extrai artist/song/version de uma URL do Cifra Club
function parseCifraClubUrl(url: string): { artist: string; song: string; version?: string } | null {
  const parts = url
    .replace(CIFRACLUB_BASE, '')
    .split('/')
    .filter(Boolean)

  if (parts.length < 2) return null
  return { artist: parts[0], song: parts[1], version: parts[2] || undefined }
}

// Raspa a música da URL e (opcionalmente) salva no banco.
// Compartilhado entre o modo { url } e o modo combinado { query, save }.
async function scrapeSong(url: string, save: boolean | undefined): Promise<NextResponse> {
  const parsed = parseCifraClubUrl(url)
  if (!parsed) {
    return NextResponse.json(
      { success: false, error: 'URL inválida do Cifra Club', provider: 'cifraclub' },
      { status: 400 }
    )
  }

  const scrapeResult = await getScraper().scrape(parsed.artist, parsed.song, parsed.version)

  if ('error' in scrapeResult) {
    return NextResponse.json(
      { success: false, error: scrapeResult.error, provider: 'cifraclub' },
      { status: 400 }
    )
  }

  const song = normalizeImportedSong({
    titulo: scrapeResult.name,
    artista: scrapeResult.artist,
    url,
    provider: 'cifraclub',
    cifraLines: scrapeResult.cifra,
    scrapedKey: scrapeResult.key,
  })

  // Se pediu para salvar no banco também
  if (save !== false) {
    try {
      const result = saveImportedSong(song);

      if (result.status === 'exists') {
        return NextResponse.json({
          success: true,
          alreadyExists: true,
          existingId: result.existingId,
          song,
          provider: 'cifraclub',
          message: 'Música já existe no banco',
        });
      }

      return NextResponse.json({
        success: true,
        saved: true,
        songId: result.songId,
        song,
        provider: 'cifraclub',
      });

    } catch (dbError) {
      console.error('[Import] Database error:', dbError);
      // Mesmo com erro no DB, retorna o resultado da importação
      return NextResponse.json({
        success: true,
        saved: false,
        error: 'Música encontrada mas não foi possível salvar no banco',
        song,
        provider: 'cifraclub',
      });
    }
  }

  return NextResponse.json({
    success: true,
    saved: false,
    song,
    provider: 'cifraclub',
  });
}

// POST /api/import-song - Busca e/ou importa música do Cifra Club
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsedBody = importSongSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Payload inválido', issues: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const { query: rawQuery, url: rawUrl, save } = parsedBody.data;

    // ---------
    // MODO 1: Buscar música (sem importar)
    // POST { query: "Coldplay The Scientist" }
    //
    // MODO 1 COMBINADO: buscar e importar o primeiro resultado na mesma
    // requisição — usado pela importação em lote para gastar 1 requisição
    // por música (a API tem rate limit de 20 req/min por IP).
    // POST { query: "Coldplay The Scientist", save: true }
    // ---------
    if (rawQuery) {
      const query = rawQuery.trim()

      const searchResult = await search(query);
      const results = searchResult.songs.map((s) => {
        const url = `${CIFRACLUB_BASE}${s.artist_slug}/${s.song_slug}`
        return {
          id: url,
          titulo: s.song,
          artista: s.artist,
          url,
          image: s.image || null,
        }
      });

      if (save === true) {
        if (results.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Nenhum resultado encontrado para essa busca',
            provider: 'cifraclub',
            query,
            results,
            total: 0,
          });
        }

        return scrapeSong(results[0].url, save);
      }

      return NextResponse.json({
        success: true,
        provider: 'cifraclub',
        query,
        results,
        total: searchResult.total,
      });
    }

    // ---------
    // MODO 2: Importar música específica
    // POST { url: "https://www.cifraclub.com.br/coldplay/the-scientist" }
    // ---------
    if (rawUrl) {
      return scrapeSong(rawUrl, save);
    }

    // ---------
    // Parâmetros inválidos
    // ---------
    return NextResponse.json(
      {
        error: 'Parâmetros inválidos. Use { query } para buscar, ou { url } para importar.',
      },
      { status: 400 }
    );

  } catch (error) {
    console.error('[Import Song] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição' },
      { status: 500 }
    );
  }
}

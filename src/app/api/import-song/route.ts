import { NextRequest, NextResponse } from 'next/server'
import { search } from '@/lib/cifraclub-scraper/search'
import { getScraper } from '@/lib/cifraclub-scraper/cifraclub'
import { ensureChordProFormat } from '@/utils/chordpro-converter'
import { cleanChordText, extractKeyFromChord } from '@/utils/chord-transposer'
import { musicasDb } from '@/lib/musicas-db'
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
      const url = rawUrl;

      const parsed = parseCifraClubUrl(url)
      if (!parsed) {
        return NextResponse.json(
          { success: false, error: 'URL inválida do Cifra Club', provider: 'cifraclub' },
          { status: 400 }
        );
      }

      const scrapeResult = await getScraper().scrape(parsed.artist, parsed.song, parsed.version)

      if ('error' in scrapeResult) {
        return NextResponse.json(
          { success: false, error: scrapeResult.error, provider: 'cifraclub' },
          { status: 400 }
        );
      }

      const rawCifra = scrapeResult.cifra.join('\n')
      const tomOriginal = scrapeResult.key || extractKeyFromChord(rawCifra)
      const cifraLimpa = cleanChordText(ensureChordProFormat(rawCifra))

      const song = {
        titulo: scrapeResult.name,
        artista: scrapeResult.artist,
        tom_original: tomOriginal,
        cifra: cifraLimpa,
        url,
        provider: 'cifraclub',
      }

      // Se pediu para salvar no banco também
      if (save !== false) {
        try {
          // Verifica se já existe (dedup via query parametrizada, sem varrer a tabela)
          const existing = musicasDb.findByTituloArtista(song.titulo, song.artista);

          if (existing) {
            return NextResponse.json({
              success: true,
              alreadyExists: true,
              existingId: existing.id,
              song,
              provider: 'cifraclub',
              message: 'Música já existe no banco',
            });
          }

          // Salva no banco
          const saved = musicasDb.create({
            titulo: song.titulo,
            artista: song.artista,
            tom_original: tomOriginal || undefined,
            cifra: cifraLimpa || undefined,
            tags: ['cifraclub'], // Marca o provider de origem
          });

          return NextResponse.json({
            success: true,
            saved: true,
            songId: saved.id,
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

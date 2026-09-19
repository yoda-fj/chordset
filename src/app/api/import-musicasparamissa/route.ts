import { NextRequest, NextResponse } from 'next/server'
import { scrapeMusicaParaMissa } from '@/lib/musicasparamissa-scraper/musicasparamissa'
import { normalizeImportedSong, saveImportedSong } from '@/lib/import-pipeline'
import { importMpmSchema } from '@/lib/validation'

export const runtime = 'nodejs'

const PROVIDER = 'musicasparamissa'

// POST /api/import-musicasparamissa - Importa música do Músicas para Missa
// POST { url: "https://musicasparamissa.com.br/musica/a-barca/" }
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const parsedBody = importMpmSchema.safeParse(body);
    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Payload inválido', issues: parsedBody.error.issues },
        { status: 400 }
      );
    }

    const { url, save } = parsedBody.data;

    const scrapeResult = await scrapeMusicaParaMissa(url)

    if ('error' in scrapeResult) {
      return NextResponse.json(
        { success: false, error: scrapeResult.error, provider: PROVIDER },
        { status: 400 }
      );
    }

    const song = normalizeImportedSong({
      titulo: scrapeResult.name,
      artista: scrapeResult.artist,
      url,
      provider: PROVIDER,
      cifraLines: scrapeResult.cifra,
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
            provider: PROVIDER,
            message: 'Música já existe no banco',
          });
        }

        return NextResponse.json({
          success: true,
          saved: true,
          songId: result.songId,
          song,
          provider: PROVIDER,
        });

      } catch (dbError) {
        console.error('[Import MPM] Database error:', dbError);
        // Mesmo com erro no DB, retorna o resultado da importação
        return NextResponse.json({
          success: true,
          saved: false,
          error: 'Música encontrada mas não foi possível salvar no banco',
          song,
          provider: PROVIDER,
        });
      }
    }

    return NextResponse.json({
      success: true,
      saved: false,
      song,
      provider: PROVIDER,
    });

  } catch (error) {
    console.error('[Import MusicasParaMissa] Error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar requisição' },
      { status: 500 }
    );
  }
}

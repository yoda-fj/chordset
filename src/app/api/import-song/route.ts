import { NextRequest, NextResponse } from 'next/server'
import { searchSong, importSong, chordProviders, availableProviders, cleanChordText, extractKeyFromChord } from '@/lib/chord-providers'
import { musicasDb } from '@/lib/musicas-db'

// GET /api/import-song - Lista providers disponíveis
export async function GET() {
  const providers = availableProviders.map(name => {
    const provider = chordProviders[name];
    return {
      name,
      description: provider.description,
      capabilities: provider.capabilities,
    };
  });

  return NextResponse.json({
    providers,
    message: 'Para buscar: POST com { query, provider? } ou { url, provider }',
  });
}

// POST /api/import-song - Busca e/ou importa música
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ---------
    // MODO 1: Buscar música (sem importar)
    // POST { query: "Coldplay The Scientist", provider?: "cifraclub" }
    // ---------
    if (body.query && !body.url) {
      const { query, provider } = body;

      if (!query || query.trim().length < 2) {
        return NextResponse.json(
          { error: 'Query deve ter pelo menos 2 caracteres' },
          { status: 400 }
        );
      }

      const providerName = provider || 'cifraclub';
      
      if (!availableProviders.includes(providerName)) {
        return NextResponse.json(
          { error: `Provider '${providerName}' não disponível. Opções: ${availableProviders.join(', ')}` },
          { status: 400 }
        );
      }

      const results = await searchSong(query, providerName);
      const providerResults = results[providerName];

      return NextResponse.json({
        success: true,
        provider: providerName,
        query,
        results: providerResults.results,
        total: providerResults.total,
      });
    }

    // ---------
    // MODO 2: Importar música específica
    // POST { url: "https://www.cifraclub.com.br/coldplay/the-scientist", provider: "cifraclub" }
    // ---------
    if (body.url && !body.query) {
      const { url, provider } = body;

      if (!url) {
        return NextResponse.json(
          { error: 'URL é obrigatória para importação' },
          { status: 400 }
        );
      }

      const providerName = provider || 'cifraclub';

      if (!availableProviders.includes(providerName)) {
        return NextResponse.json(
          { error: `Provider '${providerName}' não disponível. Opções: ${availableProviders.join(', ')}` },
          { status: 400 }
        );
      }

      const importResult = await importSong(url, providerName);

      if (!importResult.success || !importResult.song) {
        return NextResponse.json(
          {
            success: false,
            error: importResult.error || 'Erro ao importar música',
            provider: providerName,
          },
          { status: 400 }
        );
      }

      // Se pediu para salvar no banco também
      if (body.save !== false && importResult.song) {
        try {
          // Verifica se já existe
          const existing = musicasDb.getAll().find(
            m => m.titulo.toLowerCase() === importResult.song!.titulo.toLowerCase() &&
                 m.artista.toLowerCase() === importResult.song!.artista.toLowerCase()
          );

          if (existing) {
            return NextResponse.json({
              success: true,
              alreadyExists: true,
              existingId: existing.id,
              song: importResult.song,
              provider: providerName,
              message: 'Música já existe no banco',
            });
          }

          // Extrai tom da cifra se não veio
          let tomOriginal = importResult.song.tom_original;
          if (!tomOriginal && importResult.song.cifra) {
            tomOriginal = extractKeyFromChord(importResult.song.cifra);
          }

          // Limpa cifra
          const cifraLimpa = cleanChordText(importResult.song.cifra);

          // Salva no banco
          const saved = musicasDb.create({
            titulo: importResult.song.titulo,
            artista: importResult.song.artista,
            tom_original: tomOriginal || undefined,
            cifra: cifraLimpa || undefined,
            tags: [providerName], // Marca o provider de origem
          });

          return NextResponse.json({
            success: true,
            saved: true,
            songId: saved.id,
            song: {
              ...importResult.song,
              tom_original: tomOriginal,
              cifra: cifraLimpa,
            },
            provider: providerName,
          });

        } catch (dbError) {
          console.error('[Import] Database error:', dbError);
          // Mesmo com erro no DB, retorna o resultado da importação
          return NextResponse.json({
            success: true,
            saved: false,
            error: 'Música encontrada mas não foi possível salvar no banco',
            song: importResult.song,
            provider: providerName,
          });
        }
      }

      return NextResponse.json({
        success: true,
        saved: false,
        song: importResult.song,
        provider: providerName,
      });
    }

    // ---------
    // Parâmetros inválidos
    // ---------
    return NextResponse.json(
      {
        error: 'Parâmetros inválidos. Use { query } para buscar, ou { url, provider } para importar.',
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

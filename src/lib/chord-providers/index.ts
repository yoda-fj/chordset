// =====================================
// PROVIDER INDEX - Interface unificada
// =====================================
//
// Sistema modular de providers para buscar cifras/letras.
// Para adicionar um novo provider, implemente a interface ChordProvider
// e adicione ao registry.
//
// Providers disponíveis:
// - cifraclub: Cifras com acordes (requer API externa via Docker)
// - vagalume: Letras de músicas (API oficial, sem acordes)
//
// =====================================

export * from './types';
export { cifraClubProvider, fetchChordFromCifraClub } from './cifraclub';
export { vagalumeProvider, fetchLyricsFromVagalume } from './vagalume';

import { ChordProvider, SearchResult, SongFromProvider, SongWithChords, ImportSongResult } from './types';
import { cifraClubProvider } from './cifraclub';
import { vagalumeProvider } from './vagalume';

// =====================================
// REGISTRY DE PROVIDERS
// =====================================

export const chordProviders: Record<string, ChordProvider> = {
  cifraclub: cifraClubProvider,
  vagalume: vagalumeProvider,
};

// Lista de providers disponíveis
export const availableProviders = Object.keys(chordProviders);

// =====================================
// FUNÇÕES DE BUSCA
// =====================================

/**
 * Busca música em todos os providers ou num provider específico
 */
export async function searchSong(
  query: string,
  providerName?: string
): Promise<Record<string, SearchResult<SongFromProvider>>> {
  const results: Record<string, SearchResult<SongFromProvider>> = {};

  if (providerName) {
    // Busca apenas no provider especificado
    const provider = chordProviders[providerName];
    if (provider) {
      results[providerName] = await provider.search(query);
    }
  } else {
    // Busca em todos os providers
    for (const [name, provider] of Object.entries(chordProviders)) {
      try {
        results[name] = await provider.search(query);
      } catch (error) {
        console.error(`[Providers] Error searching ${name}:`, error);
        results[name] = { results: [], total: 0, provider: name };
      }
    }
  }

  return results;
}

/**
 * Importa uma música de um provider específico
 */
export async function importSong(
  songUrl: string,
  providerName: string
): Promise<ImportSongResult> {
  const provider = chordProviders[providerName];

  if (!provider) {
    return {
      success: false,
      error: `Provider '${providerName}' não encontrado`,
      provider: providerName,
    };
  }

  try {
    const song = await provider.getChords(songUrl);

    return {
      success: true,
      song: {
        titulo: song.titulo,
        artista: song.artista,
        tom_original: song.tom || null,
        cifra: song.cifra || null,
        url: song.url,
        provider: providerName,
      },
      provider: providerName,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      provider: providerName,
    };
  }
}

/**
 * Busca e importa numa única operação
 */
export async function searchAndImport(
  query: string,
  providerName: string = 'cifraclub'
): Promise<{ searchResults: SearchResult<SongFromProvider>; importResult: ImportSongResult }> {
  // Busca apenas no provider especificado
  const searchResults = await chordProviders[providerName].search(query);

  if (searchResults.results.length === 0) {
    return {
      searchResults,
      importResult: {
        success: false,
        error: 'Nenhum resultado encontrado',
        provider: providerName,
      },
    };
  }

  // Importa o primeiro resultado
  const firstResult = searchResults.results[0];
  const importResult = await importSong(firstResult.url, providerName);

  return { searchResults, importResult };
}

// =====================================
// HELPERS PARA FORMATATAÇÃO
// =====================================

/**
 * Limpa e formata texto de cifra/letra
 */
export function cleanChordText(text: string | null): string {
  if (!text) return '';
  
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extrai o tom de um texto de cifra (ex: "Tom: G")
 */
export function extractKeyFromChord(text: string | null): string | null {
  if (!text) return null;
  
  const match = text.match(/(?:Tom|Key|key):\s*([A-G][#b]?m?)/i);
  return match ? match[1] : null;
}

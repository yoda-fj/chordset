// =====================================
// PROVIDER: VAGALUME
// API oficial: https://api.vagalume.com.br
// =====================================
//
// NOTA: Vagalume fornece LETRAS de músicas, não cifras com acordes.
// Útil para buscar letras quando cifras não estão disponíveis.
//
// API é gratuita e não requer autenticação para endpoints básicos.
// Para uso em produção, é recomendado obter uma API key em:
// https://auth.vagalume.com.br/signup
// =====================================

import { ChordProvider, SearchResult, SongFromProvider, SongWithChords } from './types';

const VAGALUME_API_URL = 'https://api.vagalume.com.br';
// API key é opcional para busca básica, mas recomendada
const VAGALUME_API_KEY = process.env.VAGALUME_API_KEY || '';

export const vagalumeProvider: ChordProvider = {
  name: 'vagalume',
  description: 'Vagalume - Letras de músicas (sem acordes)',
  capabilities: {
    supportsSearch: true,
    hasChords: false,
    lyricsOnly: true,
  },

  async search(query: string): Promise<SearchResult<SongFromProvider>> {
    try {
      // Busca por artista
      const searchUrl = `${VAGALUME_API_URL}/search.php?${VAGALUME_API_KEY ? `apikey=${VAGALUME_API_KEY}&` : ''}art=${encodeURIComponent(query)}`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data.response || data.response.status !== '200' || !data.artists) {
        return { results: [], total: 0, provider: 'vagalume' };
      }

      // Processar resultados - pode vir como objeto único ou array
      const artists = Array.isArray(data.artists) ? data.artists : [data.artists];
      const results: SongFromProvider[] = [];

      for (const artist of artists) {
        if (artist.hits && artist.hits.length > 0) {
          // Formato de busca por artista com hits
          for (const hit of artist.hits) {
            results.push({
              id: hit.id || hit.url,
              titulo: hit.titulo || hit.name,
              artista: artist.name || artist.artist_name,
              tom: null, // Vagalume não fornece tom
              url: hit.url || `https://www.vagalume.com.br${artist.url}/${hit.url}`.replace(/\/$/, ''),
            });
          }
        }
      }

      // Se não tem hits, pode ser busca direta por música específica
      if (results.length === 0 && data.musicas) {
        const musicas = Array.isArray(data.musicas) ? data.musicas : [data.musicas];
        for (const mus of musicas) {
          results.push({
            id: mus.id || mus.url,
            titulo: mus.name || mus.titulo,
            artista: data.artists?.[0]?.name || query,
            tom: null,
            url: `https://www.vagalume.com.br${data.artists?.[0]?.url}/${mus.url}`.replace(/\/$/, ''),
          });
        }
      }

      return {
        results,
        total: results.length,
        provider: 'vagalume',
      };
    } catch (error) {
      console.error('[Vagalume] Search error:', error);
      return {
        results: [],
        total: 0,
        provider: 'vagalume',
      };
    }
  },

  async getChords(songUrl: string): Promise<SongWithChords> {
    try {
      // O endpoint de letra precisa de artist e music name
      // URL exemplo: https://www.vagalume.com.br/coldplay/the-scientist.html
      
      // Extrair artista e música da URL
      const urlMatch = songUrl
        .replace('https://www.vagalume.com.br/', '')
        .replace('http://www.vagalume.com.br/', '')
        .replace('.html', '')
        .split('/');

      if (urlMatch.length < 2) {
        throw new Error('URL inválida do Vagalume');
      }

      const artist = urlMatch[0];
      const music = urlMatch[1].replace(/-/g, ' ');

      // Buscar a letra
      const searchUrl = `${VAGALUME_API_URL}/search.php?${VAGALUME_API_KEY ? `apikey=${VAGALUME_API_KEY}&` : ''}art=${encodeURIComponent(artist)}&mus=${encodeURIComponent(music)}`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // A letra vem em data.mus[0].text
      if (data.response?.status !== '200' || !data.mus || !data.mus[0]) {
        throw new Error('Música não encontrada');
      }

      const musica = data.mus[0];

      return {
        id: songUrl,
        titulo: musica.name || music,
        artista: data.artists?.[0]?.name || artist,
        tom: null, // Vagalume não fornece tom
        url: songUrl,
        cifra: musica.text || null, // Letra da música (sem acordes)
        youtubeUrl: musica.youtube ? `https://www.youtube.com/watch?v=${musica.youtube}` : null,
      };
    } catch (error) {
      console.error('[Vagalume] Get chords error:', error);
      throw error;
    }
  },
};

// =====================================
// HELPER: Buscar letra diretamente
// =====================================

export async function fetchLyricsFromVagalume(artist: string, song: string): Promise<SongWithChords> {
  const url = `https://www.vagalume.com.br/${artist}/${song}.html`;
  return vagalumeProvider.getChords(url);
}

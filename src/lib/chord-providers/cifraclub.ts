// =====================================
// PROVIDER: CIFRA CLUB
// Integra com a API fan-made: github.com/code4music/cifraclub-api
// =====================================
//
// ATENÇÃO: Esta API usa Selenium/WebDriver para fazer scraping do Cifra Club.
// Para rodar localmente:
//   1. Instale Docker e Docker Compose
//   2. git clone https://github.com/code4music/cifraclub-api
//   3. cd cifraclub-api && docker-compose up
//   4. A API estará disponível em http://localhost:3000
//
// Alternativamente, configure a URL da APIremota abaixo.
// =====================================

import { ChordProvider, SearchResult, SongFromProvider, SongWithChords } from './types';

// URL da API Cifra Club (pode ser remota ou local)
const CIFRACLUB_API_URL = process.env.CIFRACLUB_API_URL || 'http://localhost:3000';

export const cifraClubProvider: ChordProvider = {
  name: 'cifraclub',
  description: 'Cifra Club - Base de dados de cifras com acordes',
  capabilities: {
    supportsSearch: true,
    hasChords: true,
    lyricsOnly: false,
  },

  async search(query: string): Promise<SearchResult<SongFromProvider>> {
    try {
      // API de busca pública do Cifra Club
      const searchUrl = `https://solr.sscdn.co/cc/c7/?q=${encodeURIComponent(query)}&limit=20&callback=suggest_callback`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const text = await response.text();
      
      // A resposta é JSON puro (não JSONP)
      const data = JSON.parse(text);
      const docs = data.response?.docs || [];

      const results: SongFromProvider[] = docs.map((item: any) => ({
        id: `https://www.cifraclub.com.br/${item.dns}/${item.url}`,
        titulo: item.txt,
        artista: item.art,
        tom: null,
        url: `https://www.cifraclub.com.br/${item.dns}/${item.url}`,
      }));

      return {
        results,
        total: results.length,
        provider: 'cifraclub',
      };
    } catch (error) {
      console.error('[CifraClub] Search error:', error);
      return {
        results: [],
        total: 0,
        provider: 'cifraclub',
      };
    }
  },

  async getChords(songUrl: string): Promise<SongWithChords> {
    try {
      // URL exemplo: https://www.cifraclub.com.br/frank-sinatra/my-way
      // Precisamos extrair artist e song da URL
      
      const urlParts = songUrl
        .replace('https://www.cifraclub.com.br/', '')
        .replace('http://localhost:3000/', '')
        .split('/');
      
      if (urlParts.length < 2) {
        throw new Error('URL inválida do Cifra Club');
      }

      const artist = urlParts[0];
      const song = urlParts[1].replace(/\/$/, '');

      // Timeout de 60 segundos para a API do Cifra Club (Selenium é lento)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(
        `${CIFRACLUB_API_URL}/artists/${artist}/songs/${song}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        id: songUrl,
        titulo: data.name || data.musica || '',
        artista: data.artist || data.artista || '',
        tom: data.key || data.tom || null,
        url: songUrl,
        cifra: Array.isArray(data.cifra) ? data.cifra.join('\n') : data.cifra,
        youtubeUrl: data.youtube_url || null,
      };
    } catch (error) {
      console.error('[CifraClub] Get chords error:', error);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout: O Cifra Club está demorando muito (60s). Tente novamente.');
      }
      throw error;
    }
  },
};

// =====================================
// HELPER: Buscar e importar cifra diretamente
// =====================================

export async function fetchChordFromCifraClub(artist: string, song: string): Promise<SongWithChords> {
  const url = `https://www.cifraclub.com.br/${artist}/${song}`;
  return cifraClubProvider.getChords(url);
}

import { SearchResult, SearchDoc } from './types';

const SEARCH_URL = 'https://solr.sscdn.co/cc/c7/';

interface SolrDoc {
  art: string;
  dns: string;
  txt: string;
  /** Só docs de música têm slug — cards de vídeo/artista não têm página de cifra */
  url?: string;
  imgm: string;
  id_artist: number;
  id_song: number;
  tipo?: string;
}

interface SolrResponse {
  response: {
    numFound: number;
    docs: SolrDoc[];
  };
}

export async function search(query: string, limit = 30): Promise<SearchResult> {
  const normalized = normalizeSearchQuery(query)

  const params = new URLSearchParams({ q: normalized, limit: String(limit), callback: 'suggest_callback' });
  let data: SolrResponse = await fetchSolr(params);

  // Fallback: busca com comentários entre parênteses removidos
  // (ex.: "País Tropical (emendar com Taj Mahal)" -> "País Tropical")
  if (data.response.numFound === 0) {
    const stripped = normalized
      .replace(/\(.*?\)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    if (stripped && stripped !== normalized) {
      const retry = new URLSearchParams({ q: stripped, limit: String(limit), callback: 'suggest_callback' })
      data = await fetchSolr(retry)
    }
  }

  const songs: SearchDoc[] = data.response.docs
    // Só docs com slug de música viram resultado — vídeos/artistas
    // (sem 'url') quebrariam o scrape com 404
    .filter((doc) => doc.url)
    .map((doc) => ({
      artist: doc.art,
      artist_slug: doc.dns,
      song: doc.txt,
      song_slug: doc.url as string,
      image: doc.imgm,
      id_artist: doc.id_artist,
      id_song: doc.id_song,
    }));

  return { total: data.response.numFound, songs };
}

/**
 * Normaliza a query de busca: travessões/en-dashes (copiados de Word/docs/
 * WhatsApp) viram espaços — o Solr do Cifra Club devolve 0 resultados
 * com eles. Espaços múltiplos são colapsados.
 */
export function normalizeSearchQuery(query: string): string {
  return query
    .replace(/[\u2010-\u2015\u2212]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function fetchSolr(params: URLSearchParams): Promise<SolrResponse> {
  const res = await fetch(`${SEARCH_URL}?${params}`);

  if (!res.ok) {
    throw new Error(`Search request failed: ${res.status}`);
  }

  const text = await res.text();
  const json = text.replace(/^suggest_callback\(/, '').replace(/\);?$/, '');
  return JSON.parse(json);
}

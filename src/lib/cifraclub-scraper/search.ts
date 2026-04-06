import { SearchResult, SearchDoc } from './types';

const SEARCH_URL = 'https://solr.sscdn.co/cc/c7/';

interface SolrDoc {
  art: string;
  dns: string;
  txt: string;
  url: string;
  imgm: string;
  id_artist: number;
  id_song: number;
}

interface SolrResponse {
  response: {
    numFound: number;
    docs: SolrDoc[];
  };
}

export async function search(query: string, limit = 30): Promise<SearchResult> {
  const params = new URLSearchParams({ q: query, limit: String(limit), callback: 'suggest_callback' });
  const res = await fetch(`${SEARCH_URL}?${params}`);

  if (!res.ok) {
    throw new Error(`Search request failed: ${res.status}`);
  }

  const text = await res.text();
  const json = text.replace(/^suggest_callback\(/, '').replace(/\);?$/, '');
  const data: SolrResponse = JSON.parse(json);

  const songs: SearchDoc[] = data.response.docs.map((doc) => ({
    artist: doc.art,
    artist_slug: doc.dns,
    song: doc.txt,
    song_slug: doc.url,
    image: doc.imgm,
    id_artist: doc.id_artist,
    id_song: doc.id_song,
  }));

  return { total: data.response.numFound, songs };
}

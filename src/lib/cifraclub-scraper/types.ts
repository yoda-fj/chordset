export interface CifraResult {
  cifraclub_url: string;
  name: string;
  artist: string;
  youtube_url: string;
  key?: string;  // Tom da música (ex: "C", "Dm", "G")
  cifra: string[];
}

export interface CifraError {
  cifraclub_url: string;
  error: string;
}

export type CifraResponse = CifraResult | CifraError;

export interface SearchDoc {
  artist: string;
  artist_slug: string;
  song: string;
  song_slug: string;
  image: string;
  id_artist: number;
  id_song: number;
}

export interface SearchResult {
  total: number;
  songs: SearchDoc[];
}

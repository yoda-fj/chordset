// =====================================
// TIPOS COMPARTILHADOS PARA PROVIDERS DE CIFRAS
// =====================================

export interface SongFromProvider {
  /** ID único no provider */
  id: string;
  /** Nome da música */
  titulo: string;
  /** Nome do artista */
  artista: string;
  /** Tom original (ex: "C", "Dm", "G") */
  tom?: string | null;
  /** URL da música no provider */
  url: string;
  /** URL da imagem/cover da música (opcional) */
  image?: string | null;
}

export interface SongWithChords extends SongFromProvider {
  /** Texto da cifra com acordes (ex: "[Intro] C  G  Am  F") */
  cifra?: string | null;
  /** URL para embed do YouTube (se disponível) */
  youtubeUrl?: string | null;
}

export interface SearchResult<T> {
  /** Lista de resultados */
  results: T[];
  /** Total de resultados encontrados */
  total: number;
  /** Provider que retornou os resultados */
  provider: string;
}

export interface ProviderCapabilities {
  /** Se o provider suporta busca por termo */
  supportsSearch: boolean;
  /** Se o provider retorna cifras com acordes */
  hasChords: boolean;
  /** Se o provider retorna letras apenas */
  lyricsOnly: boolean;
}

// =====================================
// INTERFACE UNIFICADA DE PROVIDER
// =====================================

export interface ChordProvider {
  /** Nome identificador do provider */
  name: string;
  /** Descrição do provider */
  description: string;
  /** Capacidades do provider */
  capabilities: ProviderCapabilities;
  
  /**
   * Busca músicas por termo (artista, título, etc)
   * @param query Termo de busca
   * @returns Lista de músicas encontradas
   */
  search(query: string): Promise<SearchResult<SongFromProvider>>;
  
  /**
   * Obtém a cifra completa de uma música
   * @param songUrl URL da música no provider
   * @returns Dados da música com cifra
   */
  getChords(songUrl: string): Promise<SongWithChords>;
}

// =====================================
// RESULTADO UNIFICADO (PARA UI)
// =====================================

export interface ImportSongResult {
  success: boolean;
  song?: {
    titulo: string;
    artista: string;
    tom_original: string | null;
    cifra: string | null;
    url: string;
    provider: string;
  };
  error?: string;
  provider: string;
}

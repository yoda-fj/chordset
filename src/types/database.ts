// =====================================
// CHORDSET - TIPOS DE DOMÍNIO
// Fonte única de verdade para os shapes das tabelas.
// Os módulos src/lib/*-db.ts importam daqui.
// =====================================

// =====================================
// ENUMS
// =====================================
export type EventoStatus = 'rascunho' | 'confirmado' | 'realizado' | 'cancelado';

// =====================================
// TABELA: musicas
// =====================================
export interface Musica {
  id: number;
  titulo: string;
  artista: string;
  tom_original: string | null;
  cifra: string | null;
  tags: string[];
  observacao: string | null;
  audio_url: string | null;
  groove: string | null;
  drum_pattern_id: number | null;
  bpm: number;
  volume: number;
  created_at: string;
  updated_at: string;
}

export interface CreateMusicaInput {
  titulo: string;
  artista: string;
  tom_original?: string;
  cifra?: string;
  tags?: string[];
}

export interface UpdateMusicaInput {
  titulo?: string;
  artista?: string;
  tom_original?: string | null;
  cifra?: string | null;
  tags?: string[];
  observacao?: string | null;
  audio_url?: string | null;
  groove?: string | null;
  drum_pattern_id?: number | null;
  bpm?: number;
  volume?: number;
}

// Subconjunto de Musica retornado pelos JOINs de setlist/practice
export type MusicaJoin = Pick<Musica, 'id' | 'titulo' | 'artista' | 'tom_original' | 'cifra' | 'groove' | 'drum_pattern_id' | 'bpm' | 'volume'>;

// =====================================
// TABELA: templates
// =====================================
export interface Template {
  id: number;
  nome: string;
  descricao: string | null;
  tags: string[];
  created_at: string;
}

export interface CreateTemplateInput {
  nome: string;
  descricao?: string;
  tags?: string[];
}

export interface UpdateTemplateInput {
  nome?: string;
  descricao?: string | null;
  tags?: string[];
}

// =====================================
// TABELA: template_musicas
// =====================================
export interface TemplateMusica {
  id: number;
  template_id: number;
  musica_id: number;
  ordem: number;
  tom_sugerido: string | null;
  observacoes: string | null;
  created_at: string;
}

// Com relacionamento de música (para queries com join)
export interface TemplateMusicaWithMusica extends TemplateMusica {
  musicas: Pick<Musica, 'id' | 'titulo' | 'artista' | 'tom_original'>;
}

export interface CreateTemplateMusicaInput {
  template_id: number;
  musica_id: number;
  ordem: number;
  tom_sugerido?: string;
  observacoes?: string;
}

export interface UpdateTemplateMusicaInput {
  ordem?: number;
  tom_sugerido?: string;
  observacoes?: string;
}

// =====================================
// TABELA: eventos
// =====================================
export interface Evento {
  id: number;
  nome: string;
  data: string | null; // ISO date (YYYY-MM-DD); null = lista de estudo
  hora: string | null; // ISO time (HH:MM:SS)
  local: string | null;
  status: EventoStatus;
  template_id: number | null;
  tags: string[];
  observacoes: string | null;
  audio_url: string | null;
  created_at: string;
  updated_at: string;
}

// Evento com template (para queries com join)
export interface EventoWithTemplate extends Evento {
  templates?: Template | null;
}

export interface CreateEventoInput {
  nome: string;
  data?: string | null;
  hora?: string;
  local?: string;
  status?: EventoStatus;
  template_id?: number;
  tags?: string[];
  observacoes?: string;
  audio_url?: string | null;
}

export interface UpdateEventoInput {
  nome?: string;
  data?: string | null;
  hora?: string;
  local?: string;
  status?: EventoStatus;
  template_id?: number;
  tags?: string[];
  observacoes?: string;
  audio_url?: string | null;
}

// =====================================
// TABELA: evento_musicas
// =====================================
export interface EventoMusica {
  id: number;
  evento_id: number;
  musica_id: number;
  ordem: number;
  tom_evento: string | null;
  observacoes: string | null;
  confirmada: boolean;
  responsavel: string | null;
  created_at: string;
  updated_at: string;
}

// Com relacionamento de música (para queries com join)
export interface EventoMusicaWithMusica extends EventoMusica {
  musicas: MusicaJoin;
}

export interface CreateEventoMusicaInput {
  evento_id: number;
  musica_id: number;
  ordem: number;
  tom_evento?: string;
  observacoes?: string;
  confirmada?: boolean;
  responsavel?: string;
}

export interface UpdateEventoMusicaInput {
  ordem?: number;
  tom_evento?: string;
  observacoes?: string;
  confirmada?: boolean;
  responsavel?: string;
}

// =====================================
// TABELA: drum_patterns
// =====================================
export interface DrumPattern {
  id: number;
  nome: string;
  bpm: number;
  kit: string;
  steps: string; // JSON serializado: [[kick],[snare],...] por step
  created_at: string;
  updated_at: string;
}

export interface CreateDrumPatternInput {
  nome: string;
  bpm?: number;
  kit?: string;
  steps: unknown; // serializado via JSON.stringify no insert
}

export interface UpdateDrumPatternInput {
  nome?: string;
  bpm?: number;
  kit?: string;
  steps?: unknown;
}

// =====================================
// TIPOS AUXILIARES/DTOs
// =====================================

// Para criar evento a partir de template
export interface CriarEventoDoTemplateDTO {
  nome: string;
  data: string;
  hora?: string;
  local?: string;
  template_id: number;
  tags?: string[];
}

// Para reordenar músicas em template/evento
export interface ReordenarMusicaDTO {
  id: number;
  ordem: number;
}

// Status do evento com labels
export const EVENTO_STATUS_LABELS: Record<EventoStatus, string> = {
  rascunho: 'Rascunho',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado',
};

// Cores para status (útil para UI)
export const EVENTO_STATUS_COLORS: Record<EventoStatus, string> = {
  rascunho: 'gray',
  confirmado: 'blue',
  realizado: 'green',
  cancelado: 'red',
};

// Cores de badge para Tailwind (tokens semânticos — Fase 1.1)
export const EVENTO_STATUS_BADGE_CLASSES: Record<EventoStatus, string> = {
  rascunho: 'bg-surface-overlay text-ink border-ink/20',
  confirmado: 'bg-brand/15 text-brand border-brand/30',
  realizado: 'bg-success/15 text-success border-success/40',
  cancelado: 'bg-danger/15 text-danger border-danger/40',
};

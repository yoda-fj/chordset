// =====================================
// SETLIST TOOLS - TIPOS TYPESCRIPT
// Sistema de Templates e Eventos
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
  created_at: string;
  updated_at: string;
}

export type MusicaInsert = Omit<Musica, 'id' | 'created_at' | 'updated_at'>;
export type MusicaUpdate = Partial<Omit<Musica, 'id' | 'created_at' | 'updated_at'>>;

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

export type TemplateInsert = Omit<Template, 'id' | 'created_at'>;
export type TemplateUpdate = Partial<Omit<Template, 'id' | 'created_at'>>;

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

export type TemplateMusicaInsert = Omit<TemplateMusica, 'id' | 'created_at'>;
export type TemplateMusicaUpdate = Partial<Omit<TemplateMusica, 'id' | 'template_id' | 'created_at'>>;

// Com relacionamento de música completo (para queries com join)
export interface TemplateMusicaWithMusica extends TemplateMusica {
  musicas: {
    id: number;
    titulo: string;
    artista: string;
    tom_original: string | null;
  };
}

// =====================================
// TABELA: eventos
// =====================================
export interface Evento {
  id: number;
  nome: string;
  data: string; // ISO date string (YYYY-MM-DD)
  hora: string | null; // ISO time string (HH:MM:SS)
  local: string | null;
  status: EventoStatus;
  template_id: number | null;
  tags: string[];
  observacoes: string | null;
  audio_url: string | null;
  created_at: string;
  updated_at: string;
}

export type EventoInsert = Omit<Evento, 'id' | 'created_at' | 'updated_at'>;
export type EventoUpdate = Partial<Omit<Evento, 'id' | 'created_at' | 'updated_at'>>;

// Evento com template (para queries com join)
export interface EventoWithTemplate extends Omit<Evento, 'audio_url'> {
  audio_url: string | null;
  templates?: {
    id: number;
    nome: string;
    descricao: string | null;
    tags: string[];
    created_at: string;
  } | null;
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

export type EventoMusicaInsert = Omit<EventoMusica, 'id' | 'created_at' | 'updated_at'>;
export type EventoMusicaUpdate = Partial<Omit<EventoMusica, 'id' | 'evento_id' | 'created_at' | 'updated_at'>>;

// Com relacionamento de música completo (para queries com join)
export interface EventoMusicaWithMusica extends EventoMusica {
  musicas: {
    id: number;
    titulo: string;
    artista: string;
    tom_original: string | null;
    cifra: string | null;
  };
}

// =====================================
// TIPOS DE AUXILIARES/DTOs
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

// Cores de badge para Tailwind
export const EVENTO_STATUS_BADGE_CLASSES: Record<EventoStatus, string> = {
  rascunho: 'bg-gray-100 text-gray-800 border-gray-200',
  confirmado: 'bg-blue-100 text-blue-800 border-blue-200',
  realizado: 'bg-green-100 text-green-800 border-green-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
};

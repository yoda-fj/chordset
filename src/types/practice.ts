// Practice session types
import type { MusicaJoin } from './database';

export type PracticeStatus = 'needs_practice' | 'practiced' | 'mastered';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface PracticeSession {
  id: number;
  musica_id: number;
  status: PracticeStatus;
  difficulty: DifficultyLevel;
  total_practice_time_seconds: number;
  last_practiced_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PracticeSessionWithMusica extends PracticeSession {
  musicas: MusicaJoin;
}

export type PracticeSessionInsert = Omit<PracticeSession, 'id' | 'created_at' | 'updated_at'>;
export type PracticeSessionUpdate = Partial<Omit<PracticeSession, 'id' | 'created_at' | 'updated_at'>>;

// Status labels
export const PRACTICE_STATUS_LABELS: Record<PracticeStatus, string> = {
  needs_practice: 'Precisa Praticar',
  practiced: 'Praticada',
  mastered: 'Dominada',
};

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil',
};

// Badge classes for Tailwind (tokens semânticos — Fase 1.1)
export const PRACTICE_STATUS_BADGE_CLASSES: Record<PracticeStatus, string> = {
  needs_practice: 'bg-brand/15 text-brand border-brand/30',
  practiced: 'bg-section/15 text-section border-section/30',
  mastered: 'bg-success/15 text-success border-success/40',
};

export const DIFFICULTY_BADGE_CLASSES: Record<DifficultyLevel, string> = {
  easy: 'bg-success/15 text-success border-success/40',
  medium: 'bg-brand/15 text-brand border-brand/30',
  hard: 'bg-danger/15 text-danger border-danger/40',
};

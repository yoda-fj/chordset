// Practice session types
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
  musicas: {
    id: number;
    titulo: string;
    artista: string;
    tom_original: string | null;
    cifra: string | null;
  };
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

// Badge classes for Tailwind
export const PRACTICE_STATUS_BADGE_CLASSES: Record<PracticeStatus, string> = {
  needs_practice: 'bg-amber-100 text-amber-800 border-amber-200',
  practiced: 'bg-blue-100 text-blue-800 border-blue-200',
  mastered: 'bg-emerald-100 text-emerald-800 border-emerald-200',
};

export const DIFFICULTY_BADGE_CLASSES: Record<DifficultyLevel, string> = {
  easy: 'bg-green-100 text-green-800 border-green-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  hard: 'bg-red-100 text-red-800 border-red-200',
};

// Mock data for practice sessions
import { PracticeSession, PracticeSessionWithMusica } from '@/types/practice';
import { mockMusicas } from './mockData';

export const mockPracticeSessions: PracticeSession[] = [
  {
    id: 1,
    musica_id: 1,
    status: 'mastered',
    difficulty: 'easy',
    total_practice_time_seconds: 3600,
    last_practiced_at: '2024-01-15T10:30:00',
    notes: 'Já está bem firme. Subir meio tom para dar mais brilho.',
    created_at: '2024-01-01',
    updated_at: '2024-01-15T10:30:00',
  },
  {
    id: 2,
    musica_id: 2,
    status: 'practiced',
    difficulty: 'medium',
    total_practice_time_seconds: 1800,
    last_practiced_at: '2024-01-14T15:00:00',
    notes: 'Trabalhar a transição entre versos.',
    created_at: '2024-01-01',
    updated_at: '2024-01-14T15:00:00',
  },
  {
    id: 3,
    musica_id: 3,
    status: 'needs_practice',
    difficulty: 'medium',
    total_practice_time_seconds: 600,
    last_practiced_at: '2024-01-10T09:00:00',
    notes: 'Precisa de mais atenção na intro.',
    created_at: '2024-01-01',
    updated_at: '2024-01-10T09:00:00',
  },
  {
    id: 4,
    musica_id: 4,
    status: 'needs_practice',
    difficulty: 'hard',
    total_practice_time_seconds: 0,
    last_practiced_at: null,
    notes: null,
    created_at: '2024-01-05',
    updated_at: '2024-01-05',
  },
  {
    id: 5,
    musica_id: 5,
    status: 'practiced',
    difficulty: 'easy',
    total_practice_time_seconds: 2400,
    last_practiced_at: '2024-01-13T11:00:00',
    notes: 'Bom progresso, revisar refrão.',
    created_at: '2024-01-02',
    updated_at: '2024-01-13T11:00:00',
  },
];

export const mockPracticeSessionsWithMusica: PracticeSessionWithMusica[] = [
  {
    ...mockPracticeSessions[0],
    musicas: mockMusicas[0],
  },
  {
    ...mockPracticeSessions[1],
    musicas: mockMusicas[1],
  },
  {
    ...mockPracticeSessions[2],
    musicas: mockMusicas[2],
  },
  {
    ...mockPracticeSessions[3],
    musicas: mockMusicas[3],
  },
  {
    ...mockPracticeSessions[4],
    musicas: mockMusicas[4],
  },
];

// Helper functions
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

export function getPracticeStats(sessions: PracticeSessionWithMusica[]) {
  const totalTime = sessions.reduce((acc, s) => acc + s.total_practice_time_seconds, 0);
  const masteredCount = sessions.filter(s => s.status === 'mastered').length;
  const practicedCount = sessions.filter(s => s.status === 'practiced').length;
  const needsPracticeCount = sessions.filter(s => s.status === 'needs_practice').length;
  
  // Most practiced songs
  const mostPracticed = [...sessions]
    .sort((a, b) => b.total_practice_time_seconds - a.total_practice_time_seconds)
    .slice(0, 5);
  
  return {
    totalTime,
    masteredCount,
    practicedCount,
    needsPracticeCount,
    totalSongs: sessions.length,
    mostPracticed,
  };
}

import { PracticeSessionWithMusica } from '@/types/practice'

export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function getPracticeStats(sessions: PracticeSessionWithMusica[]) {
  const totalTime = sessions.reduce((acc, s) => acc + s.total_practice_time_seconds, 0)
  const masteredCount = sessions.filter(s => s.status === 'mastered').length
  const practicedCount = sessions.filter(s => s.status === 'practiced').length
  const needsPracticeCount = sessions.filter(s => s.status === 'needs_practice').length
  
  // Most practiced songs
  const mostPracticed = [...sessions]
    .sort((a, b) => b.total_practice_time_seconds - a.total_practice_time_seconds)
    .slice(0, 5)
  
  return {
    totalTime,
    masteredCount,
    practicedCount,
    needsPracticeCount,
    totalSongs: sessions.length,
    mostPracticed,
  }
}

'use client';

import { PracticeSessionWithMusica } from '@/types/practice';
import { getPracticeStats, formatDuration } from '@/lib/practice-utils';
import { Clock, Target, Trophy, Music } from 'lucide-react';
import { PRACTICE_STATUS_LABELS, PRACTICE_STATUS_BADGE_CLASSES } from '@/types/practice';

interface PracticeStatsProps {
  sessions: PracticeSessionWithMusica[];
}

export function PracticeStats({ sessions }: PracticeStatsProps) {
  const stats = getPracticeStats(sessions);

  return (
    <div className="practice-stats space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card bg-surface-raised rounded-xl p-4 border border-ink/10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/15 rounded-lg">
              <Music className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="text-2xl font-bold text-ink">{stats.totalSongs}</div>
              <div className="text-xs text-ink-muted">Músicas</div>
            </div>
          </div>
        </div>

        <div className="stat-card bg-surface-raised rounded-xl p-4 border border-ink/10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-success/15 rounded-lg">
              <Clock className="w-5 h-5 text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-ink">{formatDuration(stats.totalTime)}</div>
              <div className="text-xs text-ink-muted">Tempo Total</div>
            </div>
          </div>
        </div>

        <div className="stat-card bg-surface-raised rounded-xl p-4 border border-ink/10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand/15 rounded-lg">
              <Target className="w-5 h-5 text-brand" />
            </div>
            <div>
              <div className="text-2xl font-bold text-ink">{stats.needsPracticeCount}</div>
              <div className="text-xs text-ink-muted">Precisam Prática</div>
            </div>
          </div>
        </div>

        <div className="stat-card bg-surface-raised rounded-xl p-4 border border-ink/10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-section/15 rounded-lg">
              <Trophy className="w-5 h-5 text-section" />
            </div>
            <div>
              <div className="text-2xl font-bold text-ink">{stats.masteredCount}</div>
              <div className="text-xs text-ink-muted">Dominadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Most Practiced Songs */}
      {stats.mostPracticed.length > 0 && (
        <div className="most-practiced bg-surface-raised rounded-xl p-4 border border-ink/10 shadow-sm">
          <h3 className="text-lg font-semibold text-ink mb-4">Mais Praticadas</h3>
          <div className="space-y-3">
            {stats.mostPracticed.slice(0, 3).map((session, index) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-brand/15 text-brand' :
                    index === 1 ? 'bg-surface-overlay text-ink' :
                    index === 2 ? 'bg-brand/10 text-brand' :
                    'bg-surface-overlay text-ink-muted'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-ink">{session.musicas.titulo}</div>
                    <div className="text-sm text-ink-muted">{session.musicas.artista}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-ink">{formatDuration(session.total_practice_time_seconds)}</div>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${PRACTICE_STATUS_BADGE_CLASSES[session.status]}`}>
                    {PRACTICE_STATUS_LABELS[session.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
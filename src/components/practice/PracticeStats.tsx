'use client';

import { PracticeSessionWithMusica } from '@/types/practice';
import { getPracticeStats, formatDuration } from '@/lib/practice-utils';
import { Clock, Target, Trophy, Music } from 'lucide-react';
import { PRACTICE_STATUS_LABELS, DIFFICULTY_LABELS, PRACTICE_STATUS_BADGE_CLASSES, DIFFICULTY_BADGE_CLASSES } from '@/types/practice';

interface PracticeStatsProps {
  sessions: PracticeSessionWithMusica[];
}

export function PracticeStats({ sessions }: PracticeStatsProps) {
  const stats = getPracticeStats(sessions);

  return (
    <div className="practice-stats space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Music className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.totalSongs}</div>
              <div className="text-xs text-slate-500">Músicas</div>
            </div>
          </div>
        </div>

        <div className="stat-card bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Clock className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{formatDuration(stats.totalTime)}</div>
              <div className="text-xs text-slate-500">Tempo Total</div>
            </div>
          </div>
        </div>

        <div className="stat-card bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Target className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.needsPracticeCount}</div>
              <div className="text-xs text-slate-500">Precisam Prática</div>
            </div>
          </div>
        </div>

        <div className="stat-card bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Trophy className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{stats.masteredCount}</div>
              <div className="text-xs text-slate-500">Dominadas</div>
            </div>
          </div>
        </div>
      </div>

      {/* Most Practiced Songs */}
      {stats.mostPracticed.length > 0 && (
        <div className="most-practiced bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Mais Praticadas</h3>
          <div className="space-y-3">
            {stats.mostPracticed.slice(0, 3).map((session, index) => (
              <div key={session.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-slate-200 text-slate-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{session.musicas.titulo}</div>
                    <div className="text-sm text-slate-500">{session.musicas.artista}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium text-slate-900">{formatDuration(session.total_practice_time_seconds)}</div>
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
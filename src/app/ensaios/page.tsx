'use client';

import { useState } from 'react';
import { PracticeCard } from '@/components/practice/PracticeCard';
import { PracticeStats } from '@/components/practice/PracticeStats';
import { mockPracticeSessionsWithMusica } from '@/lib/mockPracticeData';
import { PracticeStatus, PRACTICE_STATUS_LABELS } from '@/types/practice';
import { Music, Filter } from 'lucide-react';

export default function EnsaiosPage() {
  const [filter, setFilter] = useState<PracticeStatus | 'all'>('all');
  
  const sessions = mockPracticeSessionsWithMusica;
  
  const filteredSessions = filter === 'all' 
    ? sessions 
    : sessions.filter(s => s.status === filter);
  
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    // Sort by: needs_practice first, then by last practiced date
    if (a.status === 'needs_practice' && b.status !== 'needs_practice') return -1;
    if (a.status !== 'needs_practice' && b.status === 'needs_practice') return 1;
    
    const dateA = a.last_practiced_at ? new Date(a.last_practiced_at) : new Date(0);
    const dateB = b.last_practiced_at ? new Date(b.last_practiced_at) : new Date(0);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="ensaios-page space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Music className="w-6 h-6 text-indigo-600" />
            Ensaios
          </h1>
          <p className="text-slate-600 mt-1">
            Gerencie suas sessões de prática e acompanhe seu progresso
          </p>
        </div>
      </div>

      {/* Stats */}
      <PracticeStats sessions={sessions} />

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        <span className="text-sm text-slate-600">Filtrar:</span>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('needs_practice')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'needs_practice'
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {PRACTICE_STATUS_LABELS.needs_practice}
        </button>
        <button
          onClick={() => setFilter('practiced')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'practiced'
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {PRACTICE_STATUS_LABELS.practiced}
        </button>
        <button
          onClick={() => setFilter('mastered')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'mastered'
              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {PRACTICE_STATUS_LABELS.mastered}
        </button>
      </div>

      {/* Sessions List */}
      <div className="space-y-3">
        {sortedSessions.length > 0 ? (
          sortedSessions.map(session => (
            <PracticeCard key={session.id} session={session} />
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Music className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">Nenhuma música encontrada com este filtro.</p>
          </div>
        )}
      </div>
    </div>
  );
}

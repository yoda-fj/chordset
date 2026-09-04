'use client';

import { useState, useEffect } from 'react';
import { PracticeCard } from '@/components/practice/PracticeCard';
import { PracticeStats } from '@/components/practice/PracticeStats';
import { PracticeStatus, PRACTICE_STATUS_LABELS, PracticeSessionWithMusica } from '@/types/practice';
import { Music, Filter, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';

export default function EnsaiosPage() {
  const [filter, setFilter] = useState<PracticeStatus | 'all'>('all');
  const [sessions, setSessions] = useState<PracticeSessionWithMusica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchSessions() {
      try {
        setLoading(true);
        const response = await fetch('/api/practice-sessions');
        if (!response.ok) throw new Error('Erro ao carregar sessões');
        const data = await response.json();
        setSessions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error}</p>
      </div>
    );
  }

  return (
    <div className="ensaios-page space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <Music className="w-6 h-6 text-brand" />
            Ensaios
          </h1>
          <p className="text-ink-muted mt-1">
            Gerencie suas sessões de prática e acompanhe seu progresso
          </p>
        </div>
        <Link
          href="/ensaios/new"
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 transition-colors"
        >
          <Plus size={18} />
          Novo Ensaio
        </Link>
      </div>

      {/* Stats */}
      <PracticeStats sessions={sessions} />

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-ink-muted" />
        <span className="text-sm text-ink-muted">Filtrar:</span>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-brand/15 text-brand-600 border border-brand/30'
              : 'bg-surface-raised text-ink-muted border border-ink/10 hover:bg-surface'
          }`}
        >
          Todas
        </button>
        <button
          onClick={() => setFilter('needs_practice')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'needs_practice'
              ? 'bg-brand/15 text-brand border border-brand/30'
              : 'bg-surface-raised text-ink-muted border border-ink/10 hover:bg-surface'
          }`}
        >
          {PRACTICE_STATUS_LABELS.needs_practice}
        </button>
        <button
          onClick={() => setFilter('practiced')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'practiced'
              ? 'bg-brand/15 text-brand-600 border border-brand/30'
              : 'bg-surface-raised text-ink-muted border border-ink/10 hover:bg-surface'
          }`}
        >
          {PRACTICE_STATUS_LABELS.practiced}
        </button>
        <button
          onClick={() => setFilter('mastered')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            filter === 'mastered'
              ? 'bg-success/15 text-success border border-success/40'
              : 'bg-surface-raised text-ink-muted border border-ink/10 hover:bg-surface'
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
          <div className="text-center py-12 bg-surface-raised rounded-xl border border-ink/10">
            <Music className="w-12 h-12 text-ink-muted mx-auto mb-3" />
            <p className="text-ink-muted mb-4">Nenhuma sessão de ensaio ainda.</p>
            <Link
              href="/ensaios/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 transition-colors"
            >
              <Plus size={18} />
              Criar primeiro ensaio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

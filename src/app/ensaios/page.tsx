'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PracticeCard } from '@/components/practice/PracticeCard';
import { PracticeStats } from '@/components/practice/PracticeStats';
import { PracticeStatus, PRACTICE_STATUS_LABELS, PracticeSessionWithMusica } from '@/types/practice';
import { Music, Plus } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState';
import { SegmentedControl } from '@/components/ui/SegmentedControl';

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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => window.location.reload()} />;
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
      <SegmentedControl
        aria-label="Filtrar por status"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'Todas' },
          { value: 'needs_practice', label: PRACTICE_STATUS_LABELS.needs_practice },
          { value: 'practiced', label: PRACTICE_STATUS_LABELS.practiced },
          { value: 'mastered', label: PRACTICE_STATUS_LABELS.mastered },
        ]}
      />

      {/* Sessions List */}
      <div className="space-y-3">
        {sortedSessions.length > 0 ? (
          sortedSessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4), duration: 0.3 }}
              whileTap={{ scale: 0.99 }}
            >
              <PracticeCard session={session} />
            </motion.div>
          ))
        ) : (
          <EmptyState
            icon={<Music />}
            title="Nenhuma sessão de ensaio ainda"
            description="Registre seus ensaios para acompanhar o progresso."
            action={{ label: 'Criar primeiro ensaio', href: '/ensaios/new' }}
          />
        )}
      </div>
    </div>
  );
}

'use client';

import { PracticeSessionWithMusica } from '@/types/practice';
import { formatDuration } from '@/lib/practice-utils';
import { PRACTICE_STATUS_LABELS, DIFFICULTY_LABELS, PRACTICE_STATUS_BADGE_CLASSES, DIFFICULTY_BADGE_CLASSES } from '@/types/practice';
import { Clock, Music, FileText, ChevronRight } from 'lucide-react';
import Link from 'next/link';

interface PracticeCardProps {
  session: PracticeSessionWithMusica;
}

export function PracticeCard({ session }: PracticeCardProps) {
  return (
    <Link href={`/ensaios/${session.id}`}>
      <div className="practice-card bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Music className="w-4 h-4 text-indigo-500" />
              <h3 className="font-semibold text-slate-900">{session.musicas.titulo}</h3>
            </div>
            <p className="text-sm text-slate-500 mb-3">{session.musicas.artista}</p>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${PRACTICE_STATUS_BADGE_CLASSES[session.status]}`}>
                {PRACTICE_STATUS_LABELS[session.status]}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${DIFFICULTY_BADGE_CLASSES[session.difficulty]}`}>
                {DIFFICULTY_LABELS[session.difficulty]}
              </span>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-slate-600">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{formatDuration(session.total_practice_time_seconds)}</span>
              </div>
              {session.notes && (
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  <span className="truncate max-w-[150px]">{session.notes}</span>
                </div>
              )}
            </div>
            
            {session.last_practiced_at && (
              <div className="mt-2 text-xs text-slate-400">
                Último ensaio: {new Date(session.last_practiced_at).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
          
          <div className="ml-4">
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>
      </div>
    </Link>
  );
}

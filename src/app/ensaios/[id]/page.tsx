'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PracticeTimer } from '@/components/practice/PracticeTimer';
import { ChordDisplay } from '@/components/practice/ChordDisplay';
import { Metronome } from '@/components/chords/Metronome';
import { mockPracticeSessionsWithMusica } from '@/lib/mockPracticeData';
import { formatDuration } from '@/lib/mockPracticeData';
import { 
  PracticeStatus, 
  DifficultyLevel, 
  PRACTICE_STATUS_LABELS, 
  DIFFICULTY_LABELS,
  PRACTICE_STATUS_BADGE_CLASSES,
  DIFFICULTY_BADGE_CLASSES
} from '@/types/practice';
import { 
  ArrowLeft, 
  Clock, 
  Music, 
  User, 
  CheckCircle, 
  AlertCircle,
  Save,
  FileText
} from 'lucide-react';

export default function EnsaioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  
  const session = mockPracticeSessionsWithMusica.find(s => s.id === id);
  
  const [status, setStatus] = useState<PracticeStatus>(session?.status || 'needs_practice');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(session?.difficulty || 'medium');
  const [notes, setNotes] = useState(session?.notes || '');
  const [practiceTime, setPracticeTime] = useState(session?.total_practice_time_seconds || 0);
  const [isSaving, setIsSaving] = useState(false);
  
  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Sessão de ensaio não encontrada.</p>
        <button
          onClick={() => router.push('/ensaios')}
          className="mt-4 text-indigo-600 hover:text-indigo-700"
        >
          Voltar para Ensaios
        </button>
      </div>
    );
  }

  const handleSave = () => {
    setIsSaving(true);
    // Simulate save
    setTimeout(() => {
      setIsSaving(false);
    }, 500);
  };

  const handleTimeUpdate = (newTime: number) => {
    setPracticeTime(newTime);
  };

  return (
    <div className="ensaio-detail-page space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/ensaios')}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{session.musicas.titulo}</h1>
            <div className="flex items-center gap-2 text-slate-600">
              <User className="w-4 h-4" />
              <span>{session.musicas.artista}</span>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Chords */}
        <div className="space-y-6">
          <ChordDisplay 
            cifra={session.musicas.cifra} 
            tom={session.musicas.tom_original} 
          />
        </div>

        {/* Right Column - Practice Tools */}
        <div className="space-y-6">
          {/* Timer */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              Cronômetro de Prática
            </h2>
            <PracticeTimer 
              initialTime={practiceTime}
              onTimeUpdate={handleTimeUpdate}
            />
            <div className="mt-2 text-sm text-slate-600">
              Tempo total acumulado: <span className="font-medium">{formatDuration(practiceTime)}</span>
            </div>
          </div>

          {/* Metronome */}
          <div>
            <h2 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Music className="w-5 h-5 text-indigo-600" />
              Metrônomo
            </h2>
            <Metronome defaultBpm={100} />
          </div>

          {/* Status Selection */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Status</h3>
            <div className="flex flex-wrap gap-2">
              {(['needs_practice', 'practiced', 'mastered'] as PracticeStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    status === s
                      ? PRACTICE_STATUS_BADGE_CLASSES[s]
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s === 'mastered' && <CheckCircle className="w-4 h-4" />}
                  {s === 'needs_practice' && <AlertCircle className="w-4 h-4" />}
                  {PRACTICE_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Selection */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Dificuldade</h3>
            <div className="flex flex-wrap gap-2">
              {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    difficulty === d
                      ? DIFFICULTY_BADGE_CLASSES[d]
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Observações
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione suas observações sobre esta música..."
              className="w-full h-32 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

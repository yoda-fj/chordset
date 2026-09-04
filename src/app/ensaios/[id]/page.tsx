'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PracticeTimer } from '@/components/practice/PracticeTimer';
import { CifraViewer } from '@/components/chords/CifraViewer';
import { DrumPad } from '@/components/chords/DrumPad';
import { useDrumPadSettings } from '@/hooks/useDrumPadSettings';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { toast } from 'sonner';
import { formatDuration } from '@/lib/practice-utils';
import { 
  PracticeStatus, 
  DifficultyLevel, 
  PRACTICE_STATUS_LABELS, 
  DIFFICULTY_LABELS,
  PRACTICE_STATUS_BADGE_CLASSES,
  DIFFICULTY_BADGE_CLASSES,
  PracticeSessionWithMusica
} from '@/types/practice';
import { 
  ArrowLeft, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle,
  Save,
  FileText,
  Loader2,
  Trash2
} from 'lucide-react';

export default function EnsaioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  
  const [session, setSession] = useState<PracticeSessionWithMusica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [status, setStatus] = useState<PracticeStatus>('needs_practice');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [notes, setNotes] = useState('');
  const [practiceTime, setPracticeTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drum pad da música da sessão (estado + persistência no hook compartilhado)
  const drumPad = useDrumPadSettings(session?.musicas ?? null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const response = await fetch(`/api/practice-sessions/${id}`);
        if (!response.ok) throw new Error('Sessão não encontrada');
        const data = await response.json();
        setSession(data);
        setStatus(data.status);
        setDifficulty(data.difficulty);
        setNotes(data.notes || '');
        setPracticeTime(data.total_practice_time_seconds);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/practice-sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          difficulty,
          notes: notes || null,
          total_practice_time_seconds: practiceTime,
          last_practiced_at: new Date().toISOString(),
        }),
      });
      
      if (!response.ok) throw new Error('Erro ao salvar');
      
      const updated = await response.json();
      setSession(updated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const handleDelete = () => setConfirmDeleteOpen(true);

  const performDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/practice-sessions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Erro ao excluir');
      router.push('/ensaios');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao excluir');
      setIsDeleting(false);
    }
  };

  const handleTimeUpdate = (newTime: number) => {
    setPracticeTime(newTime);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-brand" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <p className="text-danger mb-4">{error || 'Sessão não encontrada'}</p>
        <button
          onClick={() => router.push('/ensaios')}
          className="text-brand hover:text-brand-600"
        >
          Voltar para Ensaios
        </button>
      </div>
    );
  }

  const { musicas } = session;

  return (
    <div className="ensaio-detail-page space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/ensaios')}
            className="p-2 hover:bg-surface-overlay rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-ink-muted" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-ink">{musicas?.titulo}</h1>
            <div className="flex items-center gap-2 text-ink-muted">
              <User className="w-4 h-4" />
              <span>{musicas?.artista}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-3 py-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
          <ConfirmDialog
            open={confirmDeleteOpen}
            onOpenChange={setConfirmDeleteOpen}
            title="Excluir sessão?"
            description="Tem certeza que deseja excluir esta sessão de ensaio? Essa ação não pode ser desfeita."
            onConfirm={performDelete}
          />
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - Cifra */}
        <div className="lg:col-span-2">
          <CifraViewer
            cifra={musicas?.cifra}
            titulo={musicas?.titulo || ''}
            artista={musicas?.artista || ''}
            tomOriginal={musicas?.tom_original}
            showMetronome={true}
            compact={true}
          />
        </div>

        {/* Sidebar - Practice Tools */}
        <div className="space-y-4">
          {/* Timer */}
          <div className="bg-surface-raised rounded-xl p-4 border border-ink/10 shadow-sm">
            <h2 className="text-lg font-semibold text-ink mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-brand" />
              Cronômetro de Prática
            </h2>
            <PracticeTimer 
              initialTime={practiceTime}
              onTimeUpdate={handleTimeUpdate}
            />
            <div className="mt-2 text-sm text-ink-muted">
              Tempo total acumulado: <span className="font-medium">{formatDuration(practiceTime)}</span>
            </div>
          </div>

          {/* Status Selection */}
          <div className="bg-surface-raised rounded-xl p-4 border border-ink/10 shadow-sm">
            <h3 className="text-sm font-semibold text-ink mb-3">Status</h3>
            <div className="flex flex-wrap gap-2">
              {(['needs_practice', 'practiced', 'mastered'] as PracticeStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    status === s
                      ? PRACTICE_STATUS_BADGE_CLASSES[s]
                      : 'bg-surface-overlay text-ink-muted hover:bg-surface-overlay'
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
          <div className="bg-surface-raised rounded-xl p-4 border border-ink/10 shadow-sm">
            <h3 className="text-sm font-semibold text-ink mb-3">Dificuldade</h3>
            <div className="flex flex-wrap gap-2">
              {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    difficulty === d
                      ? DIFFICULTY_BADGE_CLASSES[d]
                      : 'bg-surface-overlay text-ink-muted hover:bg-surface-overlay'
                  }`}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-surface-raised rounded-xl p-4 border border-ink/10 shadow-sm">
            <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Observações
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione suas observações sobre esta música..."
              className="w-full h-32 px-3 py-2 text-sm border border-ink/20 rounded-lg focus:ring-2 focus:ring-brand focus:border-brand resize-none"
            />
          </div>

          {/* Drum Pad / Ritmo da música */}
          <DrumPad
            initialGroove={drumPad.groove}
            initialBpm={drumPad.bpm}
            initialVolume={drumPad.volume}
            onGrooveChange={drumPad.onGrooveChange}
            onBpmChange={drumPad.onBpmChange}
            onVolumeChange={drumPad.onVolumeChange}
          />
        </div>
      </div>
    </div>
  );
}

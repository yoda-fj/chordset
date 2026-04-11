'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PracticeTimer } from '@/components/practice/PracticeTimer';
import { Metronome } from '@/components/chords/Metronome';
import { Autoscroll } from '@/components/chords/Autoscroll';
import { ChordViewer } from '@/components/chords/ChordViewer';
import { formatDuration } from '@/lib/practice-utils';
import { getAllKeys, transposeCifra } from '@/utils/chord-transposer';
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
  Music, 
  User, 
  CheckCircle, 
  AlertCircle,
  Save,
  FileText,
  Loader2,
  Trash2,
  Music2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize
} from 'lucide-react';

export default function EnsaioDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const [session, setSession] = useState<PracticeSessionWithMusica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [status, setStatus] = useState<PracticeStatus>('needs_practice');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [notes, setNotes] = useState('');
  const [practiceTime, setPracticeTime] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Transpose state
  const [originalTom, setOriginalTom] = useState<string | null>(null);
  const [originalCifra, setOriginalCifra] = useState<string | null>(null);
  const [currentTom, setCurrentTom] = useState<string>('C');
  const [currentCifra, setCurrentCifra] = useState<string | null>(null);

  // Display settings
  const [fontSize, setFontSize] = useState(16);
  const [isFullscreen, setIsFullscreen] = useState(false);

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
        
        // Setup transpose
        if (data.musicas?.tom_original) {
          setOriginalTom(data.musicas.tom_original);
          setCurrentTom(data.musicas.tom_original);
        }
        if (data.musicas?.cifra) {
          setOriginalCifra(data.musicas.cifra);
          setCurrentCifra(data.musicas.cifra);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [id]);

  const handleTranspose = (newTom: string) => {
    if (!originalTom || !originalCifra) return;
    const transposed = transposeCifra(originalCifra, originalTom, newTom);
    setCurrentTom(newTom);
    setCurrentCifra(transposed);
  };

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
      alert(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir esta sessão?')) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/practice-sessions/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Erro ao excluir');
      router.push('/ensaios');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao excluir');
      setIsDeleting(false);
    }
  };

  const handleTimeUpdate = (newTime: number) => {
    setPracticeTime(newTime);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error || 'Sessão não encontrada'}</p>
        <button
          onClick={() => router.push('/ensaios')}
          className="text-indigo-600 hover:text-indigo-700"
        >
          Voltar para Ensaios
        </button>
      </div>
    );
  }

  const { musicas } = session;
  const hasCifra = musicas?.cifra;
  const displayTom = currentTom;
  const displayCifra = currentCifra || musicas?.cifra;

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
            <h1 className="text-2xl font-bold text-slate-900">{musicas?.titulo}</h1>
            <div className="flex items-center gap-2 text-slate-600">
              <User className="w-4 h-4" />
              <span>{musicas?.artista}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Excluindo...' : 'Excluir'}
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content - Cifra */}
        <div className="lg:col-span-2 space-y-4">
          {/* Controles da Cifra */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-4">
            {/* Header com info e controles */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Music2 className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-slate-900">Cifra</span>
                {originalTom && (
                  <span className="text-sm text-slate-500 ml-2">
                    Tom: <strong className="text-indigo-600">{displayTom}</strong>
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Font size controls */}
                <button
                  onClick={() => setFontSize(Math.max(12, fontSize - 2))}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                  title="Diminuir fonte"
                >
                  <ZoomOut className="w-4 h-4 text-slate-600" />
                </button>
                <span className="text-sm text-slate-500 w-12 text-center">{fontSize}px</span>
                <button
                  onClick={() => setFontSize(Math.min(28, fontSize + 2))}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                  title="Aumentar fonte"
                >
                  <ZoomIn className="w-4 h-4 text-slate-600" />
                </button>
                
                {/* Fullscreen */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-slate-100 rounded-lg"
                  title={isFullscreen ? 'Sair fullscreen' : 'Fullscreen'}
                >
                  {isFullscreen ? (
                    <Minimize className="w-4 h-4 text-slate-600" />
                  ) : (
                    <Maximize className="w-4 h-4 text-slate-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Transpose */}
            {originalTom && originalCifra && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Transpor para:</span>
                <select
                  value={currentTom}
                  onChange={(e) => handleTranspose(e.target.value)}
                  className="px-3 py-1.5 bg-indigo-100 text-indigo-700 font-medium rounded-lg border-0 cursor-pointer focus:ring-2 focus:ring-indigo-500"
                >
                  {getAllKeys().map((key) => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Cifra Viewer */}
          <div 
            ref={scrollContainerRef}
            className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
            style={{ maxHeight: isFullscreen ? 'calc(100vh - 300px)' : 'calc(100vh - 400px)' }}
          >
            {hasCifra ? (
              <div style={{ fontSize: `${fontSize}px` }}>
                <ChordViewer 
                  chordProContent={displayCifra}
                  semitones={0}
                  title={musicas.titulo}
                  artist={musicas.artista}
                />
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Nenhuma cifra disponível para esta música.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Practice Tools */}
        <div className="space-y-4">
          {/* Timer */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
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
          <Metronome defaultBpm={100} />

          {/* Autoscroll */}
          <Autoscroll targetRef={scrollContainerRef} />

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

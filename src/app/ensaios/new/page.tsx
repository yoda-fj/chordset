'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Search, Music, Plus } from 'lucide-react';
import Link from 'next/link';
import type { Musica } from '@/types/database';
import { DifficultyLevel } from '@/types/practice';
import { parseTags } from '@/utils/tag-utils';

export default function NewEnsaioPage() {
  const router = useRouter();
  const [musicas, setMusicas] = useState<Musica[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMusica, setSelectedMusica] = useState<Musica | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMusicas() {
      try {
        const response = await fetch('/api/musicas');
        if (response.ok) {
          const data = await response.json();
          const parsed = data.map((m: Musica) => ({
            ...m,
            tags: parseTags(m.tags)
          }));
          setMusicas(parsed);
        }
      } catch (err) {
        console.error('Erro ao buscar músicas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchMusicas();
  }, []);

  const filteredMusicas = musicas.filter(
    (m) =>
      m.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.artista.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = async () => {
    if (!selectedMusica) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/practice-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          musica_id: selectedMusica.id,
          difficulty,
          status: 'needs_practice',
          total_practice_time_seconds: 0,
          notes: null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao criar ensaio');
      }

      router.push('/ensaios');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar ensaio');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/ensaios"
          className="inline-flex items-center gap-2 text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={18} />
          Voltar para Ensaios
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-ink">Novo Ensaio</h1>

      {error && (
        <div className="p-4 bg-danger/10 border border-danger/40 rounded-lg text-danger">
          {error}
        </div>
      )}

      {/* Difficulty Selection */}
      <div className="bg-surface-raised p-6 rounded-lg border space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Dificuldade
          </label>
          <div className="flex gap-3">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(d)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  difficulty === d
                    ? d === 'easy'
                      ? 'bg-success/15 border-success/40 text-success'
                      : d === 'medium'
                      ? 'bg-brand/15 border-brand/40 text-brand-600'
                      : 'bg-danger/15 border-danger/50 text-danger'
                    : 'bg-surface-raised border-ink/10 text-ink-muted hover:bg-surface'
                }`}
              >
                {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Médio' : 'Difícil'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Music Selection */}
      <div className="bg-surface-raised p-6 rounded-lg border space-y-4">
        <div>
          <label className="block text-sm font-medium text-ink mb-2">
            Selecione a Música
          </label>
          
          {selectedMusica ? (
            <div className="p-4 bg-brand/10 border border-brand/30 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Music className="text-brand" size={20} />
                  <div>
                    <div className="font-medium text-ink">{selectedMusica.titulo}</div>
                    <div className="text-sm text-ink-muted">{selectedMusica.artista}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMusica(null)}
                  className="text-ink-faint hover:text-ink-muted"
                >
                  Trocar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar música..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-auto border rounded-lg">
                {loading ? (
                  <div className="p-4 text-center text-ink-muted">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </div>
                ) : filteredMusicas.length === 0 ? (
                  <div className="p-4 text-center text-ink-muted">
                    Nenhuma música encontrada
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredMusicas.map((musica) => (
                      <button
                        key={musica.id}
                        onClick={() => setSelectedMusica(musica)}
                        className="w-full text-left p-3 hover:bg-surface transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Music className="text-ink-faint" size={16} />
                          <div>
                            <div className="font-medium text-ink">{musica.titulo}</div>
                            <div className="text-sm text-ink-muted">{musica.artista}</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Button */}
      <div className="flex justify-end gap-3">
        <Link
          href="/ensaios"
          className="px-4 py-2 text-ink-muted hover:text-ink"
        >
          Cancelar
        </Link>
        <button
          onClick={handleCreate}
          disabled={!selectedMusica || saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors"
        >
          {saving ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Criando...
            </>
          ) : (
            <>
              <Plus size={18} />
              Criar Ensaio
            </>
          )}
        </button>
      </div>
    </div>
  );
}

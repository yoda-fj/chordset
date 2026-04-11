'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Search, Music, Plus } from 'lucide-react';
import Link from 'next/link';
import type { Musica } from '@/types/database';
import { DifficultyLevel } from '@/types/practice';

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
          const parsed = data.map((m: any) => ({
            ...m,
            tags: typeof m.tags === 'string' ? JSON.parse(m.tags) : m.tags || []
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
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={18} />
          Voltar para Ensaios
        </Link>
      </div>

      <h1 className="text-2xl font-bold text-gray-900">Novo Ensaio</h1>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* Difficulty Selection */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      ? 'bg-green-100 border-green-300 text-green-800'
                      : d === 'medium'
                      ? 'bg-yellow-100 border-yellow-300 text-yellow-800'
                      : 'bg-red-100 border-red-300 text-red-800'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {d === 'easy' ? 'Fácil' : d === 'medium' ? 'Médio' : 'Difícil'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Music Selection */}
      <div className="bg-white p-6 rounded-lg border space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecione a Música
          </label>
          
          {selectedMusica ? (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Music className="text-indigo-500" size={20} />
                  <div>
                    <div className="font-medium text-gray-900">{selectedMusica.titulo}</div>
                    <div className="text-sm text-gray-500">{selectedMusica.artista}</div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMusica(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  Trocar
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar música..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-auto border rounded-lg">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                  </div>
                ) : filteredMusicas.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Nenhuma música encontrada
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredMusicas.map((musica) => (
                      <button
                        key={musica.id}
                        onClick={() => setSelectedMusica(musica)}
                        className="w-full text-left p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Music className="text-gray-400" size={16} />
                          <div>
                            <div className="font-medium text-gray-900">{musica.titulo}</div>
                            <div className="text-sm text-gray-500">{musica.artista}</div>
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
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Cancelar
        </Link>
        <button
          onClick={handleCreate}
          disabled={!selectedMusica || saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
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

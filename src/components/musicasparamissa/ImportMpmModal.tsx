'use client';

import { useState } from 'react';
import { Church, X, Loader2, Link as LinkIcon } from 'lucide-react';

interface ImportedSong {
  titulo: string;
  artista: string;
  tom_original: string | null;
  cifra: string;
  url: string;
  provider: string;
}

interface ImportMpmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (song: ImportedSong) => void;
}

export function ImportMpmModal({ isOpen, onClose, onImport }: ImportMpmModalProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setUrl('');
    setError(null);
    setLoading(false);
    onClose();
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/import-musicasparamissa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), save: false }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.song) {
        throw new Error(result.error || 'Erro ao importar música');
      }

      onImport(result.song);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar música');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-raised dark:bg-surface-raised rounded-xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink/10 dark:border-ink/20">
          <h2 className="text-lg font-semibold text-ink dark:text-ink">
            Importar do Músicas para Missa
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface-overlay dark:hover:bg-surface-overlay rounded-lg transition-colors"
          >
            <X size={20} className="text-ink-muted" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleImport} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink dark:text-ink-muted mb-2">
              Link da música
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" size={18} />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://musicasparamissa.com.br/musica/..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand dark:bg-surface-overlay dark:border-ink/20 dark:text-ink"
                autoFocus
                required
              />
            </div>
            <p className="mt-2 text-xs text-ink-muted">
              No site musicasparamissa.com.br, abra a página da música e cole aqui o endereço.
              A cifra da aba &quot;Cifra&quot; será importada automaticamente.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-danger/10 dark:bg-danger/15 border border-danger/40 dark:border-danger/40 rounded-lg text-danger dark:text-danger text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border rounded-lg hover:bg-surface dark:hover:bg-surface-overlay transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!url.trim() || loading}
              className="flex-1 px-4 py-2 bg-brand text-on-accent rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Church size={18} />
                  Importar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { Camera, X, Loader2, ChevronRight } from 'lucide-react';
import { LLM_PROVIDERS } from '@/lib/llm-providers';

interface ExtractedData {
  titulo: string;
  artista: string;
  tom: string | null;
  cifra: string;
  observacoes?: string | null;
}

interface ImportPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ExtractedData) => void;
}

export function ImportPhotoModal({ isOpen, onClose, onImport }: ImportPhotoModalProps) {
  const [step, setStep] = useState<'upload' | 'review'>('upload');
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      const base64Data = base64.split(',')[1]; // Remove data:image/jpeg;base64,
      setImageBase64(base64Data);
      setImagePreview(base64);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleTakePhoto = () => {
    fileInputRef.current?.click();
  };

  const handleExtract = async () => {
    if (!imageBase64) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ocr/cifra', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          provider: selectedProvider,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao processar imagem');
      }

      setExtractedData(result.data);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao processar imagem');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (extractedData) {
      onImport(extractedData);
      handleClose();
    }
  };

  const handleClose = () => {
    setStep('upload');
    setImagePreview(null);
    setImageBase64(null);
    setError(null);
    setExtractedData(null);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-raised dark:bg-surface-raised rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-ink/10 dark:border-ink/20">
          <h2 className="text-lg font-semibold text-ink dark:text-ink">
            {step === 'upload' ? 'Importar Cifra via Foto' : 'Revisar Cifra Extraída'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-surface-overlay dark:hover:bg-surface-overlay rounded-lg transition-colors"
          >
            <X size={20} className="text-ink-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-ink dark:text-ink-muted mb-2">
                  Provider de IA
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {LLM_PROVIDERS.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setSelectedProvider(provider.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        selectedProvider === provider.id
                          ? 'border-brand bg-brand/10 dark:bg-brand/20 ring-2 ring-brand'
                          : 'border-ink/10 dark:border-ink/20 hover:border-brand/40'
                      }`}
                    >
                      <span className="text-sm font-medium text-ink dark:text-ink">
                        {provider.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-ink dark:text-ink-muted mb-2">
                  Foto da Cifra
                </label>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {imagePreview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element -- preview local em data URL, next/image não se aplica */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full max-h-64 object-contain rounded-lg bg-surface-overlay"
                    />
                    <button
                      onClick={() => {
                        setImagePreview(null);
                        setImageBase64(null);
                      }}
                      className="absolute top-2 right-2 p-2 bg-danger text-zinc-950 rounded-lg hover:bg-danger"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleTakePhoto}
                    className="w-full p-8 border-2 border-dashed border-ink/20 dark:border-ink/20 rounded-lg hover:border-brand/50 hover:bg-surface dark:hover:bg-surface-overlay transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2 text-ink-muted">
                      <Camera size={48} />
                      <span>Clique para tirar foto ou escolher da galeria</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-danger/10 dark:bg-danger/15 border border-danger/40 dark:border-danger/40 rounded-lg text-danger dark:text-danger text-sm">
                  {error}
                </div>
              )}
            </div>
          )}

          {step === 'review' && extractedData && (
            <div className="space-y-4">
              {/* Preview */}
              <div>
                {imagePreview && (
                  <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- preview local em data URL, next/image não se aplica */}
                  <img
                    src={imagePreview}
                    alt="Original"
                    className="w-full max-h-32 object-contain rounded-lg bg-surface-overlay mb-4"
                  />
                  </>
                )}
              </div>

              {/* Editable Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Título</label>
                  <input
                    type="text"
                    value={extractedData.titulo}
                    onChange={(e) => setExtractedData({ ...extractedData, titulo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-surface-overlay dark:border-ink/20 dark:text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Artista</label>
                  <input
                    type="text"
                    value={extractedData.artista}
                    onChange={(e) => setExtractedData({ ...extractedData, artista: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-surface-overlay dark:border-ink/20 dark:text-ink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-ink-muted mb-1">Tom</label>
                  <input
                    type="text"
                    value={extractedData.tom || ''}
                    onChange={(e) => setExtractedData({ ...extractedData, tom: e.target.value || null })}
                    placeholder="Ex: C, Am, Dm7"
                    className="w-full px-3 py-2 border rounded-lg dark:bg-surface-overlay dark:border-ink/20 dark:text-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Cifra</label>
                <textarea
                  value={extractedData.cifra}
                  onChange={(e) => setExtractedData({ ...extractedData, cifra: e.target.value })}
                  rows={12}
                  className="w-full px-3 py-2 border rounded-lg font-mono text-sm dark:bg-surface-overlay dark:border-ink/20 dark:text-ink resize-y"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ink-muted mb-1">Observações (opcional)</label>
                <input
                  type="text"
                  value={extractedData.observacoes || ''}
                  onChange={(e) => setExtractedData({ ...extractedData, observacoes: e.target.value || null })}
                  placeholder="Ex: Versão simplificada"
                  className="w-full px-3 py-2 border rounded-lg dark:bg-surface-overlay dark:border-ink/20 dark:text-ink"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-ink/10 dark:border-ink/20 flex gap-3">
          {step === 'upload' && (
            <>
              <button
                onClick={handleClose}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-surface dark:hover:bg-surface-overlay transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExtract}
                disabled={!imageBase64 || loading}
                className="flex-1 px-4 py-2 bg-brand text-zinc-950 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    Extrair Cifra
                    <ChevronRight size={18} />
                  </>
                )}
              </button>
            </>
          )}

          {step === 'review' && (
            <>
              <button
                onClick={() => setStep('upload')}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-surface dark:hover:bg-surface-overlay transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-2 bg-success text-zinc-950 rounded-lg hover:bg-success/80 transition-colors"
              >
                Salvar Música
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// @vitest-environment jsdom
/**
 * Cobertura — SetlistBuilder com adição em lote:
 * (a) sem eventoId: confirmar N seleções cria entradas temp- localmente, sem
 *     POST de adição; com eventoId: exatamente UM bulk POST com musica_ids;
 * (b) músicas já adicionadas não aparecem no modal;
 * (c) seleção é limpa após confirmar; Escape fecha o modal e descarta a seleção.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { SetlistBuilder } from './SetlistBuilder';
import type { SetlistMusica } from './MusicaCard';

const MUSICAS = [
  { id: 1, titulo: 'Amazing Grace', artista: 'Hinário', tags: ['louvor'], tom_original: 'G', tom_atual: null, cifra: null, groove: null, drum_pattern_id: null, bpm: 100, volume: 0.8 },
  { id: 2, titulo: 'A Ele a Glória', artista: 'Artista B', tags: [], tom_original: 'A', tom_atual: null, cifra: null, groove: null, drum_pattern_id: null, bpm: 120, volume: 0.8 },
  { id: 3, titulo: 'Bondade de Deus', artista: 'Artista C', tags: [], tom_original: 'D', tom_atual: null, cifra: null, groove: null, drum_pattern_id: null, bpm: 90, volume: 0.8 },
  { id: 4, titulo: 'Coração Valente', artista: 'Artista D', tags: [], tom_original: 'E', tom_atual: null, cifra: null, groove: null, drum_pattern_id: null, bpm: 110, volume: 0.8 },
  { id: 5, titulo: 'Deus está Aqui', artista: 'Artista E', tags: [], tom_original: 'C', tom_atual: null, cifra: null, groove: null, drum_pattern_id: null, bpm: 105, volume: 0.8 },
];

function bulkResponse(musicaIds: number[]) {
  return {
    success: true,
    quantidade: musicaIds.length,
    musicas: musicaIds.map((musicaId, index) => ({
      id: 100 + musicaId,
      evento_id: 5,
      musica_id: musicaId,
      ordem: index + 1,
      tom_evento: null,
      observacoes: null,
      confirmada: false,
      responsavel: null,
      created_at: '2026-11-13T00:00:00.000Z',
    })),
  };
}

const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
  if (url === '/api/musicas') {
    return Promise.resolve({ ok: true, json: async () => MUSICAS });
  }
  if (url === '/api/eventos/5/musicas' && opts?.method === 'POST') {
    const body = JSON.parse(String(opts.body));
    return Promise.resolve({ ok: true, json: async () => bulkResponse(body.musica_ids) });
  }
  return Promise.resolve({ ok: false, status: 404, statusText: 'Not Found', json: async () => ({}) });
});

function postCalls() {
  return fetchMock.mock.calls.filter(
    ([url, opts]) => String(url).includes('/musicas') && (opts as RequestInit | undefined)?.method === 'POST'
  );
}

// Harness controlado: mantém estado local e espia o onChange
function Builder({ eventoId, onChangeSpy }: { eventoId?: number; onChangeSpy: (m: SetlistMusica[]) => void }) {
  const [musicas, setMusicas] = useState<SetlistMusica[]>([]);
  return (
    <SetlistBuilder
      musicas={musicas}
      onChange={(m) => {
        setMusicas(m);
        onChangeSpy(m);
      }}
      isEvento={true}
      eventoId={eventoId}
    />
  );
}

async function openModal() {
  fireEvent.click(screen.getByRole('button', { name: /Adicionar Músicas/i }));
  await waitFor(() =>
    expect(screen.queryByText(/Carregando músicas/)).not.toBeInTheDocument()
  );
}

function selecionar(titulo: RegExp) {
  fireEvent.click(screen.getByRole('button', { name: titulo }));
}

describe('SetlistBuilder — adição em lote', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sem eventoId: confirmar 3 seleções cria entradas temp- sem POST de adição', async () => {
    const onChangeSpy = vi.fn();
    render(<Builder onChangeSpy={onChangeSpy} />);

    await openModal();
    selecionar(/Amazing Grace/);
    selecionar(/A Ele a Glória/);
    selecionar(/Bondade de Deus/);

    const confirmBtn = screen.getByRole('button', { name: /Adicionar 3 música/i });
    expect(confirmBtn).toBeEnabled();
    fireEvent.click(confirmBtn);

    await waitFor(() => expect(onChangeSpy).toHaveBeenCalledTimes(1));
    const adicionadas = onChangeSpy.mock.calls[0][0] as SetlistMusica[];
    expect(adicionadas).toHaveLength(3);
    expect(adicionadas.map((m) => m.musica_id)).toEqual([1, 2, 3]);
    expect(adicionadas.map((m) => m.ordem)).toEqual([1, 2, 3]);
    adicionadas.forEach((m) => expect(String(m.id)).toMatch(/^temp-/));
    adicionadas.forEach((m) => expect(m.musicas.titulo).toBeTruthy());

    // caminho temp- não faz POST de adição — só o GET inicial de /api/musicas
    expect(postCalls()).toHaveLength(0);

    // seleção limpa e modal segue aberto (ainda há 2 músicas disponíveis)
    expect(screen.getByRole('button', { name: /Adicionar 0 música/i })).toBeDisabled();
    expect(screen.getByPlaceholderText('Buscar música...')).toBeInTheDocument();
  });

  it('com eventoId: confirmar 3 seleções faz exatamente UM bulk POST com musica_ids', async () => {
    const onChangeSpy = vi.fn();
    render(<Builder eventoId={5} onChangeSpy={onChangeSpy} />);

    await openModal();
    selecionar(/Amazing Grace/);
    selecionar(/A Ele a Glória/);
    selecionar(/Bondade de Deus/);

    fireEvent.click(screen.getByRole('button', { name: /Adicionar 3 música/i }));

    await waitFor(() => expect(postCalls()).toHaveLength(1));
    const [url, opts] = postCalls()[0];
    expect(String(url)).toBe('/api/eventos/5/musicas');
    expect(JSON.parse(String((opts as RequestInit).body))).toEqual({ musica_ids: [1, 2, 3] });

    await waitFor(() => expect(onChangeSpy).toHaveBeenCalledTimes(1));
    const adicionadas = onChangeSpy.mock.calls[0][0] as SetlistMusica[];
    expect(adicionadas).toHaveLength(3);
    expect(adicionadas.map((m) => m.musica_id)).toEqual([1, 2, 3]);
    expect(adicionadas[0].musicas.titulo).toBe('Amazing Grace');

    // continua exatamente UM POST após o onChange
    expect(postCalls()).toHaveLength(1);
  });

  it('músicas já adicionadas não aparecem na lista do modal', async () => {
    const iniciais: SetlistMusica[] = [
      { id: 'temp-a', musica_id: 1, ordem: 1, tom_evento: null, observacoes: null, created_at: '2026-11-13T00:00:00.000Z', musicas: MUSICAS[0] },
      { id: 'temp-b', musica_id: 2, ordem: 2, tom_evento: null, observacoes: null, created_at: '2026-11-13T00:00:00.000Z', musicas: MUSICAS[1] },
    ];
    render(<SetlistBuilder musicas={iniciais} onChange={vi.fn()} isEvento={true} />);

    await openModal();

    expect(screen.queryByRole('button', { name: /Amazing Grace/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /A Ele a Glória/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bondade de Deus/ })).toBeInTheDocument();
  });

  it('Escape fecha o modal e descarta a seleção', async () => {
    const onChangeSpy = vi.fn();
    render(<Builder onChangeSpy={onChangeSpy} />);

    await openModal();
    selecionar(/Amazing Grace/);
    expect(screen.getByRole('button', { name: /Adicionar 1 música/i })).toBeEnabled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByPlaceholderText('Buscar música...')).not.toBeInTheDocument();
    expect(onChangeSpy).not.toHaveBeenCalled();

    // Ao reabrir, a seleção anterior foi descartada
    await openModal();
    expect(screen.getByRole('button', { name: /Adicionar 0 música/i })).toBeDisabled();
  });
});

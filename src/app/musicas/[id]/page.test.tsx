// @vitest-environment jsdom
/**
 * Cobertura — página da música (card de ritmo)
 * saveRitmo cancela os timers pendentes de BPM/volume e zera ritmoPendingRef
 * antes do PUT. Regressão: trocar o ritmo com um BPM ainda pendente (< 1s de
 * debounce) não pode salvar depois o BPM velho por cima do BPM do padrão novo.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: '1' }),
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn() }),
}));

vi.mock('tone', () => ({
  Transport: { bpm: { value: 0 }, start: vi.fn(), stop: vi.fn() },
  Limiter: class {
    toDestination() {
      return this;
    }
    dispose = vi.fn();
  },
  Sampler: class {
    volume = { value: 0 };
    connect() {
      return this;
    }
    dispose = vi.fn();
  },
  Sequence: class {
    start = vi.fn();
    stop = vi.fn();
    dispose = vi.fn();
  },
  start: vi.fn().mockResolvedValue(undefined),
}));

// Painel de áudio exige MediaRecorder/permisões — fora do escopo deste teste
vi.mock('@/components/audio/AudioRecorderPanel', () => ({
  AudioRecorderPanel: () => null,
}));

import MusicaPage from './page';

const MUSICA = {
  id: 1,
  titulo: 'Música Teste',
  artista: 'Artista Teste',
  tom_original: null,
  cifra: '',
  tags: [],
  observacao: '',
  groove: null,
  drum_pattern_id: null,
  bpm: 120,
  volume: 0.7,
  audio_url: null,
};

const DRUM_PATTERNS = [
  { id: 1, nome: 'Funk Teste', bpm: 110, kit: 'kit1', steps: '{}' },
  { id: 2, nome: 'Rock Teste', bpm: 95, kit: 'kit1', steps: '{}' },
];

const fetchMock = vi.fn((url: string, opts?: RequestInit) => {
  if (opts?.method === 'PUT') {
    return Promise.resolve({ ok: true, json: async () => ({ ...MUSICA }) });
  }
  if (url.endsWith('/eventos')) {
    return Promise.resolve({ ok: true, json: async () => [] });
  }
  if (url.endsWith('/drum-patterns')) {
    return Promise.resolve({ ok: true, json: async () => DRUM_PATTERNS });
  }
  return Promise.resolve({ ok: true, json: async () => ({ ...MUSICA }) });
});

function putBodies() {
  return fetchMock.mock.calls
    .filter(([, opts]) => (opts as RequestInit | undefined)?.method === 'PUT')
    .map(([, opts]) => JSON.parse(String((opts as RequestInit).body)));
}

describe('Página da música — card de ritmo', () => {
  beforeEach(() => {
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('trocar o ritmo com BPM pendente salva o BPM do padrão novo (cancela o pendente)', async () => {
    render(<MusicaPage />);

    const select = await screen.findByRole('combobox');
    await waitFor(() =>
      expect(screen.getByRole('option', { name: /Funk Teste/ })).toBeInTheDocument()
    );

    // Seleciona o ritmo 1 (110 BPM) — saveRitmo faz PUT com bpm do padrão
    fireEvent.change(select, { target: { value: '1' } });
    await act(async () => {}); // deixa o PUT resolver e o BPM input aparecer
    expect(putBodies()).toContainEqual({ drum_pattern_id: 1, bpm: 110 });

    vi.useFakeTimers();

    // Edita o BPM (140) — fica pendente no debounce de 1s
    const bpmInput = screen.getByDisplayValue('110');
    fireEvent.change(bpmInput, { target: { value: '140' } });
    expect(putBodies()).not.toContainEqual({ bpm: 140 });

    // Troca pro ritmo 2 (95 BPM) antes do debounce disparar
    fireEvent.change(select, { target: { value: '2' } });
    await act(async () => {
      vi.advanceTimersByTime(2000); // passa o debounce: o pendente foi cancelado
    });

    // O PUT final é do padrão novo; o BPM pendente de 140 nunca foi salvo
    expect(putBodies()).toContainEqual({ drum_pattern_id: 2, bpm: 95 });
    expect(putBodies()).not.toContainEqual({ bpm: 140 });
  });
});

describe('Página da música — re-importar cifra', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function reimportBodies(mock: ReturnType<typeof vi.fn>) {
    return mock.mock.calls
      .filter(([url, opts]) =>
        String(url).endsWith('/reimportar') &&
        (opts as RequestInit | undefined)?.method === 'POST'
      )
      .map(([, opts]) => JSON.parse(String((opts as RequestInit).body)));
  }

  it('sucesso: confirma, POST {id} e mostra mensagem com tom/linhas', async () => {
    const fetchMockLocal = vi.fn((url: string) => {
      if (String(url).endsWith('/reimportar')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true, tom: 'G', linhas: 42 }) });
      }
      if (url.endsWith('/eventos')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.endsWith('/drum-patterns')) {
        return Promise.resolve({ ok: true, json: async () => DRUM_PATTERNS });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ...MUSICA, tom_original: 'G' }) });
    });
    vi.stubGlobal('fetch', fetchMockLocal);

    render(<MusicaPage />);

    fireEvent.click(await screen.findByRole('button', { name: /re-importar cifra/i }));

    expect(await screen.findByText(/Cifra re-importada com sucesso — tom: G, 42 linhas\./)).toBeInTheDocument();
    expect(reimportBodies(fetchMockLocal)).toEqual([{ id: 1 }]);
  });

  it('404 da API: mostra o erro do servidor na tela', async () => {
    const erroServidor = 'Nenhum resultado no Cifra Club para "Música Teste — Artista Teste". Verifique o título/artista ou importe manualmente.';
    const fetchMockLocal = vi.fn((url: string) => {
      if (String(url).endsWith('/reimportar')) {
        return Promise.resolve({ ok: false, status: 404, json: async () => ({ error: erroServidor }) });
      }
      if (url.endsWith('/eventos')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.endsWith('/drum-patterns')) {
        return Promise.resolve({ ok: true, json: async () => DRUM_PATTERNS });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ...MUSICA }) });
    });
    vi.stubGlobal('fetch', fetchMockLocal);

    render(<MusicaPage />);

    fireEvent.click(await screen.findByRole('button', { name: /re-importar cifra/i }));

    expect(await screen.findByText(erroServidor)).toBeInTheDocument();
  });

  it('needChoice: abre modal com candidatas e a escolha dispara POST {id, url}', async () => {
    const candidates = [
      { titulo: 'The Scientist', artista: 'Coldplay', url: 'https://www.cifraclub.com.br/coldplay/the-scientist' },
      { titulo: 'The Scientist (acústica)', artista: 'Coldplay', url: 'https://www.cifraclub.com.br/coldplay/the-scientist/acustica/' },
    ];
    const respostasReimportar = [
      { ok: true, json: async () => ({ needChoice: true, candidates }) },
      { ok: true, json: async () => ({ success: true, tom: 'F', linhas: 10 }) },
    ];
    const fetchMockLocal = vi.fn((url: string) => {
      if (String(url).endsWith('/reimportar')) {
        return Promise.resolve(respostasReimportar.shift()!);
      }
      if (url.endsWith('/eventos')) {
        return Promise.resolve({ ok: true, json: async () => [] });
      }
      if (url.endsWith('/drum-patterns')) {
        return Promise.resolve({ ok: true, json: async () => DRUM_PATTERNS });
      }
      return Promise.resolve({ ok: true, json: async () => ({ ...MUSICA }) });
    });
    vi.stubGlobal('fetch', fetchMockLocal);

    render(<MusicaPage />);

    fireEvent.click(await screen.findByRole('button', { name: /re-importar cifra/i }));

    // Modal de escolha aparece sem scraping ainda
    expect(await screen.findByText('Várias versões encontradas')).toBeInTheDocument();

    fireEvent.click(screen.getByText('The Scientist (acústica)'));

    expect(await screen.findByText(/Cifra re-importada com sucesso — tom: F, 10 linhas\./)).toBeInTheDocument();
    expect(reimportBodies(fetchMockLocal)).toEqual([
      { id: 1 },
      { id: 1, url: 'https://www.cifraclub.com.br/coldplay/the-scientist/acustica/' },
    ]);
  });
});

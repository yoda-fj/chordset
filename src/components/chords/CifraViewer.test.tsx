// @vitest-environment jsdom
/**
 * 2.6 — Testes de componente: CifraViewer
 * Cobre: transposição via stepper (2.3), zoom com travas (2.2),
 * aria-labels nos controles (2.5), empty state.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
// Metronome e RhythmPlayer carregam Tone.js — mock compartilhado dos testes
// de sincronização (showMetronome); os demais testes não tocam em Tone.
vi.mock('tone', () => {
  class MockLimiter {
    toDestination() { return this; }
    dispose = vi.fn();
  }
  class MockSampler {
    volume = { value: 0 };
    constructor(opts: { onload?: () => void }) { opts.onload?.(); }
    connect() { return this; }
    triggerAttackRelease = vi.fn();
    dispose = vi.fn();
  }
  class MockMembraneSynth {
    toDestination() { return this; }
    triggerAttackRelease = vi.fn();
    dispose = vi.fn();
  }
  return {
    Limiter: MockLimiter,
    Sampler: MockSampler,
    MembraneSynth: MockMembraneSynth,
    Draw: { schedule: vi.fn() },
    Transport: { start: vi.fn(), stop: vi.fn(), bpm: { value: 0 } },
    now: () => 0,
    start: vi.fn().mockResolvedValue(undefined),
  };
});

import { CifraViewer } from './CifraViewer';

const CIFRA = `[C]Twinkle twinkle [G]little star
[C]How I [F]wonder [C]what you [G]are`;

const PROPS = {
  cifra: CIFRA,
  titulo: 'Twinkle',
  artista: 'Tradicional',
  tomOriginal: 'C',
  showMetronome: false, // evita montar Tone.js (sem AudioContext no jsdom)
};

describe('CifraViewer', () => {
  it('mostra empty state sem cifra', () => {
    render(<CifraViewer {...PROPS} cifra={null} />);
    expect(screen.getByText(/Nenhuma cifra disponível/)).toBeInTheDocument();
  });

  it('controles de ícone têm aria-label (2.5)', () => {
    render(<CifraViewer {...PROPS} />);
    for (const label of [
      'Subir meio tom',
      'Baixar meio tom',
      'Diminuir fonte',
      'Aumentar fonte',
      'Esconder tablatura',
      'Entrar em tela cheia',
    ]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('stepper transpõe +1 semitom e mostra o tom original (2.3)', async () => {
    const user = userEvent.setup();
    const { container } = render(<CifraViewer {...PROPS} />);

    await user.click(screen.getByRole('button', { name: 'Subir meio tom' }));

    // Tom exibido no stepper (grupo anuncia o tom atual)
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Tom atual: C#');
    // Badge de tom original
    expect(screen.getByText(/original: C/)).toBeInTheDocument();
    // Acordes transpostos na cifra
    const chords = [...container.querySelectorAll('.chord-line .text-chord')].map(
      (el) => el.textContent?.trim()
    );
    expect(chords).toContain('C#');
    expect(chords).toContain('G#');
    expect(chords).not.toContain('C');
  });

  it('volta pro tom original descendo o stepper', async () => {
    const user = userEvent.setup();
    render(<CifraViewer {...PROPS} />);

    await user.click(screen.getByRole('button', { name: 'Subir meio tom' }));
    await user.click(screen.getByRole('button', { name: 'Baixar meio tom' }));

    expect(screen.queryByText(/original:/)).not.toBeInTheDocument();
  });

  it('zoom nasce em 24px e trava nos limites 20/64 (2.2)', async () => {
    const user = userEvent.setup();
    const { container } = render(<CifraViewer {...PROPS} />);
    const sheet = () => container.querySelector('.chord-sheet') as HTMLElement;

    expect(sheet().style.fontSize).toBe('24px');

    const zoomOut = screen.getByRole('button', { name: 'Diminuir fonte' });
    await user.click(zoomOut); // 24 → 20
    expect(sheet().style.fontSize).toBe('20px');
    expect(zoomOut).toBeDisabled(); // travou no mínimo

    const zoomIn = screen.getByRole('button', { name: 'Aumentar fonte' });
    for (let i = 0; i < 12; i++) await user.click(zoomIn);
    expect(sheet().style.fontSize).toBe('64px');
    expect(zoomIn).toBeDisabled(); // travou no teto
  });

  it('sem tomOriginal: stepper vira display estático', () => {
    const { container } = render(<CifraViewer {...PROPS} tomOriginal={null} />);
    expect(screen.queryByRole('button', { name: 'Subir meio tom' })).not.toBeInTheDocument();
    // Display estático do tom (span com font-chord, fora de botão)
    const display = container.querySelector('span.font-chord.text-brand');
    expect(display?.textContent).toBe('C');
  });
});

describe('CifraViewer — persistência de tom', () => {
  it('transpor chama onTomChange com o novo tom (pai persiste)', async () => {
    const user = userEvent.setup();
    const onTomChange = vi.fn();
    render(<CifraViewer {...PROPS} onTomChange={onTomChange} />);

    await user.click(screen.getByRole('button', { name: 'Subir meio tom' }));

    expect(onTomChange).toHaveBeenCalledWith('C#');
  });

  it('usa o tom salvo (prop tom) como tom inicial, sobre o original', () => {
    render(<CifraViewer {...PROPS} tom="D" />);
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Tom atual: D');
  });

  it('troca de música (key) remonta com o tom salvo da nova música', () => {
    const { rerender } = render(
      <CifraViewer {...PROPS} key="1" cifra="[G]Song one" tomOriginal="G" tom="G" />
    );
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Tom atual: G');

    // O pai remonta com key nova quando a música muda (setlist)
    rerender(<CifraViewer {...PROPS} key="2" cifra="[A]Song two" tomOriginal="A" tom="B" />);
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Tom atual: B');
  });
});

describe('CifraViewer — ritmo e metrônomo sincronizados', () => {
  it('play no ritmo liga o metrônomo junto; parar um para os dois', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    );
    render(<CifraViewer {...PROPS} showMetronome />);

    const ritmo = await screen.findByRole('button', { name: 'Tocar ritmo da música' }, { timeout: 3000 });
    await screen.findByRole('button', { name: 'Iniciar metrônomo' }, { timeout: 3000 });

    await user.click(ritmo);

    expect(await screen.findByRole('button', { name: 'Parar ritmo da música' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(await screen.findByRole('button', { name: 'Parar metrônomo' }))
      .toHaveAttribute('aria-pressed', 'true');

    // Parar pelo metrônomo para os dois
    await user.click(screen.getByRole('button', { name: 'Parar metrônomo' }));
    expect(await screen.findByRole('button', { name: 'Tocar ritmo da música' }))
      .toHaveAttribute('aria-pressed', 'false');
    expect(await screen.findByRole('button', { name: 'Iniciar metrônomo' }))
      .toHaveAttribute('aria-pressed', 'false');

    vi.unstubAllGlobals();
  });
});

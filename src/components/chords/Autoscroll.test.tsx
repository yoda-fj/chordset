// @vitest-environment jsdom
/**
 * Cobertura — Autoscroll
 * Modo BPM: pxPerSecond = BPM_PX_PER_BEAT[nível] × bpm/60 (ex.: nível 1 com
 * bpm=150 → 37.5 px/s). Sem bpm, cai no SPEED_MAP fixo (regressão).
 * O rAF é mockado para controlar os timestamps e medir scrollTop acumulado.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Autoscroll } from './Autoscroll';

const rafQueue: FrameRequestCallback[] = [];

function makeTarget() {
  return {
    scrollHeight: 1000,
    clientHeight: 200,
    scrollTop: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}

/** Executa um frame de rAF com o timestamp dado (delta = ts - frame anterior). */
function runFrame(timestamp: number) {
  const cb = rafQueue.shift();
  if (!cb) throw new Error('sem callback de rAF pendente');
  cb(timestamp);
}

const SPEED_LABELS = [
  'desligado',
  'rastejante',
  'ultra lento',
  'muito lento',
  'lento',
  'médio',
  'rápido',
  'muito rápido',
];

function buttonLabel(level: number) {
  return `Auto-scroll: ${SPEED_LABELS[level]}. Toque para mudar a velocidade.`;
}

describe('Autoscroll', () => {
  beforeEach(() => {
    rafQueue.length = 0;
    vi.stubGlobal('requestAnimationFrame', vi.fn((cb: FrameRequestCallback) => {
      rafQueue.push(cb);
      return rafQueue.length;
    }));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('cicla os níveis de 0 a 7 e volta para desligado', () => {
    const target = makeTarget();
    render(<Autoscroll targetRef={{ current: target as unknown as HTMLElement }} />);
    const btn = screen.getByRole('button', { name: /Auto-scroll/ });

    expect(btn).toHaveAttribute('aria-label', buttonLabel(0));

    for (let level = 1; level <= 7; level++) {
      fireEvent.click(btn);
      expect(btn).toHaveAttribute('aria-label', buttonLabel(level));
    }

    fireEvent.click(btn); // wrap: 7 + 1 → 0
    expect(btn).toHaveAttribute('aria-label', buttonLabel(0));
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('modo BPM: nível 4 com bpm=150 avança 25 px/s (10 × 150/60)', () => {
    const target = makeTarget();
    render(
      <Autoscroll
        targetRef={{ current: target as unknown as HTMLElement }}
        bpm={150}
      />
    );

    const btn = screen.getByRole('button', { name: /Auto-scroll/ });
    fireEvent.click(btn); // nível 1 → agenda o rAF
    expect(rafQueue).toHaveLength(1);

    for (let i = 0; i < 3; i++) fireEvent.click(btn); // níveis 2-4
    // Cada clique reagenda o rAF; no browser o cancel da limpeza deixa só um
    // pendente, mas o mock de cancelAnimationFrame é no-op — drena os mais
    // antigos, mantendo o callback do último efeito (o do nível atual).
    rafQueue.splice(0, rafQueue.length - 1);

    // Timestamps precisam ser > 0: o tick usa lastTimeRef === 0 como sinal de
    // "primeiro frame", então um timestamp 0 faria o 2º frame zerar o delta.
    act(() => {
      runFrame(16); // 1º frame: só inicializa o relógio, sem deslocamento
    });
    expect(target.scrollTop).toBe(0);

    act(() => {
      runFrame(1016); // 1s depois: 25 px
    });
    expect(target.scrollTop).toBeCloseTo(25, 1);

    // Progresso reflete o deslocamento (25 de 800 px scrolláveis)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
  });

  it('sem bpm: nível 2 usa SPEED_MAP (6 px/s) — regressão do modo fixo', () => {
    const target = makeTarget();
    render(<Autoscroll targetRef={{ current: target as unknown as HTMLElement }} />);

    const btn = screen.getByRole('button', { name: /Auto-scroll/ });
    fireEvent.click(btn); // nível 1
    fireEvent.click(btn); // nível 2

    act(() => {
      runFrame(16);
      runFrame(1016);
    });
    expect(target.scrollTop).toBeCloseTo(6, 1);
  });

  it('mostra feedback visual da velocidade ativa', () => {
    const target = makeTarget();
    render(<Autoscroll targetRef={{ current: target as unknown as HTMLElement }} />);
    const btn = screen.getByRole('button', { name: /Auto-scroll/ });

    // Parado: mostra "parado"
    expect(btn.parentElement).toHaveTextContent('parado');

    fireEvent.click(btn); // nível 1
    expect(btn.parentElement).toHaveTextContent('rastejante');

    fireEvent.click(btn); // nível 2
    expect(btn.parentElement).toHaveTextContent('ultra lento');

    fireEvent.click(btn); // de volta a 0 (nível 3)
    expect(btn.parentElement).toHaveTextContent('muito lento');

    fireEvent.click(btn); // 4
    fireEvent.click(btn); // 5
    fireEvent.click(btn); // 6
    fireEvent.click(btn); // 7
    fireEvent.click(btn); // wrap -> 0
    expect(btn.parentElement).toHaveTextContent('parado');
  });
});

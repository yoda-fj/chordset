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

  it('cicla os níveis de 0 a 5 e volta para desligado', () => {
    const target = makeTarget();
    render(<Autoscroll targetRef={{ current: target as unknown as HTMLElement }} />);
    const btn = screen.getByRole('button', { name: /Auto-scroll/ });

    expect(btn).toHaveAttribute('aria-label', buttonLabel(0));

    for (let level = 1; level <= 5; level++) {
      fireEvent.click(btn);
      expect(btn).toHaveAttribute('aria-label', buttonLabel(level));
    }

    fireEvent.click(btn); // wrap: 5 + 1 → 0
    expect(btn).toHaveAttribute('aria-label', buttonLabel(0));
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('modo BPM: nível 1 com bpm=150 avança 37.5 px/s (15 × 150/60)', () => {
    const target = makeTarget();
    render(
      <Autoscroll
        targetRef={{ current: target as unknown as HTMLElement }}
        bpm={150}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Auto-scroll/ }));
    expect(rafQueue).toHaveLength(1);

    // Timestamps precisam ser > 0: o tick usa lastTimeRef === 0 como sinal de
    // "primeiro frame", então um timestamp 0 faria o 2º frame zerar o delta.
    act(() => {
      runFrame(16); // 1º frame: só inicializa o relógio, sem deslocamento
    });
    expect(target.scrollTop).toBe(0);

    act(() => {
      runFrame(1016); // 1s depois: 37.5 px
    });
    expect(target.scrollTop).toBeCloseTo(37.5, 1);

    // Progresso reflete o deslocamento (37.5 de 800 px scrolláveis)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5');
  });

  it('sem bpm: nível 2 usa SPEED_MAP (30 px/s) — regressão do modo fixo', () => {
    const target = makeTarget();
    render(<Autoscroll targetRef={{ current: target as unknown as HTMLElement }} />);

    const btn = screen.getByRole('button', { name: /Auto-scroll/ });
    fireEvent.click(btn); // nível 1
    fireEvent.click(btn); // nível 2

    act(() => {
      runFrame(16);
      runFrame(1016);
    });
    expect(target.scrollTop).toBeCloseTo(30, 1);
  });
});

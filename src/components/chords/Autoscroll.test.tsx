// @vitest-environment jsdom
/**
 * Cobertura — Autoscroll (slider contínuo)
 * px/s = sliderToPx(passo); com bpm, escala por bpm/120 (a 120 BPM o valor
 * do slider vale exatamente). O rAF é mockado para controlar timestamps.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Autoscroll, sliderToPx, MIN_PX, MAX_PX } from './Autoscroll';

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

/** Drena reagendamentos extras deixados pelo mock de cancelAnimationFrame. */
function drainRaf() {
  rafQueue.splice(0, rafQueue.length - 1);
}

describe('sliderToPx', () => {
  it('passo 0 = desligado; extremos vão de MIN a MAX', () => {
    expect(sliderToPx(0)).toBe(0);
    expect(sliderToPx(1)).toBeCloseTo(MIN_PX, 5);
    expect(sliderToPx(30)).toBeCloseTo(MAX_PX, 5);
  });

  it('escala é exponencial: granularidade fina na faixa lenta', () => {
    // Passos baixos diferem pouco entre si (bom pra ajuste fino lento)
    expect(sliderToPx(2) - sliderToPx(1)).toBeLessThan(2);
    expect(sliderToPx(3) - sliderToPx(2)).toBeLessThan(2);
    // ...e a faixa lenta (3-15 px/s) ocupa vários passos
    const slowSteps = Array.from({ length: 30 }, (_, i) => i + 1).filter(
      (s) => sliderToPx(s) < 15
    ).length;
    expect(slowSteps).toBeGreaterThanOrEqual(8);
    // Monotônica
    for (let s = 1; s < 30; s++) {
      expect(sliderToPx(s + 1)).toBeGreaterThan(sliderToPx(s));
    }
  });
});

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

  it('toggle inicia no último nível usado e pausa', () => {
    const target = makeTarget();
    render(<Autoscroll targetRef={{ current: target as unknown as HTMLElement }} />);
    const btn = screen.getByRole('button', { name: /auto-scroll/i });
    const slider = screen.getByRole('slider');

    expect(slider).toHaveValue('0');
    fireEvent.click(btn); // inicia
    expect(slider).toHaveValue('8'); // último nível padrão
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    drainRaf();

    fireEvent.click(btn); // pausa
    expect(slider).toHaveValue('0');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('arrastar o slider para 0 pausa; para >0 inicia', () => {
    const target = makeTarget();
    render(<Autoscroll targetRef={{ current: target as unknown as HTMLElement }} />);
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '12' } });
    expect(rafQueue.length).toBeGreaterThan(0);
    drainRaf();

    fireEvent.change(slider, { target: { value: '0' } });
    expect(screen.getByRole('button', { name: /auto-scroll/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('sem bpm: avança sliderToPx(passo) px/s', () => {
    const target = makeTarget();
    render(<Autoscroll targetRef={{ current: target as unknown as HTMLElement }} />);

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '10' } });
    drainRaf();

    act(() => {
      runFrame(16); // 1º frame: só inicializa o relógio
    });
    expect(target.scrollTop).toBe(0);

    act(() => {
      runFrame(1016); // 1s depois
    });
    const expected = sliderToPx(10);
    expect(target.scrollTop).toBeCloseTo(expected, 1);
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuenow',
      String(Math.round((expected / 800) * 100))
    );
  });

  it('modo BPM: escala por bpm/120 (bpm=240 dobra a velocidade)', () => {
    const target = makeTarget();
    render(
      <Autoscroll
        targetRef={{ current: target as unknown as HTMLElement }}
        bpm={240}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '10' } });
    drainRaf();

    act(() => {
      runFrame(16);
      runFrame(1016);
    });
    expect(target.scrollTop).toBeCloseTo(sliderToPx(10) * 2, 1);
  });

  it('mostra a velocidade atual em px/s e "parado" quando desligado', () => {
    const target = makeTarget();
    render(<Autoscroll targetRef={{ current: target as unknown as HTMLElement }} />);
    const slider = screen.getByRole('slider');

    expect(screen.getByText('parado')).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: '10' } });
    expect(screen.getByText(`${Math.round(sliderToPx(10))} px/s`)).toBeInTheDocument();
  });
});

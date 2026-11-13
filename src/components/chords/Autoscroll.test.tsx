// @vitest-environment jsdom
/**
 * Cobertura — Autoscroll (slider contínuo)
 * px/s = sliderToPx(passo); com bpm, escala por bpm/120 (a 120 BPM o valor
 * do slider vale exatamente). O rAF é mockado para controlar timestamps.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Autoscroll, sliderToPx, sliderToPxPerBeat, MIN_PX, MAX_PX, MIN_PX_PER_BEAT, MAX_PX_PER_BEAT } from './Autoscroll';

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

describe('sliderToPxPerBeat', () => {
  it('passo 0 = desligado; extremos vão de MIN a MAX px/batida', () => {
    expect(sliderToPxPerBeat(0)).toBe(0);
    expect(sliderToPxPerBeat(1)).toBeCloseTo(MIN_PX_PER_BEAT, 5);
    expect(sliderToPxPerBeat(30)).toBeCloseTo(MAX_PX_PER_BEAT, 5);
  });

  it('monotônica', () => {
    for (let s = 1; s < 30; s++) {
      expect(sliderToPxPerBeat(s + 1)).toBeGreaterThan(sliderToPxPerBeat(s));
    }
  });
});

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

  it('modo BPM: px/s = px/batida × bpm/60 — mesmo passo, o dobro do BPM dobra a velocidade', () => {
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
    // bpm=240 → fator 240/60 = 4
    expect(target.scrollTop).toBeCloseTo(sliderToPxPerBeat(10) * 4, 1);
  });

  it('modo BPM: a 60 BPM a metade da velocidade de 120 BPM no mesmo passo', () => {
    const target = makeTarget();
    const { unmount } = render(
      <Autoscroll
        targetRef={{ current: target as unknown as HTMLElement }}
        bpm={120}
      />
    );
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '15' } });
    drainRaf();
    act(() => {
      runFrame(16);
      runFrame(1016);
    });
    const pxAt120 = target.scrollTop;
    unmount();

    rafQueue.length = 0;
    const target2 = makeTarget();
    render(
      <Autoscroll
        targetRef={{ current: target2 as unknown as HTMLElement }}
        bpm={60}
      />
    );
    const slider2 = screen.getByRole('slider');
    fireEvent.change(slider2, { target: { value: '15' } });
    drainRaf();
    act(() => {
      runFrame(16);
      runFrame(1016);
    });
    expect(target2.scrollTop).toBeCloseTo(pxAt120 / 2, 1);
  });

  it('mostra a velocidade atual em px/s e "parado" quando desligado', () => {
    const target = makeTarget();
    render(<Autoscroll targetRef={{ current: target as unknown as HTMLElement }} />);
    const slider = screen.getByRole('slider');

    expect(screen.getByText('parado')).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: '10' } });
    expect(screen.getByText(`${Math.round(sliderToPx(10))} px/s`)).toBeInTheDocument();
  });

  it('com BPM, modo padrão é "por batida" e o badge mostra px/batida', () => {
    const target = makeTarget();
    render(
      <Autoscroll targetRef={{ current: target as unknown as HTMLElement }} bpm={150} />
    );
    const slider = screen.getByRole('slider');

    fireEvent.change(slider, { target: { value: '10' } });
    expect(screen.getByText(`${Math.round(sliderToPxPerBeat(10))} px/bat`)).toBeInTheDocument();
    // E mostra o px/s efetivo considerando o BPM
    expect(screen.getByText(/px\/s efetivo/)).toBeInTheDocument();
  });

  it('seletor alterna entre "px/s" e "por batida" (com BPM)', () => {
    const target = makeTarget();
    render(
      <Autoscroll targetRef={{ current: target as unknown as HTMLElement }} bpm={120} />
    );
    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '10' } });

    // Começa em por-batida; alterna pra px/s fixo
    fireEvent.click(screen.getByRole('button', { name: 'px/s' }));
    expect(screen.getByText(`${Math.round(sliderToPx(10))} px/s`)).toBeInTheDocument();

    // De volta pra por-batida
    fireEvent.click(screen.getByRole('button', { name: 'por batida' }));
    expect(screen.getByText(`${Math.round(sliderToPxPerBeat(10))} px/bat`)).toBeInTheDocument();
  });

  it('sem BPM, o modo "por batida" fica desabilitado', () => {
    const target = makeTarget();
    render(<Autoscroll targetRef={{ current: target as unknown as HTMLElement }} />);
    expect(screen.getByRole('button', { name: 'por batida' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'px/s' })).toBeEnabled();
  });

  it('mudar o BPM da música re-seleciona o modo automaticamente', () => {
    const target = makeTarget();
    const { rerender } = render(
      <Autoscroll targetRef={{ current: target as unknown as HTMLElement }} bpm={90} />
    );
    expect(screen.getByRole('button', { name: 'por batida' })).toHaveAttribute('aria-pressed', 'true');

    rerender(<Autoscroll targetRef={{ current: target as unknown as HTMLElement }} bpm={0} />);
    expect(screen.getByRole('button', { name: 'por batida' })).toHaveAttribute('aria-pressed', 'false');
  });
});

// @vitest-environment jsdom
/**
 * Regressão — Metronome
 * Bug original: play → stop → play não reativava o Tone.Loop.
 * Bug arquitetural: o metrônomo usava o Tone.Transport GLOBAL, compartilhado
 * com o DrumPad — stopPlayback()/handleBpmChange do DrumPad silenciavam ou
 * mudavam o BPM do metrônomo. O Metronome agora agenda pulsos com
 * setInterval + Tone.now() + Tone.Draw, sem tocar no Transport.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mocks = vi.hoisted(() => ({
  triggerAttackRelease: vi.fn(),
  synthDispose: vi.fn(),
  drawSchedule: vi.fn(),
  transportStart: vi.fn(),
  transportStop: vi.fn(),
  transportBpmSet: vi.fn(),
}));

vi.mock('tone', () => {
  class MockMembraneSynth {
    toDestination() {
      return this;
    }
    triggerAttackRelease = mocks.triggerAttackRelease;
    dispose = mocks.synthDispose;
  }
  return {
    MembraneSynth: MockMembraneSynth,
    Draw: { schedule: mocks.drawSchedule },
    Transport: {
      bpm: {
        get value() {
          return 120;
        },
        set value(v: number) {
          mocks.transportBpmSet(v);
        },
      },
      start: mocks.transportStart,
      stop: mocks.transportStop,
    },
    now: () => 0,
    start: vi.fn().mockResolvedValue(undefined),
  };
});

import { Metronome } from './Metronome';

describe('Metronome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('não toca no Tone.Transport global (start/stop/bpm)', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<Metronome />);

    // play → stop → play
    await user.click(screen.getByRole('button', { name: 'Iniciar metrônomo' }));
    await screen.findByRole('button', { name: 'Parar metrônomo' });
    await user.click(screen.getByRole('button', { name: 'Parar metrônomo' }));
    await screen.findByRole('button', { name: 'Iniciar metrônomo' });
    await user.click(screen.getByRole('button', { name: 'Iniciar metrônomo' }));
    await screen.findByRole('button', { name: 'Parar metrônomo' });

    // Ajuste de BPM também não pode vazar pro Transport global
    await user.click(screen.getByRole('button', { name: 'Aumentar BPM' }));

    unmount();

    expect(mocks.transportStart).not.toHaveBeenCalled();
    expect(mocks.transportStop).not.toHaveBeenCalled();
    expect(mocks.transportBpmSet).not.toHaveBeenCalled();
  });

  it('agenda pulsos no intervalo do BPM e para no stop', async () => {
    vi.useFakeTimers();
    render(<Metronome defaultBpm={120} />); // 120 BPM → pulso a cada 500ms

    // Play (togglePlay é async por causa do Tone.start)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Iniciar metrônomo' }));
    });

    const pulsesOnPlay = mocks.triggerAttackRelease.mock.calls.length;
    expect(pulsesOnPlay).toBe(1); // pulso imediato
    expect(mocks.drawSchedule).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1600);
    });
    expect(mocks.triggerAttackRelease.mock.calls.length).toBe(1 + 3); // +500/+1000/+1500

    // Stop: nenhum pulso novo
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Parar metrônomo' }));
    });
    const pulsesOnStop = mocks.triggerAttackRelease.mock.calls.length;
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(mocks.triggerAttackRelease.mock.calls.length).toBe(pulsesOnStop);

    // Play de novo: pulsos voltam (regressão do bug stop→play)
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Iniciar metrônomo' }));
    });
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(mocks.triggerAttackRelease.mock.calls.length).toBeGreaterThan(pulsesOnStop);
  });

  it('± chama onBpmChange (pai persiste o andamento da música)', async () => {
    const user = userEvent.setup();
    const onBpmChange = vi.fn();
    render(<Metronome defaultBpm={120} onBpmChange={onBpmChange} />);

    await user.click(screen.getByRole('button', { name: 'Aumentar BPM' }));
    expect(onBpmChange).toHaveBeenCalledWith(125); // passo de ±5

    await user.click(screen.getByRole('button', { name: 'Diminuir BPM' }));
    expect(onBpmChange).toHaveBeenCalledWith(120);
  });

  it('modo controlado: o pai liga/desliga e o toggle avisa o pai', async () => {
    const user = userEvent.setup();
    const onPlayingChange = vi.fn();
    const { rerender } = render(
      <Metronome defaultBpm={120} playing={false} onPlayingChange={onPlayingChange} />
    );

    // Pai liga → pulso agendado sem clique no componente
    rerender(<Metronome defaultBpm={120} playing={true} onPlayingChange={onPlayingChange} />);
    await screen.findByRole('button', { name: 'Parar metrônomo' });

    // Clique não gerencia sozinho: avisa o pai
    await user.click(screen.getByRole('button', { name: 'Parar metrônomo' }));
    expect(onPlayingChange).toHaveBeenCalledWith(false);
  });

  it('faz dispose do synth no unmount', () => {
    const { unmount } = render(<Metronome />);
    unmount();
    expect(mocks.synthDispose).toHaveBeenCalledTimes(1);
  });
});

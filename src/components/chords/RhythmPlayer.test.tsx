// @vitest-environment jsdom
/**
 * RhythmPlayer — play/stop compacto do ritmo da música na toolbar da cifra.
 * Modo standalone (gerencia o próprio play) e controlado (pai sincroniza
 * com o DrumPad). BPM ao vivo: mudar o andamento recria o intervalo.
 * O ritmo agenda via setInterval (16ths) direto no sampler — não toca no
 * Tone.Transport.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  triggerAttackRelease: vi.fn(),
  setIntervalSpy: vi.fn(),
  clearIntervalSpy: vi.fn(),
}));

vi.mock('tone', () => {
  class MockLimiter {
    toDestination() {
      return this;
    }
    dispose = vi.fn();
  }
  class MockSampler {
    volume = { value: 0 };
    constructor(opts: { onload?: () => void }) {
      opts.onload?.();
    }
    connect() {
      return this;
    }
    triggerAttackRelease = mocks.triggerAttackRelease;
    dispose = vi.fn();
  }
  return {
    Limiter: MockLimiter,
    Sampler: MockSampler,
    Transport: {
      start: vi.fn(),
      stop: vi.fn(),
    },
    start: vi.fn().mockResolvedValue(undefined),
  };
});

// Presets vêm do DrumPad, que importa Tone no topo — mocks globais acima cobrem
import { RhythmPlayer } from './RhythmPlayer';

describe('RhythmPlayer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    );
    vi.stubGlobal('setInterval', mocks.setIntervalSpy.mockReturnValue(1));
    vi.stubGlobal('clearInterval', mocks.clearIntervalSpy);
  });

  it('play toca o preset no BPM da música e alterna para pause', async () => {
    render(<RhythmPlayer groove="rock-8" bpm={150} volume={0.7} />);
    fireEvent.click(screen.getByLabelText('Tocar ritmo da música'));

    // 150 BPM → 16ths = 100ms (waitFor do Testing Library também usa
    // setInterval internamente, por isso a busca por "alguma" chamada certa)
    await waitFor(() =>
      expect(mocks.setIntervalSpy.mock.calls.some(([, ms]) => ms === 100)).toBe(true)
    );
    expect(screen.getByLabelText('Parar ritmo da música')).toBeInTheDocument();
  });

  it('stop limpa o intervalo e volta para play', async () => {
    render(<RhythmPlayer groove="rock-8" bpm={120} volume={0.7} />);
    fireEvent.click(screen.getByLabelText('Tocar ritmo da música'));
    await waitFor(() =>
      expect(mocks.setIntervalSpy.mock.calls.some(([, ms]) => ms === 125)).toBe(true)
    );

    fireEvent.click(screen.getByLabelText('Parar ritmo da música'));
    expect(mocks.clearIntervalSpy).toHaveBeenCalled();
    expect(screen.getByLabelText('Tocar ritmo da música')).toBeInTheDocument();
  });

  it('ritmo do banco usa o BPM da música (não o do padrão)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          { id: 2, nome: 'Funk Groove', bpm: 110, kit: 'kit2', steps: JSON.stringify({ kick: [true, false] }) },
        ],
      })
    );
    render(<RhythmPlayer groove="db-2" bpm={90} volume={0.7} />);
    fireEvent.click(screen.getByLabelText('Tocar ritmo da música'));

    // 90 BPM → 16ths = 166.67ms; o padrão tem BPM 110, mas a música manda
    await waitFor(() => {
      const delays = mocks.setIntervalSpy.mock.calls.map(([, ms]) => ms);
      expect(delays.some(ms => Math.abs(ms - (60 / 90) * 1000 / 4) < 1)).toBe(true);
    });
  });

  it('modo controlado: BPM ao vivo recria o intervalo durante o play', async () => {
    const noop = () => {};
    const { rerender } = render(
      <RhythmPlayer groove="rock-8" bpm={120} volume={0.7} playing={false} onPlayingChange={noop} />
    );
    rerender(<RhythmPlayer groove="rock-8" bpm={120} volume={0.7} playing={true} onPlayingChange={noop} />);
    // 120 BPM → 16ths = 125ms antes do BPM ao vivo entrar
    await waitFor(() =>
      expect(mocks.setIntervalSpy.mock.calls.some(([, ms]) => ms === 125)).toBe(true)
    );

    const before = mocks.setIntervalSpy.mock.calls.length;
    rerender(<RhythmPlayer groove="rock-8" bpm={140} volume={0.7} playing={true} onPlayingChange={noop} />);
    await waitFor(() => expect(mocks.setIntervalSpy.mock.calls.length).toBeGreaterThan(before));
    // 140 BPM → 16ths ≈ 107ms
    expect(mocks.setIntervalSpy.mock.calls.some(([, ms]) => Math.abs(ms - (60 / 140) * 1000 / 4) < 1)).toBe(true);
  });
});

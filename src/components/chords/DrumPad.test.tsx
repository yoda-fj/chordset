// @vitest-environment jsdom
/**
 * Regressão — DrumPad
 * Bug 1: teclas globais (espaço, Q-R/A-G) disparavam mesmo com foco em inputs.
 * Bug 2: BPM vazio/inválido virava NaN e ia direto pro Tone.Transport.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({
  transportStart: vi.fn(),
  transportStop: vi.fn(),
  triggerAttackRelease: vi.fn(),
  bpmParam: { value: 0 },
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
      bpm: mocks.bpmParam,
      start: mocks.transportStart,
      stop: mocks.transportStop,
    },
    start: vi.fn().mockResolvedValue(undefined),
  };
});

import { DrumPad } from './DrumPad';

describe('DrumPad', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.bpmParam.value = 0;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => [] })
    );
  });

  it('ignora espaço e teclas de pad com foco em input', async () => {
    render(<DrumPad />);
    const bpmInput = await screen.findByLabelText('BPM do ritmo');

    fireEvent.keyDown(bpmInput, { key: ' ', code: 'Space' });
    fireEvent.keyDown(bpmInput, { key: 'q' });

    expect(mocks.transportStart).not.toHaveBeenCalled();
    expect(mocks.triggerAttackRelease).not.toHaveBeenCalled();
  });

  it('espaço fora de input alterna play/stop normalmente', async () => {
    render(<DrumPad />);
    await screen.findByLabelText('BPM do ritmo');

    fireEvent.keyDown(document.body, { key: ' ', code: 'Space' });
    await waitFor(() => expect(mocks.transportStart).toHaveBeenCalledTimes(1));
  });

  it('limpar o input de BPM não manda NaN pro Transport (clampa no mínimo)', async () => {
    render(<DrumPad initialBpm={120} />);
    const bpmInput = (await screen.findByLabelText('BPM do ritmo')) as HTMLInputElement;

    fireEvent.change(bpmInput, { target: { value: '' } });

    expect(bpmInput.value).toBe('40');
    expect(mocks.bpmParam.value).toBe(40);
    expect(Number.isFinite(mocks.bpmParam.value)).toBe(true);
  });

  it('BPM acima do teto é clampado em 220', async () => {
    render(<DrumPad initialBpm={120} />);
    const bpmInput = (await screen.findByLabelText('BPM do ritmo')) as HTMLInputElement;

    fireEvent.change(bpmInput, { target: { value: '999' } });

    expect(bpmInput.value).toBe('220');
    expect(mocks.bpmParam.value).toBe(220);
  });

  it('preserva initialBpm na montagem (não aplica o BPM 120 do preset rock-8)', async () => {
    render(<DrumPad initialGroove="rock-8" initialBpm={90} />);
    const bpmInput = (await screen.findByLabelText('BPM do ritmo')) as HTMLInputElement;

    expect(bpmInput.value).toBe('90');
    expect(mocks.bpmParam.value).toBe(0); // nenhum BPM foi forçado no Transport
  });

  it('aplica o BPM do preset ao trocar de groove (handleGrooveChange)', async () => {
    const onBpmChange = vi.fn();
    render(<DrumPad initialGroove="rock-8" initialBpm={90} onBpmChange={onBpmChange} />);
    const select = await screen.findByLabelText('Selecionar ritmo');

    fireEvent.change(select, { target: { value: 'balada' } });

    expect((screen.getByLabelText('BPM do ritmo') as HTMLInputElement).value).toBe('70');
    expect(onBpmChange).toHaveBeenCalledWith(70);
  });
});

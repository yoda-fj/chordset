// @vitest-environment jsdom
/**
 * Regressão — DrumPad
 * Bug 1: teclas globais (espaço, Q-R/A-G) disparavam mesmo com foco em inputs.
 * Bug 2 (histórico): BPM vazio/inválido virava NaN e ia direto pro Tone.Transport.
 *        O input de BPM foi removido do painel — o andamento é da música
 *        (initialBpm) e nunca muda no DrumPad.
 * Modelo atual: o ritmo toca SEMPRE no BPM da música; selecionar um padrão
 * não sobrescreve o andamento (o mesmo ritmo serve pra várias músicas).
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
    const { container } = render(<DrumPad />);
    await screen.findByLabelText('Selecionar ritmo');
    const volumeInput = container.querySelector('input[type="range"]') as HTMLInputElement;

    fireEvent.keyDown(volumeInput, { key: ' ', code: 'Space' });
    fireEvent.keyDown(volumeInput, { key: 'q' });

    expect(mocks.transportStart).not.toHaveBeenCalled();
    expect(mocks.triggerAttackRelease).not.toHaveBeenCalled();
  });

  it('espaço fora de input alterna play/stop normalmente', async () => {
    render(<DrumPad />);
    await screen.findByLabelText('Selecionar ritmo');

    fireEvent.keyDown(document.body, { key: ' ', code: 'Space' });
    await waitFor(() => expect(mocks.transportStart).toHaveBeenCalledTimes(1));
  });

  it('não tem controle de BPM no painel — o andamento é da música', async () => {
    render(<DrumPad initialBpm={90} />);
    await screen.findByLabelText('Selecionar ritmo');

    expect(screen.queryByLabelText('BPM do ritmo')).toBeNull();
    // Nada força o BPM no Transport na montagem
    expect(mocks.bpmParam.value).toBe(0);
  });

  it('trocar de groove não mexe no andamento nem no Transport', async () => {
    const onGrooveChange = vi.fn();
    render(<DrumPad initialGroove="rock-8" initialBpm={90} onGrooveChange={onGrooveChange} />);
    const select = await screen.findByLabelText('Selecionar ritmo');

    fireEvent.change(select, { target: { value: 'balada' } });

    // Preset tem BPM 70, mas quem define é a música: nada é forçado no Transport
    expect(mocks.bpmParam.value).toBe(0);
    expect(onGrooveChange).toHaveBeenCalledWith('balada', null);
  });

  it('selecionar padrão do banco chama onGrooveChange com o id (sem tocar no BPM)', async () => {
    const onGrooveChange = vi.fn();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ id: 2, nome: 'Funk Groove', bpm: 110, kit: 'kit1', steps: '[]' }],
      })
    );
    render(<DrumPad initialBpm={150} onGrooveChange={onGrooveChange} />);
    const select = await screen.findByLabelText('Selecionar ritmo');
    await waitFor(() => expect(select.querySelectorAll('option').length).toBeGreaterThan(6));

    fireEvent.change(select, { target: { value: 'db-2' } });

    expect(mocks.bpmParam.value).toBe(0); // padrão tem BPM 110; a música manda com 150
    expect(onGrooveChange).toHaveBeenCalledWith('db-2', 2);
  });
});

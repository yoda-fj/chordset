// @vitest-environment jsdom
/**
 * Cobertura — useDrumPadSettings
 * (a) valores derivados da música (drum_pattern_id → db-N, groove, defaults)
 * (b) body do save por tipo de groove (db vs preset)
 * (c) debounce de 1s antes do PUT
 * (d) overrides encadeados no mesmo tick não se apagam
 * (e) troca de música usa os valores da nova música
 * (f) flush no unmount salva o que estiver pendente
 * (g) save pendente carrega o id da música-alvo (não da atual)
 *
 * Modelo atual: NÃO há onBpmChange — o BPM é da música (editado no card de
 * /musicas/[id]). O painel só persiste groove e volume.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDrumPadSettings, type DrumPadMusica } from './useDrumPadSettings';

const mkMusica = (id: number, over: Partial<DrumPadMusica> = {}): DrumPadMusica => ({
  id,
  groove: null,
  drum_pattern_id: null,
  bpm: 120,
  volume: 0.7,
  ...over,
});

const fetchMock = vi.fn().mockResolvedValue({ ok: true });

function putBodies() {
  return fetchMock.mock.calls
    .filter(([, opts]) => (opts as RequestInit | undefined)?.method === 'PUT')
    .map(([, opts]) => JSON.parse(String((opts as RequestInit).body)));
}

describe('useDrumPadSettings', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockClear();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  describe('valores derivados da música', () => {
    it('drum_pattern_id=5 deriva groove "db-5"', () => {
      const { result } = renderHook(() =>
        useDrumPadSettings(mkMusica(1, { drum_pattern_id: 5 }))
      );
      expect(result.current.groove).toBe('db-5');
    });

    it('groove salvo "funk-1" é usado como está', () => {
      const { result } = renderHook(() =>
        useDrumPadSettings(mkMusica(1, { groove: 'funk-1' }))
      );
      expect(result.current.groove).toBe('funk-1');
    });

    it('sem groove nem padrão: rock-8, bpm 120, volume 0.7', () => {
      const { result } = renderHook(() => useDrumPadSettings(mkMusica(1)));
      expect(result.current.groove).toBe('rock-8');
      expect(result.current.bpm).toBe(120);
      expect(result.current.volume).toBe(0.7);
    });
  });

  describe('persistência (PUT /api/musicas/[id])', () => {
    it('onGrooveChange com "db-N" agenda save {groove:null, drum_pattern_id:N}', () => {
      const { result } = renderHook(() => useDrumPadSettings(mkMusica(7)));
      act(() => result.current.onGrooveChange('db-5', 5));
      act(() => vi.advanceTimersByTime(1000));

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/musicas/7',
        expect.objectContaining({ method: 'PUT' })
      );
      expect(putBodies()).toContainEqual({ groove: null, drum_pattern_id: 5 });
    });

    it('onGrooveChange com preset agenda save {groove:"<id>", drum_pattern_id:null}', () => {
      const { result } = renderHook(() => useDrumPadSettings(mkMusica(7)));
      act(() => result.current.onGrooveChange('balada', null));
      act(() => vi.advanceTimersByTime(1000));

      expect(putBodies()).toContainEqual({ groove: 'balada', drum_pattern_id: null });
    });

    it('save NÃO dispara antes de 1s e dispara após o debounce', () => {
      const { result } = renderHook(() => useDrumPadSettings(mkMusica(7)));
      act(() => result.current.onVolumeChange(0.4));

      act(() => vi.advanceTimersByTime(999));
      expect(fetchMock).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(1));
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(putBodies()).toContainEqual({ volume: 0.4 });
    });

    it('override encadeado mantém volume E groove (regressão: 2º update não apaga o 1º)', () => {
      const { result } = renderHook(() => useDrumPadSettings(mkMusica(7)));
      // Interações rápidas no painel chamam onVolumeChange + onGrooveChange seguidos
      act(() => {
        result.current.onVolumeChange(0.3);
        result.current.onGrooveChange('db-2', 2);
      });

      expect(result.current.volume).toBe(0.3);
      expect(result.current.groove).toBe('db-2');

      act(() => vi.advanceTimersByTime(1000));
      expect(putBodies()).toContainEqual({ volume: 0.3 });
      expect(putBodies()).toContainEqual({ groove: null, drum_pattern_id: 2 });
    });
  });

  describe('troca de música', () => {
    it('rerender com outra música usa os valores dela', () => {
      const musicaA = mkMusica(1, { groove: 'funk-1', bpm: 110 });
      const musicaB = mkMusica(2, { drum_pattern_id: 3, bpm: 90 });
      const { result, rerender } = renderHook(
        ({ musica }) => useDrumPadSettings(musica),
        { initialProps: { musica: musicaA } }
      );

      expect(result.current.groove).toBe('funk-1');

      rerender({ musica: musicaB });
      expect(result.current.groove).toBe('db-3');
      expect(result.current.bpm).toBe(90);

      // Override da sessão é por música: mexer em B não vaza pra A
      act(() => result.current.onVolumeChange(0.2));
      rerender({ musica: musicaA });
      expect(result.current.volume).toBe(0.7);
    });
  });

  describe('flush de saves pendentes', () => {
    it('desmontar antes do debounce ainda salva, com o id da música certo', () => {
      const { result, unmount } = renderHook(() => useDrumPadSettings(mkMusica(7)));
      act(() => result.current.onVolumeChange(0.3));

      expect(fetchMock).not.toHaveBeenCalled();
      unmount();

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/musicas/7',
        expect.objectContaining({ method: 'PUT' })
      );
      expect(putBodies()).toContainEqual({ volume: 0.3 });
    });

    it('save pendente carrega o id da música-alvo (iniciado em A, dispara depois de trocar pra B)', () => {
      const musicaA = mkMusica(1);
      const musicaB = mkMusica(2);
      const { result, rerender } = renderHook(
        ({ musica }) => useDrumPadSettings(musica),
        { initialProps: { musica: musicaA } }
      );

      act(() => result.current.onVolumeChange(0.9));
      rerender({ musica: musicaB });
      act(() => vi.advanceTimersByTime(1000));

      const urls = fetchMock.mock.calls.map(([url]) => url);
      expect(urls).toEqual(['/api/musicas/1']);
      expect(putBodies()).toContainEqual({ volume: 0.9 });
    });
  });
});

import { describe, it, expect } from 'vitest';
import { stepsToHits, volumeToDb } from './drum-samples';

describe('stepsToHits', () => {
  it('converte formato de array (9 trilhas × 16 passos)', () => {
    const steps = [
      [true, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false], // kick nos passos 0, 4, 12
      [false, false, false, false, false, false, false, false, true, false, false, false, false, false, false, false], // snare no passo 8
    ];
    const hits = stepsToHits(steps);

    expect(hits).toHaveLength(4);
    expect(hits.filter(h => h.note === 'C1')).toHaveLength(3); // kick
    expect(hits.filter(h => h.note === 'D1')).toHaveLength(1); // snare
    expect(hits.find(h => h.note === 'D1')?.time).toBe(4); // passo 8 → time 4
  });

  it('converte formato objeto ({ trilha: passos })', () => {
    const steps = { kick: [true, false, true, false], hihatClosed: [true, true, true, true] };
    const hits = stepsToHits(steps);

    expect(hits.filter(h => h.note === 'C1')).toHaveLength(2);
    expect(hits.filter(h => h.note === 'F#1')).toHaveLength(4);
  });

  it('converte JSON string (formato do banco)', () => {
    const steps = JSON.stringify({ snare: [false, true, false, true] });
    const hits = stepsToHits(steps);

    expect(hits).toHaveLength(2);
    expect(hits.every(h => h.note === 'D1')).toBe(true);
  });

  it('JSON inválido retorna lista vazia sem lançar', () => {
    expect(stepsToHits('{{{não é json')).toEqual([]);
  });

  it('trilha desconhecida no formato objeto é ignorada', () => {
    const hits = stepsToHits({ shaker: [true, true], kick: [true, false] });
    expect(hits.every(h => h.note === 'C1')).toBe(true);
    expect(hits).toHaveLength(1);
  });
});

describe('volumeToDb', () => {
  it('0 silencia (-Infinity)', () => {
    expect(volumeToDb(0)).toBe(-Infinity);
  });

  it('mantém o boost acima de 0', () => {
    expect(volumeToDb(0.5)).toBe(20);
    expect(volumeToDb(1)).toBe(35);
  });
});

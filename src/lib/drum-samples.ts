export interface DrumSampleMap {
  kick: string;
  snare: string;
  hihatClosed: string;
  hihatOpen: string;
  crash: string;
  ride: string;
  tomLow: string;
  tomMid: string;
  tomHigh: string;
}

// PRODUCTION FILE NAMES - Match files from https://github.com/gregharvey/drum-samples
// GSCW Drums Kit 1 Samples
export const DRUM_SAMPLES: Record<string, DrumSampleMap> = {
  kit1: {
    kick: 'Kick-V01-Yamaha-16x16.wav',
    snare: 'SNARE-V01-CustomWorks-6x13.wav',
    hihatClosed: 'HHats-CL-V01-SABIAN-AAX.wav',
    hihatOpen: 'HHats-OP-V01-SABIAN-AAX.wav',
    crash: '14-Crash-V01-SABIAN-14.wav',
    ride: 'Ride-V01-ROBMOR-SABIAN-22.wav',
    tomLow: 'TOM13-V01-StarClassic-13x13.wav',
    tomMid: 'TOM10-V01-StarClassic-10x10.wav',
    tomHigh: 'TOM10-V01-StarClassic-10x10.wav',
  },
  kit2: {
    kick: 'Kick-V02-Yamaha-16x16.wav',
    snare: 'SNARE-V02-CustomWorks-6x13.wav',
    hihatClosed: 'HHats-CL-V02-SABIAN-AAX.wav',
    hihatOpen: 'HHats-OP-V02-SABIAN-AAX.wav',
    crash: '14-Crash-V02-SABIAN-14.wav',
    ride: 'Ride-V02-ROBMOR-SABIAN-22.wav',
    tomLow: 'TOM13-V02-StarClassic-13x13.wav',
    tomMid: 'TOM10-V02-StarClassic-10x10.wav',
    tomHigh: 'TOM10-V02-StarClassic-10x10.wav',
  }
};

// Tone.Sampler note names
// C1=kick, D1=snare, F#1=hihat-closed, A#1=hihat-open, C2=crash, D2=ride, E2=tom-low, F2=tom-mid, G2=tom-high
export function getSamplerUrls(kitName: string = 'kit1'): Record<string, string> {
  const kit = DRUM_SAMPLES[kitName] || DRUM_SAMPLES.kit1;
  return {
    'C1': `/drum-samples/kick/${kit.kick}`,
    'D1': `/drum-samples/snare/${kit.snare}`,
    'F#1': `/drum-samples/hihat-closed/${kit.hihatClosed}`,
    'A#1': `/drum-samples/hihat-closed/${kit.hihatOpen}`,
    'C2': `/drum-samples/crash/${kit.crash}`,
    'D2': `/drum-samples/ride/${kit.ride}`,
    'E2': `/drum-samples/tom/${kit.tomLow}`,
    'F2': `/drum-samples/tom/${kit.tomMid}`,
    'G2': `/drum-samples/tom/${kit.tomHigh}`,
  };
}

// Converte volume linear 0-1 para dB com boost generoso — os samples são gravados
// baixos. 0 → silêncio (-Infinity), 0.5 → +20dB, 1 → +35dB. Usar sempre com um
// Tone.Limiter na cadeia para evitar clipping nos ganhos altos.
export function volumeToDb(volume: number): number {
  if (volume <= 0) return -Infinity
  return (volume * 30) + 5;
}

// Tipo de um "hit" de bateria (um acerto de um instrumento num passo)
export interface DrumHit {
  time: number; // em semicolcheias (16ths)
  note: string;
  velocity?: number;
}

// Notas por trilha (ordem do array de 9 trilhas do banco)
const TRACK_NOTES = ['C1', 'D1', 'F#1', 'A#1', 'C2', 'D2', 'E2', 'F2', 'G2'];
const TRACK_NOTE_MAP: Record<string, string> = {
  kick: 'C1', snare: 'D1', hihatClosed: 'F#1', hihatOpen: 'A#1',
  crash: 'C2', ride: 'D2', tomLow: 'E2', tomMid: 'F2', tomHigh: 'G2',
};

/**
 * Converte os steps de um padrão de bateria (formato do banco) para a lista
 * de hits tocáveis. Aceita JSON string, array de trilhas (9 × 16 passos) ou
 * objeto { trilha: passos }. Compartilhado pelo DrumPad e pelo RhythmPlayer.
 */
export function stepsToHits(steps: string | boolean[][] | Record<string, boolean[]>): DrumHit[] {
  const hits: DrumHit[] = [];
  let stepsData: boolean[][] | Record<string, boolean[]>;
  try {
    stepsData = typeof steps === 'string' ? JSON.parse(steps) : steps;
  } catch {
    console.error('[drum-samples] steps inválidos (JSON parse falhou)');
    return hits;
  }

  if (Array.isArray(stepsData)) {
    stepsData.forEach((track, trackIndex) => {
      const note = TRACK_NOTES[trackIndex];
      if (!note || !Array.isArray(track)) return;
      track.forEach((hit, stepIndex) => {
        if (hit) hits.push({ time: stepIndex / 2, note, velocity: 0.8 });
      });
    });
  } else if (stepsData && typeof stepsData === 'object') {
    Object.entries(stepsData).forEach(([trackName, track]) => {
      const note = TRACK_NOTE_MAP[trackName];
      if (!note || !Array.isArray(track)) return;
      track.forEach((hit, stepIndex) => {
        if (hit) hits.push({ time: stepIndex / 2, note, velocity: 0.8 });
      });
    });
  } else {
    console.error('[drum-samples] formato de steps inválido:', stepsData);
  }
  return hits;
}

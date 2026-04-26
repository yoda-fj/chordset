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

// Samples gratuitos do GSCW Drum Kits (gregharvey/drum-samples)
// Licença: Creative Commons / Gratuito para uso
export const DRUM_SAMPLES: Record<string, DrumSampleMap> = {
  // Kit 1 - Sons acústicos/rock
  kit1: {
    kick: '/samples/drums/kick/V01-EQ-KD.wav',
    snare: '/samples/drums/snare/V01-EQ-SD.wav',
    hihatClosed: '/samples/drums/hihat-closed/V01-Hats-CLD.wav',
    hihatOpen: '/samples/drums/hihat-closed/V01-Hats-OP.wav',
    crash: '/samples/drums/crash/14-Crash-V01-SABIAN-14.wav',
    ride: '/samples/drums/ride/V01-Ride-22.wav',
    tomLow: '/samples/drums/tom/V01-TFlam-12.wav',
    tomMid: '/samples/drums/tom/V01-TFlams-10.wav',
    tomHigh: '/samples/drums/tom/V01-TFlams-13.wav',
  },
  
  // Kit 2 - Variações alternativas
  kit2: {
    kick: '/samples/drums/kick/V02-EQ-KD.wav',
    snare: '/samples/drums/snare/V02-EQ-SD.wav',
    hihatClosed: '/samples/drums/hihat-closed/V02-Hats-CLD.wav',
    hihatOpen: '/samples/drums/hihat-closed/V02-Hats-OP.wav',
    crash: '/samples/drums/crash/V02-crash-14.wav',
    ride: '/samples/drums/ride/V02-Rbell-22.wav',
    tomLow: '/samples/drums/tom/V02-TFlam-12.wav',
    tomMid: '/samples/drums/tom/V02-TFlams-10.wav',
    tomHigh: '/samples/drums/tom/V02-TFlams-13.wav',
  }
};

// Gera um mapeamento para Tone.Sampler
// Notas MIDI: C1=kick, D1=snare, F#1=hihat-closed, A#1=hihat-open, C2=crash, D2=ride, E2=tom-low, F2=tom-mid, G2=tom-high
export function getSamplerUrls(kitName: string = 'kit1'): Record<string, string> {
  const kit = DRUM_SAMPLES[kitName] || DRUM_SAMPLES.kit1;
  return {
    C1: kit.kick,
    D1: kit.snare,
    'F#1': kit.hihatClosed,
    'A#1': kit.hihatOpen,
    C2: kit.crash,
    D2: kit.ride,
    E2: kit.tomLow,
    F2: kit.tomMid,
    G2: kit.tomHigh,
  };
}

// Exemplo de uso com Tone.js:
// const sampler = new Tone.Sampler({
//   urls: getSamplerUrls('kit1'),
//   baseUrl: '',
// }).toDestination();
// 
// sampler.triggerAttackRelease('C1', '8n'); // kick
// sampler.triggerAttackRelease('D1', '8n'); // snare

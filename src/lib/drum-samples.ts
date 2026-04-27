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

// GSCW Drum Kits do gregharvey (organizados por instrumento)
// Host: /opt/chordset/samples/drums/
// Container: /data/samples/drums/ (via volume mount /opt/chordset -> /data)
// Symlink: /app/public/drum-samples -> /data/samples/drums
// URL: /drum-samples/... (via Next.js static file serving)
// Arquivos reais em public/samples/drums/

export const DRUM_SAMPLES: Record<string, DrumSampleMap> = {
  kit1: {
    // kick - usar V01 que é o mais comum
    kick: '/drum-samples/kick/V01-EQ-KD.wav',
    // snare - usar V01-EQ-SD que é o padrão
    snare: '/drum-samples/snare/V01-EQ-SD.wav',
    // hihat closed - primeiro arquivo HHats-CL
    hihatClosed: '/drum-samples/hihat-closed/HHats-CL-V01-SABIAN-AAX.wav',
    // hihat open - HHats-OP
    hihatOpen: '/drum-samples/hihat-closed/HHats-OP-V01-SABIAN-AAX.wav',
    // crash - primeiro crash de 14"
    crash: '/drum-samples/crash/14-Crash-V01-SABIAN-14.wav',
    // ride - primeiro ride
    ride: '/drum-samples/ride/Ride-V01-ROBMOR-SABIAN-22.wav',
    // tom low - 13"汤姆
    tomLow: '/drum-samples/tom/V01-TTom13.wav',
    // tom mid - 10"汤姆
    tomMid: '/drum-samples/tom/V01-TTom 10.wav',
    // tom high - mesmo 10" (sem separate high)
    tomHigh: '/drum-samples/tom/V01-TTom 10.wav',
  },
  kit2: {
    kick: '/drum-samples/kick/V02-EQ-KD.wav',
    snare: '/drum-samples/snare/V02-EQ-SD.wav',
    hihatClosed: '/drum-samples/hihat-closed/HHats-CL-V02-SABIAN-AAX.wav',
    hihatOpen: '/drum-samples/hihat-closed/HHats-OP-V02-SABIAN-AAX.wav',
    crash: '/drum-samples/crash/14-Crash-V02-SABIAN-14.wav',
    ride: '/drum-samples/ride/Ride-V02-ROBMOR-SABIAN-22.wav',
    tomLow: '/drum-samples/tom/V02-TTom13.wav',
    tomMid: '/drum-samples/tom/V02-TTom 10.wav',
    tomHigh: '/drum-samples/tom/V02-TTom 10.wav',
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
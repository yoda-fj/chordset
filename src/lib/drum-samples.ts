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
// Symlink: /app/public/samples/drums -> /data/samples/drums
// URL: /samples/drums/... (via Next.js static file serving)
export const DRUM_SAMPLES: Record<string, DrumSampleMap> = {
  kit1: {
    kick: '/samples/drums/kick/Kick-V01-Yamaha-16x16.wav',
    snare: '/samples/drums/snare/SNARE-V01-CustomWorks-6x13.wav',
    hihatClosed: '/samples/drums/hihat-closed/HHats-CL-V01-SABIAN-AAX.wav',
    hihatOpen: '/samples/drums/hihat-closed/HHats-OP-V01-SABIAN-AAX.wav',
    crash: '/samples/drums/crash/14-Crash-V01-SABIAN-14.wav',
    ride: '/samples/drums/ride/Ride-V01-ROBMOR-SABIAN-22.wav',
    tomLow: '/samples/drums/tom/TOM13-V01-StarClassic-13x13.wav',
    tomMid: '/samples/drums/tom/TOM10-V01-StarClassic-10x10.wav',
    tomHigh: '/samples/drums/tom/TOM10-V03-StarClassic-10x10.wav',
  },
  kit2: {
    kick: '/samples/drums/kick/Kick-V02-Yamaha-16x16.wav',
    snare: '/samples/drums/snare/SNARE-V02-CustomWorks-6x13.wav',
    hihatClosed: '/samples/drums/hihat-closed/HHats-CL-V02-SABIAN-AAX.wav',
    hihatOpen: '/samples/drums/hihat-closed/HHats-OP-V02-SABIAN-AAX.wav',
    crash: '/samples/drums/crash/14-Crash-V02-SABIAN-14.wav',
    ride: '/samples/drums/ride/Ride-V02-ROBMOR-SABIAN-22.wav',
    tomLow: '/samples/drums/tom/TOM13-V02-StarClassic-13x13.wav',
    tomMid: '/samples/drums/tom/TOM10-V02-StarClassic-10x10.wav',
    tomHigh: '/samples/drums/tom/TOM10-V04-StarClassic-10x10.wav',
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

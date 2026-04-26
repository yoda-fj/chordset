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
// Lokação: /opt/chordset/samples/drums/ (host)
// No container: /data/samples/drums/
// Kick: Kick-V01 a V12 (Yamaha)
// Snare: SNARE-V01 a V20 (CustomWorks)
// Hihat: HHats-CL (closed), HHats-OP (open), HHats-PDL, HHats-Crash
// Crash: 14-Crash-*, 18-Crash-*, HHats-Crash-*
// Ride: Ride-V01 a V08
// Tom: TOM10-*, TOM13-*
export const DRUM_SAMPLES: Record<string, DrumSampleMap> = {
  kit1: {
    kick: '/data/samples/drums/kick/Kick-V01-Yamaha-16x16.wav',
    snare: '/data/samples/drums/snare/SNARE-V01-CustomWorks-6x13.wav',
    hihatClosed: '/data/samples/drums/hihat-closed/HHats-CL-V01-SABIAN-AAX.wav',
    hihatOpen: '/data/samples/drums/hihat-closed/HHats-OP-V01-SABIAN-AAX.wav',
    crash: '/data/samples/drums/crash/14-Crash-V01-SABIAN-14.wav',
    ride: '/data/samples/drums/ride/Ride-V01-ROBMOR-SABIAN-22.wav',
    tomLow: '/data/samples/drums/tom/TOM13-V01-StarClassic-13x13.wav',
    tomMid: '/data/samples/drums/tom/TOM10-V01-StarClassic-10x10.wav',
    tomHigh: '/data/samples/drums/tom/TOM10-V03-StarClassic-10x10.wav',
  },
  kit2: {
    kick: '/data/samples/drums/kick/Kick-V02-Yamaha-16x16.wav',
    snare: '/data/samples/drums/snare/SNARE-V02-CustomWorks-6x13.wav',
    hihatClosed: '/data/samples/drums/hihat-closed/HHats-CL-V02-SABIAN-AAX.wav',
    hihatOpen: '/data/samples/drums/hihat-closed/HHats-OP-V02-SABIAN-AAX.wav',
    crash: '/data/samples/drums/crash/14-Crash-V02-SABIAN-14.wav',
    ride: '/data/samples/drums/ride/Ride-V02-ROBMOR-SABIAN-22.wav',
    tomLow: '/data/samples/drums/tom/TOM13-V02-StarClassic-13x13.wav',
    tomMid: '/data/samples/drums/tom/TOM10-V02-StarClassic-10x10.wav',
    tomHigh: '/data/samples/drums/tom/TOM10-V04-StarClassic-10x10.wav',
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

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

// Direct sample paths for Tone.Player
export function getSamplePaths(kitName: string = 'kit1'): Record<string, string> {
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
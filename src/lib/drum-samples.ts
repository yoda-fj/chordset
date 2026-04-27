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

// GSCW Drum Kits - Names must match actual files in public/samples/drums/
// VERIFY FILES BEFORE UPDATING - Use /api/debug/samples to check production
export const DRUM_SAMPLES: Record<string, DrumSampleMap> = {
  kit1: {
    kick: 'V01-EQ-KD.wav',
    snare: 'V01-EQ-SD.wav',
    hihatClosed: 'HHats-CL-V01-SABIAN-AAX.wav',
    hihatOpen: 'HHats-OP-V01-SABIAN-AAX.wav',
    crash: '14-Crash-V01-SABIAN-14.wav',
    ride: 'Ride-V01-ROBMOR-SABIAN-22.wav',
    tomLow: 'V01-TTom13.wav',
    tomMid: 'V01-TTom-12.wav',
    tomHigh: 'V01-TTom13.wav',
  },
  kit2: {
    kick: 'V02-EQ-KD.wav',
    snare: 'V02-EQ-SD.wav',
    hihatClosed: 'HHats-CL-V02-SABIAN-AAX.wav',
    hihatOpen: 'HHats-OP-V02-SABIAN-AAX.wav',
    crash: '14-Crash-V02-SABIAN-14.wav',
    ride: 'Ride-V02-ROBMOR-SABIAN-22.wav',
    tomLow: 'V02-TTom13.wav',
    tomMid: 'V02-TTom 10.wav',
    tomHigh: 'V02-TTom 10.wav',
  }
};

// Map to Tone.Sampler note names
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

// Also export path map for Tone.Player (direct file URLs)
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
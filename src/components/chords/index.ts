export { ChordViewer } from './ChordViewer';
export { Autoscroll } from './Autoscroll';
export { CifraViewer } from './CifraViewer';
// DrumPad e Metronome NÃO são re-exportados aqui de propósito (2.7):
// importá-los do barrel puxaria Tone.js (~243kB) pro bundle de qualquer
// página. Usar next/dynamic com ssr:false no ponto de uso.

declare module 'vexchords' {
  interface ChordDiagramOptions {
    width?: number;
    height?: number;
    stringWidth?: number;
    fretWidth?: number;
    circleRadius?: number;
    numFrets?: number;
    showTuning?: boolean;
    positionTextSize?: number;
    nutSize?: number;
    position?: number;
  }

  type ChordPosition = [number, number | string, number?];

  export function draw(
    container: HTMLElement,
    chord: ChordPosition[],
    options?: ChordDiagramOptions
  ): void;
}

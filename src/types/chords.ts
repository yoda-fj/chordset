export interface ChordChart {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChordData {
  name: string;
  notes: string[];
  intervals: string[];
}

export type Instrument = 'guitar' | 'ukulele' | 'piano';

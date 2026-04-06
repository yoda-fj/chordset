import { useState, useCallback } from 'react';

export const useTranspose = (initialKey: string = 'C') => {
  const [originalKey, setOriginalKey] = useState(initialKey);
  const [currentKey, setCurrentKey] = useState(initialKey);
  const [semitones, setSemitones] = useState(0);

  const transpose = useCallback((delta: number) => {
    const newSemitones = semitones + delta;
    setSemitones(newSemitones);
    // Calculate new key based on semitones
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const currentIndex = notes.indexOf(originalKey.replace('b', '#'));
    const newIndex = (currentIndex + newSemitones + 12) % 12;
    setCurrentKey(notes[newIndex]);
  }, [semitones, originalKey]);

  const resetTranspose = useCallback(() => {
    setSemitones(0);
    setCurrentKey(originalKey);
  }, [originalKey]);

  return {
    originalKey,
    currentKey,
    semitones,
    transpose,
    resetTranspose,
    setOriginalKey
  };
};

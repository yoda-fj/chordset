import { describe, it, expect } from 'vitest'
import { detectKeyFromCifra } from './key-detector'

// Acordes reais das cifras usadas na verificação do importador
const OUVI_SENHOR = [
  'D                A         G        A',
  'OUVI, SENHOR, AS PRECES DO VOSSO SERVO ',
  '     G           A     A7',
  'E DO VOSSO POVO ELEITO:',
  'D          A            G        A',
  'DAI A PAZ ÀQUELES QUE ESPERAM EM VÓS, ',
  '     G                A     G     A    D',
  'PARA QUE OS VOSSOS PROFETAS SEJAM VERDADEIROS.',
].join('\n')

const A_BARCA = [
  'INTRO: Eb G# Eb Bb',
  '',
  '   Eb Bº               Cm   Cm/A#',
  'TU, TE ABEIRASTE DA PRAIA',
  '       G#   Fm               Bb7',
  'NÃO BUSCASTE  NEM SÁBIOS NEM RICOS,',
  '        Eb    Bb7          Eb   Eb7',
  'SOMENTE QUERES  QUE EU TE SIGA!',
  '  G#   Bb      Eb  A#/D Cm',
  'LÁ NA PRAIA,  EU LARGUEI O MEU BARCO,',
  '        Fm Bb               Eb',
  'JUNTO A TI   BUSCAREI OUTRO MAR.',
].join('\n')

describe('detectKeyFromCifra', () => {
  it('detecta tom maior a partir dos acordes (D)', () => {
    expect(detectKeyFromCifra(OUVI_SENHOR)).toBe('D')
  })

  it('detecta tom com bemol e preserva notação bemol (Eb)', () => {
    expect(detectKeyFromCifra(A_BARCA)).toBe('Eb')
  })

  it('detecta tom menor (Am) com V da menor harmônica', () => {
    const am = [
      'Am       Dm      E',
      'A MINHA ALMA TEM SEDE',
      'Dm       E        Am',
      'DE TI, SENHOR',
    ].join('\n')
    expect(detectKeyFromCifra(am)).toBe('Am')
  })

  it('desempata relativo maior/menor pelo 1º e último acorde', () => {
    // C e Am compartilham o mesmo campo harmônico; começa e termina em C
    const c = [
      'C        G      Am      F',
      'COMEÇA E TERMINA EM DÓ MAIOR',
      'F        G      C',
      'DE NOVO EM DÓ',
    ].join('\n')
    expect(detectKeyFromCifra(c)).toBe('C')
  })

  it('música que começa fora da tônica ainda detecta o tom', () => {
    // Começa em G (IV) mas o tom é D
    const d = [
      'G        A',
      'COMEÇA NO QUARTO GRAU',
      'D        G        A        D',
      'RESOLVE NA TÔNICA',
    ].join('\n')
    expect(detectKeyFromCifra(d)).toBe('D')
  })

  it('retorna null sem acordes', () => {
    expect(detectKeyFromCifra('SÓ LETRA SEM ACORDE NENHUM')).toBe(null)
  })
})

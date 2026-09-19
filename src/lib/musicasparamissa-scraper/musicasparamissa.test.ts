import { describe, it, expect } from 'vitest'
import { parseTitleArtist, extractCifraLines } from './musicasparamissa'

describe('parseTitleArtist', () => {
  it('separa título e artista no formato "TITULO - (Artista)"', () => {
    expect(parseTitleArtist('OUVI, SENHOR, AS PRECES DO VOSSO SERVO - (Ruzye)')).toEqual({
      name: 'OUVI, SENHOR, AS PRECES DO VOSSO SERVO',
      artist: 'Ruzye',
    })
  })

  it('separa título e artista no formato "TITULO (Artista)"', () => {
    expect(parseTitleArtist('A BARCA (Padre Zezinho)')).toEqual({
      name: 'A BARCA',
      artist: 'Padre Zezinho',
    })
  })

  it('sem parênteses, título inteiro e artista vazio', () => {
    expect(parseTitleArtist('SÓ O AMOR')).toEqual({ name: 'SÓ O AMOR', artist: '' })
  })

  it('mantém parênteses que fazem parte do título', () => {
    expect(parseTitleArtist('CANTAI AO SENHOR (ALELUIA) - (M.G.)')).toEqual({
      name: 'CANTAI AO SENHOR (ALELUIA)',
      artist: 'M.G.',
    })
  })
})

describe('extractCifraLines', () => {
  it('remove tags preservando alinhamento dos acordes e linhas em branco internas', () => {
    const preHtml = `
              
<b>D                A         G        A</b>
<STRONG>OUVI, SENHOR, AS PRECES DO VOSSO SERVO 
<b>     G           A     A7</b>
E DO VOSSO POVO ELEITO:</STRONG>

<b>   D                                  A</b>
1. QUE ALEGRIA, QUANDO OUVI QUE ME DISSERAM: 
`

    expect(extractCifraLines(preHtml)).toEqual([
      'D                A         G        A',
      'OUVI, SENHOR, AS PRECES DO VOSSO SERVO ',
      '     G           A     A7',
      'E DO VOSSO POVO ELEITO:',
      '',
      '   D                                  A',
      '1. QUE ALEGRIA, QUANDO OUVI QUE ME DISSERAM: ',
    ])
  })

  it('converte <br> em quebra de linha', () => {
    const preHtml = '<b>Eb G# Eb Bb</b><br>INTRO<br/><b>   Eb Bº</b>'
    expect(extractCifraLines(preHtml)).toEqual(['Eb G# Eb Bb', 'INTRO', '   Eb Bº'])
  })

  it('descarta versões extras em outros tons (separador de pontos + TOM:)', () => {
    const preHtml = [
      '<b>   Eb Bº</b>',
      'TU, TE ABEIRASTE DA PRAIA',
      '',
      '',
      '....................',
      '',
      'TOM: A',
      'INTRO: C#  F#m',
      '<b> E</b>',
      'JUNTEI A MINHA GALERA',
    ].join('\n')
    expect(extractCifraLines(preHtml)).toEqual(['   Eb Bº', 'TU, TE ABEIRASTE DA PRAIA'])
  })

  it('mantém linha TOM: quando é cabeçalho da própria versão (sem separador)', () => {
    const preHtml = 'TOM: Eb\n<b>   Eb Bº</b>\nTU, TE ABEIRASTE DA PRAIA'
    expect(extractCifraLines(preHtml)).toEqual(['TOM: Eb', '   Eb Bº', 'TU, TE ABEIRASTE DA PRAIA'])
  })

  it('retorna vazio para pre sem conteúdo', () => {
    expect(extractCifraLines('   \n  \n')).toEqual([])
  })
})

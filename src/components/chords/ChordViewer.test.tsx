// @vitest-environment jsdom
/**
 * 2.6 — Testes de componente: ChordViewer
 * Cobre: render empilhado acorde/sílaba (alinhamento estrutural),
 * zoom (fontSize), seções, tablatura on/off.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChordViewer } from './ChordViewer';

const CHORDPRO = `{verse}
Eu [Am]sei que [G]vou te amar
[F]Por toda a minha [E]vida`;

describe('ChordViewer', () => {
  it('renderiza título e artista', () => {
    render(<ChordViewer chordProContent={CHORDPRO} title="As Dores" artist="Jota Quest" />);
    expect(screen.getByText('As Dores')).toBeInTheDocument();
    expect(screen.getByText('Jota Quest')).toBeInTheDocument();
  });

  it('empilha acorde sobre a sílaba na MESMA coluna (alinhamento estrutural)', () => {
    const { container } = render(<ChordViewer chordProContent="Eu [Am]sei que [G]vou" />);

    // Cada segmento é um inline-flex flex-col com [acorde, letra] empilhados.
    // Como vivem na mesma coluna, o zoom nunca desalinha (sem medida em px).
    const segmentos = container.querySelectorAll('.chord-line .inline-flex.flex-col');
    expect(segmentos.length).toBe(3); // "Eu " (sem acorde) + Am + G

    const segAm = segmentos[1];
    const [chordSpan, lyricSpan] = segAm.querySelectorAll(':scope > span');
    expect(chordSpan.textContent).toBe('Am');
    expect(lyricSpan.textContent).toBe('sei que ');
    // Acorde com peso 700 e cor chord (2.2)
    expect(chordSpan.className).toContain('font-bold');
    expect(chordSpan.className).toContain('text-chord');
  });

  it('aplica o fontSize no chord-sheet (zoom 20→64 escala acorde+letra juntos)', () => {
    const { container, rerender } = render(
      <ChordViewer chordProContent={CHORDPRO} fontSize={24} />
    );
    const sheet = container.querySelector('.chord-sheet') as HTMLElement;
    expect(sheet.style.fontSize).toBe('24px');

    rerender(<ChordViewer chordProContent={CHORDPRO} fontSize={64} />);
    expect(sheet.style.fontSize).toBe('64px');
  });

  it('renderiza seção em destaque', () => {
    render(<ChordViewer chordProContent={CHORDPRO} />);
    expect(screen.getByText('VERSE')).toBeInTheDocument();
  });

  it('respeita showTablatura=false', () => {
    const comTab = `[E]
e|--0--0--|`;
    const { container } = render(
      <ChordViewer chordProContent={comTab} showTablatura={false} />
    );
    expect(container.querySelector('.tab-line')).toBeNull();
  });

  it('tablatura tem scroll horizontal próprio e fonte reduzida (mobile)', () => {
    const comTab = `[E]
e|--0--0--0--0--0--0--0--0--0--0--0--0--|`;
    const { container } = render(<ChordViewer chordProContent={comTab} />);
    const pre = container.querySelector('.tab-line') as HTMLElement;
    // Wrapper com overflow-x-auto (pan-x) — a página é pan-y, a tab rola por dentro
    expect(pre.parentElement?.className).toContain('overflow-x-auto');
    expect(pre.className).toContain('w-max');
    expect(pre.className).toContain('text-[0.6em]');
  });

  it('renderiza formato texto (acordes espaçados acima da letra)', () => {
    // isTextChordFormat exige ≥2 pares acorde+letra pra detectar o formato
    const texto = [
      'Am' + 'G'.padStart(18),
      'Eu sei que vou te amar',
      'D' + 'Em'.padStart(11),
      'Por toda a minha vida',
    ].join('\n');
    const { container } = render(<ChordViewer chordProContent={texto} />);
    const chords = [...container.querySelectorAll('.chord-line .text-chord')].map(
      (el) => el.textContent
    );
    expect(chords).toContain('Am');
    expect(chords).toContain('G');
  });
});

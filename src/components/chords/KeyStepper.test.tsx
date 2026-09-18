// @vitest-environment jsdom
/**
 * Regressão — KeyStepper
 * Bug: tons em bemol (Bb, Eb...) não constam em getAllKeys() (só sustenidos),
 * então indexOf retornava -1 e o primeiro step pulava a partir de C.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyStepper } from './KeyStepper';

describe('KeyStepper com tom em bemol', () => {
  it('Bb +1 semitom → B (e não C#)', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<KeyStepper value="Bb" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Subir meio tom' }));
    expect(onChange).toHaveBeenCalledWith('B');
  });

  it('Bb −1 semitom → A', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<KeyStepper value="Bb" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Baixar meio tom' }));
    expect(onChange).toHaveBeenCalledWith('A');
  });

  it('Eb +1 → E, Eb −1 → D', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<KeyStepper value="Eb" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Subir meio tom' }));
    expect(onChange).toHaveBeenCalledWith('E');

    onChange.mockClear();
    await user.click(screen.getByRole('button', { name: 'Baixar meio tom' }));
    expect(onChange).toHaveBeenCalledWith('D');
  });

  it('exibe o tom original em bemol até o primeiro step', () => {
    render(<KeyStepper value="Bb" onChange={vi.fn()} />);
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Tom atual: Bb');
  });
});

// @vitest-environment jsdom
/**
 * ThemeToggle — alternância claro/escuro via next-themes.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const { mockSetTheme, mockResolvedTheme } = vi.hoisted(() => ({
  mockSetTheme: vi.fn(),
  mockResolvedTheme: { value: 'dark' },
}));

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme.value, setTheme: mockSetTheme }),
}));

import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolvedTheme.value = 'dark';
  });

  it('exibe rótulo de acessibilidade em português', () => {
    render(<ThemeToggle />);
    expect(
      screen.getByRole('button', { name: 'Alternar tema claro/escuro' })
    ).toBeTruthy();
  });

  it('no tema escuro, alterna para claro', async () => {
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Alternar tema claro/escuro' }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('no tema claro, alterna para escuro', async () => {
    mockResolvedTheme.value = 'light';
    const user = userEvent.setup();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Alternar tema claro/escuro' }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
});

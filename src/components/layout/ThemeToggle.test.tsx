import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { initTheme, THEME_STORAGE_KEY } from '@/lib/theme';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle', () => {
  it('alterna entre tema claro y oscuro y persiste la elección', async () => {
    const user = userEvent.setup();
    initTheme();
    render(<ThemeToggle />);

    await user.click(screen.getByRole('button', { name: 'Cambiar a tema oscuro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    await user.click(screen.getByRole('button', { name: 'Cambiar a tema claro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('refleja el tema inicial guardado en la etiqueta accesible', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    initTheme();
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: 'Cambiar a tema claro' })).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LANGUAGE_STORAGE_KEY } from '@/i18n';
import { LanguageSelector } from './LanguageSelector';

describe('LanguageSelector', () => {
  it('marca el idioma activo con aria-pressed', () => {
    render(<LanguageSelector />);
    expect(screen.getByRole('button', { name: 'ES, Español' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'EN, English' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('cambia el idioma, actualiza <html lang> y persiste la preferencia', async () => {
    const user = userEvent.setup();
    render(<LanguageSelector />);

    await user.click(screen.getByRole('button', { name: 'EN, English' }));

    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
    expect(screen.getByRole('group', { name: 'Language' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'EN, English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );

    await user.click(screen.getByRole('button', { name: 'ES, Español' }));
    expect(document.documentElement).toHaveAttribute('lang', 'es');
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('es');
  });
});

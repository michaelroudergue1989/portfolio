import '@testing-library/jest-dom/vitest';
import i18n from '@/i18n';
import { mockMatchMedia } from './matchMedia';

// Estado limpio y determinista antes de cada prueba: español, tema sin definir, sin preferencias.
beforeEach(async () => {
  mockMatchMedia(false);
  window.localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
  await i18n.changeLanguage('es');
});

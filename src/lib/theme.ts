import { readStorage, writeStorage } from '@/lib/storage';

export const THEMES = ['light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

/** Debe coincidir con public/theme-init.js. */
export const THEME_STORAGE_KEY = 'portfolio-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';
const listeners = new Set<() => void>();
let watchingSystem = false;

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

function getStoredTheme(): Theme | null {
  const stored = readStorage(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : null;
}

function getSystemTheme(): Theme {
  return window.matchMedia(DARK_QUERY).matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  listeners.forEach((listener) => {
    listener();
  });
}

/** Tema vigente según el atributo `data-theme` del documento. */
export function getTheme(): Theme {
  const current = document.documentElement.dataset.theme;
  return isTheme(current) ? current : 'light';
}

export function subscribeTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Aplica la preferencia guardada o, si no existe, la del sistema.
 * Mientras el usuario no elija explícitamente, sigue los cambios del sistema.
 */
export function initTheme(): void {
  applyTheme(getStoredTheme() ?? getSystemTheme());
  if (watchingSystem) return;
  watchingSystem = true;
  window.matchMedia(DARK_QUERY).addEventListener('change', (event) => {
    if (getStoredTheme() === null) applyTheme(event.matches ? 'dark' : 'light');
  });
}

/** Aplica y persiste la elección explícita del usuario. */
export function setTheme(theme: Theme): void {
  writeStorage(THEME_STORAGE_KEY, theme);
  applyTheme(theme);
}

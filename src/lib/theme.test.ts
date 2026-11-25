import { mockMatchMedia } from '@/test/matchMedia';
import { getTheme, initTheme, setTheme, THEME_STORAGE_KEY } from './theme';

describe('tema', () => {
  it('usa el tema claro del sistema si no hay preferencia guardada', () => {
    mockMatchMedia(false);
    initTheme();
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('usa el tema oscuro del sistema si no hay preferencia guardada', () => {
    mockMatchMedia(true);
    initTheme();
    expect(getTheme()).toBe('dark');
  });

  it('la preferencia guardada prevalece sobre la del sistema', () => {
    mockMatchMedia(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'light');
    initTheme();
    expect(getTheme()).toBe('light');
  });

  it('ignora valores guardados inválidos', () => {
    mockMatchMedia(true);
    window.localStorage.setItem(THEME_STORAGE_KEY, 'neon');
    initTheme();
    expect(getTheme()).toBe('dark');
  });

  it('setTheme aplica y persiste la elección', () => {
    setTheme('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });
});

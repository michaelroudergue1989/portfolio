import en from './locales/en.json';
import es from './locales/es.json';
import { detectInitialLanguage, LANGUAGE_STORAGE_KEY } from './index';

function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return [prefix];
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe('i18n', () => {
  it('es y en tienen exactamente las mismas claves', () => {
    expect(flattenKeys(en).sort()).toEqual(flattenKeys(es).sort());
  });

  it('no hay traducciones vacías', () => {
    for (const locale of [es, en]) {
      const values = JSON.stringify(locale).match(/:\s*""/g);
      expect(values).toBeNull();
    }
  });

  describe('detectInitialLanguage', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('prioriza la preferencia guardada', () => {
      vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('en-US');
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'es');
      expect(detectInitialLanguage()).toBe('es');
    });

    it('usa inglés si el navegador está en inglés y no hay preferencia', () => {
      vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('en-GB');
      expect(detectInitialLanguage()).toBe('en');
    });

    it('usa español por defecto para otros idiomas', () => {
      vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('fr-FR');
      expect(detectInitialLanguage()).toBe('es');
    });

    it('ignora valores guardados inválidos', () => {
      vi.spyOn(window.navigator, 'language', 'get').mockReturnValue('es-CL');
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, 'fr');
      expect(detectInitialLanguage()).toBe('es');
    });
  });
});

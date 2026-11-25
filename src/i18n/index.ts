import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { readStorage } from '@/lib/storage';
import en from './locales/en.json';
import es from './locales/es.json';

export const SUPPORTED_LANGUAGES = ['es', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'es';
export const LANGUAGE_STORAGE_KEY = 'portfolio-lang';

export function isLanguage(value: unknown): value is Language {
  return value === 'es' || value === 'en';
}

/** Preferencia guardada > idioma del navegador (en/es) > español. */
export function detectInitialLanguage(): Language {
  const stored = readStorage(LANGUAGE_STORAGE_KEY);
  if (isLanguage(stored)) return stored;
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : DEFAULT_LANGUAGE;
}

const initialLanguage = detectInitialLanguage();

void i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: SUPPORTED_LANGUAGES,
  interpolation: { escapeValue: false }, // React ya escapa el contenido
});

// Mantiene el atributo lang del documento sincronizado con el idioma activo.
document.documentElement.lang = initialLanguage;
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
});

export default i18n;

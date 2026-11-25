import { useTranslation } from 'react-i18next';
import { DEFAULT_LANGUAGE, isLanguage, LANGUAGE_STORAGE_KEY, type Language } from '@/i18n';
import { writeStorage } from '@/lib/storage';

export function useLanguage(): { language: Language; setLanguage: (language: Language) => void } {
  const { i18n } = useTranslation();
  const language = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : DEFAULT_LANGUAGE;

  return {
    language,
    setLanguage: (next) => {
      writeStorage(LANGUAGE_STORAGE_KEY, next);
      void i18n.changeLanguage(next);
    },
  };
}

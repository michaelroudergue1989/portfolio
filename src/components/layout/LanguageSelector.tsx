import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/useLanguage';
import { SUPPORTED_LANGUAGES } from '@/i18n';
import { cx } from '@/lib/cx';

export function LanguageSelector() {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();

  return (
    <div
      role="group"
      aria-label={t('language.label')}
      className="flex rounded-md border border-border-strong p-0.5"
    >
      {SUPPORTED_LANGUAGES.map((code) => {
        const active = code === language;
        return (
          <button
            key={code}
            type="button"
            lang={code}
            aria-label={`${code.toUpperCase()}, ${t(`language.${code}`)}`}
            aria-pressed={active}
            onClick={() => {
              setLanguage(code);
            }}
            className={cx(
              'min-h-10 min-w-10 rounded-sm px-2 text-xs font-semibold tracking-wide transition-interactive',
              active ? 'bg-primary text-on-primary' : 'text-foreground hover:bg-surface-subtle',
            )}
          >
            {code.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}

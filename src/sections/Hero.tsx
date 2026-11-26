import { ArrowDown, Download, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LocalizedText } from '@/components/ui/LocalizedText';
import { buttonStyles } from '@/components/ui/buttonStyles';
import { Container } from '@/components/ui/Container';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { contactLinks } from '@/data/contact';
import { profile } from '@/data/profile';
import { resume } from '@/data/resume';
import { SECTION_IDS } from '@/data/sections';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cx } from '@/lib/cx';
import { isDownloadable, resumeFileName } from '@/lib/resume';
import type { Resume } from '@/types/portfolio';
import { HeroVisual } from './HeroVisual';

/** Pantallas estrechas (< 768 px) y móviles en horizontal (altura reducida por debajo de 1024 px). */
export const COMPACT_HERO_QUERY =
  '(max-width: 767.98px), (max-height: 500px) and (max-width: 1023.98px)';

/**
 * El CTA principal es "Descargar CV" solo cuando el CV está autorizado y disponible; mientras no
 * lo esté, la acción principal es "Ver experiencia" (nunca un botón que simule una descarga).
 * Los perfiles externos van en una segunda fila para no sobrecargar las acciones principales.
 *
 * En pantallas compactas las acciones van justo después de la presentación. El orden se decide
 * aquí, y no con `order` de CSS, para que el DOM (lectura y tabulación) coincida con lo visible.
 */
export function Hero({ item = resume }: { item?: Resume }) {
  const { t } = useTranslation();
  const compact = useMediaQuery(COMPACT_HERO_QUERY);
  const canDownload = isDownloadable(item);

  const body = (
    <p
      key="body"
      className={cx(
        compact ? 'mt-8' : 'mt-5',
        'max-w-2xl text-base text-pretty text-muted sm:text-lg',
      )}
    >
      {t('hero.body')}
    </p>
  );

  const closing = (
    <p
      key="closing"
      className="mt-6 max-w-2xl border-l-2 border-primary pl-4 text-sm text-pretty text-muted sm:text-base"
    >
      <LocalizedText i18nKey="hero.closing" />
    </p>
  );

  const location = (
    <p key="location" className="mt-6 flex items-center gap-2 text-sm text-muted">
      <MapPin aria-hidden="true" className="size-4 text-primary" />
      {t(profile.locationKey)}
    </p>
  );

  const actions = (
    <div
      key="actions"
      className={cx(compact ? 'mt-5' : 'mt-8', 'flex flex-wrap items-center gap-3')}
    >
      {canDownload ? (
        <>
          <a
            href={item.path}
            download={resumeFileName(item)}
            hrefLang={item.language}
            className={buttonStyles('primary', 'lg')}
          >
            <Download aria-hidden="true" className="size-4" />
            {t('hero.ctaDownload')}
            <span className="sr-only"> {t('a11y.pdfFile')}</span>
          </a>
          <a href={`#${SECTION_IDS.experience}`} className={buttonStyles('secondary', 'lg')}>
            {t('hero.ctaExperience')}
            <ArrowDown aria-hidden="true" className="size-4" />
          </a>
        </>
      ) : (
        <a href={`#${SECTION_IDS.experience}`} className={buttonStyles('primary', 'lg')}>
          {t('hero.ctaExperience')}
          <ArrowDown aria-hidden="true" className="size-4" />
        </a>
      )}
    </div>
  );

  const profiles = (
    <div key="profiles" className="mt-3 flex flex-wrap items-center gap-3">
      {contactLinks.map((link) => (
        <ExternalLink key={link.id} href={link.url} className={buttonStyles('secondary', 'md')}>
          {t(link.labelKey)}
        </ExternalLink>
      ))}
    </div>
  );

  return (
    <section
      id={SECTION_IDS.home}
      aria-labelledby="hero-title"
      className={compact ? 'pt-6 pb-section' : 'py-section'}
    >
      <Container className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div>
          <p
            className={cx(
              compact ? 'mb-2' : 'mb-4',
              'font-mono text-sm font-medium tracking-wide text-accent uppercase',
            )}
          >
            {t(profile.titleKey)}
          </p>
          <h1
            id="hero-title"
            className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-6xl"
          >
            {profile.displayName}
          </h1>

          <p
            className={cx(
              compact ? 'mt-4 text-lg sm:text-xl' : 'mt-6 text-xl sm:text-2xl',
              'max-w-2xl leading-snug text-pretty',
            )}
          >
            {t('hero.lead')}
          </p>

          {compact
            ? [actions, profiles, body, closing, location]
            : [body, closing, location, actions, profiles]}
        </div>

        <HeroVisual />
      </Container>
    </section>
  );
}

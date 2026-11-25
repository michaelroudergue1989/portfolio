import { Download, Eye, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { buttonStyles } from '@/components/ui/buttonStyles';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { profile } from '@/data/profile';
import { resume as defaultResume } from '@/data/resume';
import { SECTION_IDS } from '@/data/sections';
import { isDownloadable, resumeFileName } from '@/lib/resume';
import type { Resume as ResumeData } from '@/types/portfolio';

const AREA_KEYS = ['software', 'leadership', 'projects', 'cybersecurity'] as const;

/** "2026-11-25" → "noviembre de 2026" / "November 2026"; undefined si la fecha no es válida. */
function formatUpdated(isoDate: string, language: string): string | undefined {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(language, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

/**
 * Acciones del currículum. Los enlaces existen SOLO si el documento está habilitado y es válido
 * (ver `isDownloadable`); si no, se muestran botones deshabilitados y una nota: nunca un enlace
 * que pueda estar roto ni una descarga simulada.
 */
function ResumeActions({ resume }: { resume: ResumeData }) {
  const { t } = useTranslation();

  if (!isDownloadable(resume)) {
    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="lg" disabled aria-describedby="resume-note">
            <Download aria-hidden="true" className="size-4" />
            {t('resumes.download')}
          </Button>
          <Button variant="secondary" size="lg" disabled aria-describedby="resume-note">
            <Eye aria-hidden="true" className="size-4" />
            {t('resumes.view')}
          </Button>
        </div>
        <p id="resume-note" className="flex flex-wrap items-center gap-2 text-sm text-muted">
          <Badge>{t('resumes.unavailable')}</Badge>
          <span>{t('resumes.note')}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <a
        href={resume.path}
        download={resumeFileName(resume)}
        hrefLang={resume.language}
        className={buttonStyles('primary', 'lg')}
      >
        <Download aria-hidden="true" className="size-4" />
        {t('resumes.download')}
        <span className="sr-only"> {t('a11y.pdfFile')}</span>
      </a>
      <a
        href={resume.path}
        target="_blank"
        rel="noopener noreferrer"
        hrefLang={resume.language}
        className={buttonStyles('secondary', 'lg')}
      >
        <Eye aria-hidden="true" className="size-4" />
        {t('resumes.view')}
        <span className="sr-only">
          {' '}
          {t('a11y.pdfFile')} {t('a11y.opensInNewTab')}
        </span>
      </a>
    </div>
  );
}

export function Resume({ item = defaultResume }: { item?: ResumeData }) {
  const { t, i18n } = useTranslation();
  const updated = formatUpdated(item.updatedAt, i18n.resolvedLanguage ?? 'es');

  return (
    <Section id={SECTION_IDS.resumes} labelledBy="resumes-title" tone="alt">
      <SectionHeading
        id="resumes-title"
        eyebrow={t('resumes.eyebrow')}
        title={t('resumes.title')}
        description={t('resumes.description')}
      />

      <Card as="article" className="relative overflow-hidden border-2 border-primary p-6 sm:p-8">
        <div className="grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:gap-8">
          <span className="inline-flex size-16 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <FileText aria-hidden="true" className="size-8" />
          </span>
          <div>
            <h3 className="text-2xl font-bold text-balance">{profile.displayName}</h3>
            <p className="mt-1 text-lg text-muted">{t(profile.titleKey)}</p>

            <ul aria-label={t('resumes.areasLabel')} className="mt-4 flex flex-wrap gap-2">
              {AREA_KEYS.map((key) => (
                <li key={key}>
                  <Badge variant="primary">{t(`resumes.areas.${key}`)}</Badge>
                </li>
              ))}
            </ul>

            {updated !== undefined && item.pages > 0 ? (
              <p className="mt-4 text-sm text-muted">
                {t('resumes.fileMeta', {
                  language: t(`resumes.documentLanguage.${item.language}`),
                  pages: t('resumes.pages', { count: item.pages }),
                  date: updated,
                })}
              </p>
            ) : null}

            <div className="mt-6" role="group" aria-label={t('resumes.actionsLabel')}>
              <ResumeActions resume={item} />
            </div>
          </div>
        </div>
      </Card>
    </Section>
  );
}

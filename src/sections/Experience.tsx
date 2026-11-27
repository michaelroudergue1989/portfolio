import { useTranslation } from 'react-i18next';
import { LocalizedText } from '@/components/ui/LocalizedText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { experience } from '@/data/experience';
import { SECTION_IDS } from '@/data/sections';
import { cx } from '@/lib/cx';
import { formatYearMonth, toIsoYearMonth } from '@/lib/period';

export function Experience() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage ?? 'es';

  return (
    <Section id={SECTION_IDS.experience} labelledBy="experience-title">
      <SectionHeading
        id="experience-title"
        eyebrow={t('experience.eyebrow')}
        title={t('experience.title')}
        description={t('experience.description')}
      />

      <ol className="ml-2 space-y-8 border-l-2 border-border-strong sm:ml-3">
        {experience.map((job) => {
          const current = job.period.end === 'present';
          return (
            <li key={job.id} className="relative pl-6 sm:pl-10">
              <span
                aria-hidden="true"
                className={cx(
                  'absolute top-7 left-0 size-4 -translate-x-[calc(50%+1px)] rounded-full border-2 border-primary',
                  current ? 'bg-primary' : 'bg-background',
                )}
              />
              <Card as="article">
                <p className="font-mono text-sm font-medium text-accent">
                  <time dateTime={toIsoYearMonth(job.period.start)}>
                    {formatYearMonth(job.period.start, language)}
                  </time>
                  {' – '}
                  {job.period.end === 'present' ? (
                    t('experience.present')
                  ) : (
                    <time dateTime={toIsoYearMonth(job.period.end)}>
                      {formatYearMonth(job.period.end, language)}
                    </time>
                  )}
                </p>
                <h3 className="mt-2 text-xl font-semibold text-balance">{job.organization}</h3>
                {job.unitKey ? (
                  <p className="mt-1 text-muted">
                    <LocalizedText i18nKey={job.unitKey} />
                  </p>
                ) : null}
                <p className="mt-1 font-medium text-primary">{t(job.roleKey)}</p>

                <h4 className="mt-6 mb-3 text-xs font-semibold tracking-wide uppercase">
                  {t('experience.responsibilitiesLabel')}
                </h4>
                <ul className="list-disc space-y-2 pl-5 text-muted marker:text-border-strong">
                  {job.responsibilityKeys.map((key) => (
                    <li key={key}>{t(key)}</li>
                  ))}
                </ul>

                <h4 className="mt-6 mb-3 text-xs font-semibold tracking-wide uppercase">
                  {t('experience.technologiesLabel')}
                </h4>
                <ul className="flex flex-wrap gap-2">
                  {job.technologies.map((tech) => (
                    <li key={tech}>
                      <Badge mono tech>
                        {tech}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

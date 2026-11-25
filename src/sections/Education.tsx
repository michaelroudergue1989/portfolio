import { Clock, GraduationCap } from 'lucide-react';
import { LocalizedText } from '@/components/ui/LocalizedText';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { education } from '@/data/education';
import { SECTION_IDS } from '@/data/sections';

export function Education() {
  const { t } = useTranslation();

  return (
    <Section id={SECTION_IDS.education} labelledBy="education-title" tone="alt">
      <SectionHeading
        id="education-title"
        eyebrow={t('education.eyebrow')}
        title={t('education.title')}
        description={t('education.description')}
      />

      <ol className="grid gap-6 lg:grid-cols-3">
        {education.map((item) => {
          const { startYear, endYear } = item.period;
          const years = startYear ? `${String(startYear)}–${String(endYear)}` : String(endYear);
          return (
            <li key={item.id} className="flex">
              <Card as="article" className="flex w-full flex-col">
                <p className="font-mono text-sm font-medium text-accent">{years}</p>
                <h3 className="mt-3 text-lg font-semibold text-balance">
                  <LocalizedText i18nKey={item.titleKey} />
                </h3>
                <p className="mt-2 flex items-center gap-2 text-muted">
                  <GraduationCap aria-hidden="true" className="size-4 shrink-0 text-primary" />
                  {item.institution}
                </p>
                {item.noteKey ? <p className="mt-3 text-sm text-muted">{t(item.noteKey)}</p> : null}
                <div className="mt-auto flex flex-wrap gap-2 pt-5">
                  {item.hours ? (
                    <Badge>
                      <Clock aria-hidden="true" className="size-3.5" />
                      {t('education.hours', { hours: item.hours })}
                    </Badge>
                  ) : null}
                  {item.statusKey ? <Badge variant="accent">{t(item.statusKey)}</Badge> : null}
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}

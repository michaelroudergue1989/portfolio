import { Briefcase, Code, GraduationCap, ShieldCheck, Users, type LucideIcon } from 'lucide-react';
import { LocalizedText } from '@/components/ui/LocalizedText';
import { useTranslation } from 'react-i18next';
import { areaTone } from '@/components/ui/areaStyles';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { areas } from '@/data/areas';
import { SECTION_IDS } from '@/data/sections';
import { cx } from '@/lib/cx';
import type { AreaIconName } from '@/types/portfolio';

const icons: Record<AreaIconName, LucideIcon> = {
  code: Code,
  users: Users,
  shield: ShieldCheck,
};

export function Areas() {
  const { t } = useTranslation();

  return (
    <Section id={SECTION_IDS.areas} labelledBy="areas-title" tone="alt">
      <SectionHeading
        id="areas-title"
        eyebrow={t('areas.eyebrow')}
        title={t('areas.title')}
        description={t('areas.description')}
      />

      <ul className="grid gap-6 lg:grid-cols-3">
        {areas.map((area) => {
          const Icon = icons[area.icon];
          const tone = areaTone[area.id];

          return (
            <li key={area.id} className="flex">
              <Card as="article" className="relative flex w-full flex-col overflow-hidden">
                <span aria-hidden="true" className={cx('absolute inset-x-0 top-0 h-1', tone.bar)} />
                <span
                  className={cx(
                    'mb-5 inline-flex size-12 items-center justify-center rounded-lg',
                    tone.soft,
                    tone.text,
                  )}
                >
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h3 className="text-xl font-semibold text-balance">{t(area.titleKey)}</h3>
                <p className="mt-3 text-muted">{t(area.descriptionKey)}</p>

                <h4 className="mt-6 mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                  <Briefcase aria-hidden="true" className={cx('size-4', tone.text)} />
                  {t('areas.experienceLabel')}
                </h4>
                <ul className="flex flex-wrap gap-2">
                  {area.experienceKeys.map((key) => (
                    <li key={key}>
                      <Badge variant={area.id}>{t(key)}</Badge>
                    </li>
                  ))}
                  {area.technologies.map((tech) => (
                    <li key={tech}>
                      <Badge mono>{tech}</Badge>
                    </li>
                  ))}
                </ul>

                <h4 className="mt-6 mb-3 flex items-center gap-2 text-xs font-semibold tracking-wide uppercase">
                  <GraduationCap aria-hidden="true" className={cx('size-4', tone.text)} />
                  {t('areas.trainingLabel')}
                </h4>
                <ul className="space-y-1.5 text-sm text-muted">
                  {area.trainingKeys.map((key) => (
                    <li key={key}>
                      <LocalizedText i18nKey={key} />
                    </li>
                  ))}
                </ul>
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

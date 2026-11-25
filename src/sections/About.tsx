import { Code, ShieldCheck, Users, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { areaTone } from '@/components/ui/areaStyles';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { areas } from '@/data/areas';
import { profile } from '@/data/profile';
import { SECTION_IDS } from '@/data/sections';
import { cx } from '@/lib/cx';
import type { AreaIconName } from '@/types/portfolio';

const icons: Record<AreaIconName, LucideIcon> = {
  code: Code,
  users: Users,
  shield: ShieldCheck,
};

export function About() {
  const { t } = useTranslation();

  return (
    <Section id={SECTION_IDS.about} labelledBy="about-title">
      <SectionHeading id="about-title" eyebrow={t('about.eyebrow')} title={t('about.title')} />

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-14">
        <div className="max-w-3xl space-y-5 text-lg text-pretty">
          <p>{t('about.p1')}</p>
          <p className="text-muted">{t('about.p2')}</p>
          <p className="text-muted">{t('about.p3')}</p>
          <p className="pt-2 font-medium">{t('about.linesIntro')}</p>
          <ul className="space-y-3">
            {areas.map((area) => {
              const Icon = icons[area.icon];
              const tone = areaTone[area.id];
              return (
                <li key={area.id} className="flex items-start gap-3 text-base">
                  <span
                    className={cx(
                      'mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-md',
                      tone.soft,
                      tone.text,
                    )}
                  >
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <span className="pt-1">{t(area.titleKey)}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <Card className="h-fit">
          <h3 className="mb-4 font-mono text-xs font-medium tracking-wide text-muted uppercase">
            {t('about.factsTitle')}
          </h3>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-muted">{t('about.factName')}</dt>
              <dd className="font-medium">{profile.fullName}</dd>
            </div>
            <div>
              <dt className="text-muted">{t('about.factTitle')}</dt>
              <dd className="font-medium">{t(profile.titleKey)}</dd>
            </div>
            <div>
              <dt className="text-muted">{t('about.factLocation')}</dt>
              <dd className="font-medium">{t(profile.locationKey)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </Section>
  );
}

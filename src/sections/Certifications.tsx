import { Award, BookOpenCheck } from 'lucide-react';
import { LocalizedText } from '@/components/ui/LocalizedText';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/Card';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { certifications } from '@/data/certifications';
import { SECTION_IDS } from '@/data/sections';
import type { Certification } from '@/types/portfolio';

function CertificationItem({ item }: { item: Certification }) {
  const { t } = useTranslation();
  const meta = [
    item.issuer,
    item.year ? String(item.year) : null,
    item.hours ? t('certifications.hours', { hours: item.hours }) : null,
  ].filter((part): part is string => part !== null);

  return (
    <li className="py-4 first:pt-0 last:pb-0">
      <p className="font-medium">
        {item.credentialUrl ? (
          <ExternalLink href={item.credentialUrl} className="gap-1 underline hover:text-primary">
            <LocalizedText i18nKey={item.nameKey} />
          </ExternalLink>
        ) : (
          <LocalizedText i18nKey={item.nameKey} />
        )}
      </p>
      <p className="mt-1 text-sm text-muted">{meta.join(' · ')}</p>
      {item.noteKey ? <p className="mt-2 text-sm text-muted italic">{t(item.noteKey)}</p> : null}
    </li>
  );
}

export function Certifications() {
  const { t } = useTranslation();
  const professional = certifications.filter((item) => item.kind === 'certification');
  const courses = certifications.filter((item) => item.kind === 'course');

  return (
    <Section id={SECTION_IDS.certifications} labelledBy="certifications-title">
      <SectionHeading
        id="certifications-title"
        eyebrow={t('certifications.eyebrow')}
        title={t('certifications.title')}
        description={t('certifications.description')}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <Card className="h-fit">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Award aria-hidden="true" className="size-5 text-primary" />
            {t('certifications.professionalTitle')}
          </h3>
          <ul className="divide-y divide-border">
            {professional.map((item) => (
              <CertificationItem key={item.id} item={item} />
            ))}
          </ul>
        </Card>

        <Card>
          <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold">
            <BookOpenCheck aria-hidden="true" className="size-5 text-primary" />
            {t('certifications.coursesTitle')}
          </h3>
          <p className="mb-4 text-sm text-muted">{t('certifications.coursesNote')}</p>
          <ul className="divide-y divide-border">
            {courses.map((item) => (
              <CertificationItem key={item.id} item={item} />
            ))}
          </ul>
        </Card>
      </div>
    </Section>
  );
}

import {
  Code,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { buttonStyles } from '@/components/ui/buttonStyles';
import { Card } from '@/components/ui/Card';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { contactInterests, contactLinks, type InterestIcon } from '@/data/contact';
import { profile } from '@/data/profile';
import { SECTION_IDS } from '@/data/sections';
import { cx } from '@/lib/cx';
import { parseSafeHttpsUrl } from '@/lib/url';

const icons: Record<InterestIcon, LucideIcon> = {
  code: Code,
  users: Users,
  workflow: Workflow,
  shield: ShieldCheck,
  lock: LockKeyhole,
};

/** Solo enlaces a perfiles públicos: sin formulario, correo ni teléfono. */
export function Contact() {
  const { t } = useTranslation();

  return (
    <Section id={SECTION_IDS.contact} labelledBy="contact-title">
      <SectionHeading
        id="contact-title"
        eyebrow={t('contact.eyebrow')}
        title={t('contact.title')}
        description={t('contact.description')}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">{t('contact.interestsTitle')}</h3>
          <ul className="space-y-3">
            {contactInterests.map((interest) => {
              const Icon = icons[interest.icon];
              return (
                <li key={interest.id} className="flex items-center gap-3">
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
                    <Icon aria-hidden="true" className="size-5" />
                  </span>
                  {t(interest.labelKey)}
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="border-2 border-primary">
          <h3 className="mb-5 text-lg font-semibold">{t('contact.connectTitle')}</h3>
          <ul className="space-y-5">
            {contactLinks.map((link) => {
              const url = parseSafeHttpsUrl(link.url);
              const isPrimary = link.kind === 'linkedin';
              return (
                <li key={link.id} className="flex flex-col items-start gap-2">
                  <ExternalLink
                    href={link.url}
                    className={cx(
                      buttonStyles(isPrimary ? 'primary' : 'secondary', 'lg'),
                      'w-full sm:w-auto',
                    )}
                  >
                    {t(isPrimary ? 'contact.linkedinCta' : 'contact.githubCta')}
                  </ExternalLink>
                  {url ? (
                    <p className="font-mono text-xs break-all text-muted">
                      {url.hostname.replace(/^www\./, '')}
                      {url.pathname}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
          <p className="mt-6 flex items-center gap-2 border-t border-border pt-5 text-sm text-muted">
            <MapPin aria-hidden="true" className="size-4 shrink-0 text-primary" />
            <span className="sr-only">{t('contact.locationLabel')}: </span>
            {t(profile.locationKey)}
          </p>
          <p className="mt-3 text-sm">
            <a
              href={`#${SECTION_IDS.resumes}`}
              className="inline-flex min-h-6 items-center font-medium text-primary underline underline-offset-4"
            >
              {t('contact.resumesLink')}
            </a>
          </p>
        </Card>
      </div>
    </Section>
  );
}

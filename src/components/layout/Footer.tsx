import { useTranslation } from 'react-i18next';
import { areaTone } from '@/components/ui/areaStyles';
import { Container } from '@/components/ui/Container';
import { ExternalLink } from '@/components/ui/ExternalLink';
import { areas } from '@/data/areas';
import { contactLinks } from '@/data/contact';
import { footerNavItems } from '@/data/navigation';
import { profile } from '@/data/profile';
import { cx } from '@/lib/cx';

const linkClasses =
  'text-foreground hover:text-primary transition-interactive inline-flex min-h-6 items-center underline-offset-4 hover:underline';

export function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-surface pt-12 pb-8">
      <Container>
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="text-lg font-semibold">{profile.displayName}</p>
            <p className="mt-2 max-w-sm text-sm text-muted">{t('footer.summary')}</p>
            <ul aria-label={t('footer.areasLabel')} className="mt-4 space-y-2 text-sm">
              {areas.map((area) => (
                <li key={area.id} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={cx('size-2 shrink-0 rounded-full', areaTone[area.id].bar)}
                  />
                  {t(area.shortTitleKey)}
                </li>
              ))}
            </ul>
          </div>

          <nav aria-label={t('footer.quickNav')}>
            <p className="mb-3 font-mono text-xs font-medium tracking-wide text-muted uppercase">
              {t('footer.quickNav')}
            </p>
            <ul className="space-y-1 text-sm">
              {footerNavItems.map((item) => (
                <li key={item.id}>
                  <a href={`#${item.targetId}`} className={linkClasses}>
                    {t(item.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="mb-3 font-mono text-xs font-medium tracking-wide text-muted uppercase">
              {t('footer.links')}
            </p>
            <ul className="space-y-1 text-sm">
              {contactLinks.map((link) => (
                <li key={link.id}>
                  <ExternalLink href={link.url} className={`${linkClasses} gap-1`}>
                    {t(link.labelKey)}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <p className="mt-10 border-t border-border pt-6 text-sm text-muted">
          {t('footer.rights', { year, name: profile.fullName })}
        </p>
      </Container>
    </footer>
  );
}

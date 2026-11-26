import { useTranslation } from 'react-i18next';
import { Container } from '@/components/ui/Container';
import { Monogram } from '@/components/ui/Monogram';
import { extendedNavItems, navItems } from '@/data/navigation';
import { profile } from '@/data/profile';
import { useActiveSection } from '@/hooks/useActiveSection';
import { DesktopNav } from './DesktopNav';
import { LanguageSelector } from './LanguageSelector';
import { MobileMenu } from './MobileMenu';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  const { t } = useTranslation();
  // Cada navegación calcula la sección activa sobre sus propios destinos.
  const activeId = useActiveSection(navItems.map((item) => item.targetId));
  const mobileActiveId = useActiveSection(extendedNavItems.map((item) => item.targetId));

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-background">
      <Container className="flex h-(--header-height) items-center justify-between gap-3">
        <a
          href="#home"
          title={t('nav.home')}
          className="flex shrink-0 items-center gap-3 rounded-md font-semibold whitespace-nowrap"
        >
          <Monogram />
          {/* En móvil solo se ve el monograma; el nombre sigue disponible para lectores de pantalla. */}
          <span className="sr-only sm:not-sr-only">{profile.displayName}</span>
        </a>

        <DesktopNav activeId={activeId} />

        <div className="flex items-center gap-1 sm:gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <MobileMenu activeId={mobileActiveId} />
        </div>
      </Container>
    </header>
  );
}

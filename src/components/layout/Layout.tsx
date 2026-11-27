import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BOTTOM_NAV_QUERY, extendedNavItems } from '@/data/navigation';
import { useActiveSection } from '@/hooks/useActiveSection';
import { useFocusNotObscured } from '@/hooks/useFocusNotObscured';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { BottomNav } from './BottomNav';
import { Footer } from './Footer';
import { Header } from './Header';

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  useFocusNotObscured();
  // Una sola detección de sección activa para el menú móvil y la barra inferior.
  const mobileActiveId = useActiveSection(extendedNavItems.map((item) => item.targetId));
  const [menuOpen, setMenuOpen] = useState(false);
  const showBottomNav = useMediaQuery(BOTTOM_NAV_QUERY);

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-4 py-3 font-medium text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        {t('a11y.skipToContent')}
      </a>
      <Header mobileActiveId={mobileActiveId} onMenuOpenChange={setMenuOpen} />
      {/* Reserva el espacio de la cabecera fija (altura + 1 px de borde). */}
      <div aria-hidden="true" className="h-[calc(var(--header-height)+1px)]" />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
      {showBottomNav ? <BottomNav activeId={mobileActiveId} hidden={menuOpen} /> : null}
    </>
  );
}

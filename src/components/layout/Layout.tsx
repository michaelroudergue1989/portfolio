import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useFocusNotObscured } from '@/hooks/useFocusNotObscured';
import { Footer } from './Footer';
import { Header } from './Header';

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  useFocusNotObscured();

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-primary px-4 py-3 font-medium text-on-primary focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
      >
        {t('a11y.skipToContent')}
      </a>
      <Header />
      {/* Reserva el espacio de la cabecera fija (altura + 1 px de borde). */}
      <div aria-hidden="true" className="h-[calc(var(--header-height)+1px)]" />
      <main id="main" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer />
    </>
  );
}

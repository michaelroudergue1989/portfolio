import { ArrowUpRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cx } from '@/lib/cx';
import { parseSafeHttpsUrl } from '@/lib/url';

interface ExternalLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
  /** Abre en una pestaña nueva (por defecto sí). */
  newTab?: boolean;
  /** Muestra el icono de salida (por defecto sí). */
  showIcon?: boolean;
}

/**
 * Enlace a un destino externo. Solo acepta URLs https válidas y sin credenciales;
 * ante cualquier otro valor no genera un enlace y muestra solo el texto.
 */
export function ExternalLink({
  href,
  children,
  className,
  newTab = true,
  showIcon = true,
}: ExternalLinkProps) {
  const { t } = useTranslation();
  const url = parseSafeHttpsUrl(href);

  if (!url) {
    return <span className={className}>{children}</span>;
  }

  return (
    <a
      href={url.href}
      className={cx('inline-flex items-center', className)}
      {...(newTab ? { target: '_blank' } : {})}
      rel="noopener noreferrer"
    >
      {children}
      {showIcon ? <ArrowUpRight aria-hidden="true" className="size-4 shrink-0" /> : null}
      {newTab ? (
        <>
          {' '}
          <span className="sr-only">{t('a11y.opensInNewTab')}</span>
        </>
      ) : null}
    </a>
  );
}

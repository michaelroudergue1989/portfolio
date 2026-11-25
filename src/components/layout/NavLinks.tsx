import { useTranslation } from 'react-i18next';
import { navItems } from '@/data/navigation';
import { cx } from '@/lib/cx';

interface NavLinksProps {
  orientation: 'horizontal' | 'vertical';
  /** Id de la sección activa según el scroll. */
  activeId?: string | null;
  /** Se invoca al activar un enlace (p. ej. para cerrar el menú móvil). */
  onNavigate?: () => void;
}

export function NavLinks({ orientation, activeId = null, onNavigate }: NavLinksProps) {
  const { t } = useTranslation();
  const horizontal = orientation === 'horizontal';

  return (
    <ul className={cx('flex', horizontal ? 'items-center gap-1' : 'flex-col gap-1')}>
      {navItems.map((item) => {
        const active = item.targetId === activeId;
        return (
          <li key={item.id}>
            <a
              href={`#${item.targetId}`}
              onClick={onNavigate}
              aria-current={active ? 'location' : undefined}
              className={cx(
                'flex min-h-11 items-center rounded-md px-3 text-sm font-medium whitespace-nowrap transition-interactive',
                !horizontal && 'w-full text-base',
                active ? 'bg-primary-soft text-primary' : 'text-foreground hover:bg-surface-subtle',
              )}
            >
              {t(item.labelKey)}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

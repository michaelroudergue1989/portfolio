import { Briefcase, FileText, FolderKanban, House, Mail, type LucideIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { bottomNavItems } from '@/data/navigation';
import { cx } from '@/lib/cx';

const icons: Record<string, LucideIcon> = {
  home: House,
  experience: Briefcase,
  projects: FolderKanban,
  resumes: FileText,
  contact: Mail,
};

interface BottomNavProps {
  /** Sección detectada según el scroll; solo se marca si tiene acceso en la barra. */
  activeId: string | null;
  /** Oculta la barra (también para teclado y lectores) mientras el menú móvil está abierto. */
  hidden?: boolean;
}

/**
 * Barra flotante de accesos directos para móvil. Complementa al menú, no lo sustituye. Layout solo
 * la monta cuando la ventana cumple BOTTOM_NAV_QUERY, así que oculta no deja controles en el DOM.
 * El espaciador reserva su altura al final de la página para que el pie se vea completo.
 */
export function BottomNav({ activeId, hidden = false }: BottomNavProps) {
  const { t } = useTranslation();

  return (
    <>
      <div aria-hidden="true" className="h-(--bottom-nav-space) bg-surface" />
      <nav
        data-bottom-nav=""
        aria-label={t('nav.bottomLabel')}
        className={cx(
          'fixed right-[max(0.5rem,env(safe-area-inset-right))] bottom-[calc(0.5rem+env(safe-area-inset-bottom))] left-[max(0.5rem,env(safe-area-inset-left))] z-30 mx-auto max-w-md rounded-2xl border border-border-strong bg-surface p-1 shadow-raised',
          hidden && 'invisible',
        )}
      >
        {/* Columnas iguales salvo que una etiqueta necesite más: nunca se abrevian ni se cortan. */}
        <ul className="grid grid-cols-[repeat(5,minmax(max-content,1fr))]">
          {bottomNavItems.map((item) => {
            const Icon = icons[item.id] ?? House;
            const active = item.targetId === activeId;
            return (
              <li key={item.id} className="flex">
                <a
                  href={`#${item.targetId}`}
                  aria-current={active ? 'location' : undefined}
                  className={cx(
                    'flex min-h-12 w-full min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 text-xs font-medium transition-interactive',
                    active
                      ? 'bg-primary-soft text-primary'
                      : 'text-foreground hover:bg-surface-subtle',
                  )}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {t(item.labelKey)}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

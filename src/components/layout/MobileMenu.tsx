import { Menu, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FocusEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { extendedNavItems } from '@/data/navigation';
import { NavLinks } from './NavLinks';

/**
 * Menú de navegación móvil como disclosure (no modal):
 * - El botón expone aria-expanded y aria-controls.
 * - Escape cierra y devuelve el foco al botón.
 * - Se cierra al activar un enlace, al hacer clic fuera o al sacar el foco del menú.
 */
export function MobileMenu({
  activeId = null,
  onOpenChange,
}: {
  activeId?: string | null;
  /** Avisa al abrir y cerrar (la barra inferior se oculta mientras el menú está abierto). */
  onOpenChange?: ((open: boolean) => void) | undefined;
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [open]);

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget;
    if (next instanceof Node && !event.currentTarget.contains(next)) {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} onBlur={handleBlur} className="xl:hidden">
      <Button
        ref={buttonRef}
        variant="ghost"
        className="size-11 px-0"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t('nav.closeMenu') : t('nav.openMenu')}
        onClick={() => {
          setOpen((value) => !value);
        }}
      >
        {open ? (
          <X aria-hidden="true" className="size-5" />
        ) : (
          <Menu aria-hidden="true" className="size-5" />
        )}
      </Button>

      {open ? (
        <div
          id={panelId}
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-var(--header-height))] overflow-y-auto border-b border-border bg-background shadow-raised"
        >
          <nav aria-label={t('nav.mobileLabel')} className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
            <NavLinks
              items={extendedNavItems}
              orientation="vertical"
              activeId={activeId}
              onNavigate={() => {
                setOpen(false);
              }}
            />
          </nav>
        </div>
      ) : null}
    </div>
  );
}

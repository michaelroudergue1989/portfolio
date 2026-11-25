import { useEffect } from 'react';

/** Holgura (px) entre la cabecera fija y el elemento enfocado. */
const GAP = 16;

/**
 * WCAG 2.4.11 (Foco no oculto): al recibir foco, un elemento del contenido no debe quedar bajo la
 * cabecera fija. Chromium y WebKit lo resuelven con `scroll-padding-top`; Firefox no desplaza si el
 * elemento ya está dentro del viewport, aunque quede tapado. Este ajuste mínimo lo cubre en todos.
 */
export function useFocusNotObscured(): void {
  useEffect(() => {
    let frame = 0;

    const adjust = (target: HTMLElement) => {
      // El elemento pudo desmontarse antes del siguiente frame (p. ej. un enlace del menú móvil que
      // se cierra al elegirlo): ajustar entonces cancelaría el desplazamiento de la navegación.
      if (!target.isConnected) return;
      const header = document.querySelector('header');
      if (!header || header.contains(target)) return;
      if (getComputedStyle(target).position === 'fixed') return; // p. ej. el enlace de salto
      const headerBottom = header.getBoundingClientRect().bottom;
      const top = target.getBoundingClientRect().top;
      if (top < headerBottom + GAP / 2) {
        window.scrollBy({ top: top - headerBottom - GAP, behavior: 'instant' });
      }
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      window.cancelAnimationFrame(frame);
      // Tras el desplazamiento propio del navegador al enfocar.
      frame = window.requestAnimationFrame(() => {
        adjust(target);
      });
    };

    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      window.cancelAnimationFrame(frame);
    };
  }, []);
}

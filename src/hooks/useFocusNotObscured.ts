import { useEffect } from 'react';

/** Holgura (px) entre la cabecera fija y el elemento enfocado. */
const GAP = 16;

/**
 * Desplazamiento mínimo hacia abajo para destapar un elemento que la barra inferior cubre, o 0.
 * Se mide en cada foco (la barra aparece y desaparece al girar o redimensionar) y nunca empuja el
 * elemento bajo la cabecera.
 */
function offsetFromBottomBar(target: HTMLElement, headerBottom: number): number {
  const bar = document.querySelector('[data-bottom-nav]');
  if (!bar || getComputedStyle(bar).visibility === 'hidden') return 0;
  const barRect = bar.getBoundingClientRect();
  const rect = target.getBoundingClientRect();
  const covered =
    rect.bottom > barRect.top &&
    rect.top < window.innerHeight &&
    rect.right > barRect.left &&
    rect.left < barRect.right;
  if (!covered) return 0;
  return Math.max(0, Math.min(rect.bottom - barRect.top + GAP / 2, rect.top - headerBottom - GAP));
}

/**
 * WCAG 2.4.11 (Foco no oculto): al recibir foco, un elemento del contenido no debe quedar bajo la
 * cabecera fija ni bajo la barra inferior móvil. Chromium y WebKit lo resuelven con
 * `scroll-padding`; Firefox no desplaza si el elemento ya está dentro del viewport, aunque quede
 * tapado. Este ajuste mínimo lo cubre en todos.
 */
export function useFocusNotObscured(): void {
  useEffect(() => {
    let frame = 0;
    // El ajuste es para el foco por teclado (o por programa). Si el foco lo da un puntero, el
    // usuario ya ve lo que pulsa, y desplazar entre presionar y soltar le haría perder el clic.
    let fromPointer = false;
    const onPointerDown = () => {
      fromPointer = true;
    };
    const onKeyDown = () => {
      fromPointer = false;
    };

    const adjust = (target: HTMLElement) => {
      // El elemento pudo desmontarse antes del siguiente frame (p. ej. un enlace del menú móvil que
      // se cierra al elegirlo): ajustar entonces cancelaría el desplazamiento de la navegación.
      if (!target.isConnected) return;
      const header = document.querySelector('header');
      if (!header || header.contains(target)) return;
      if (target.closest('[data-bottom-nav]')) return; // los enlaces de la barra no están tapados
      // <main tabIndex={-1}> no es un control: recibe el foco como destino de «Saltar al contenido» y
      // al pulsar en cualquier zona no interactiva (en Safari/WebKit, también al pulsar enlaces y
      // botones). Ocupa casi toda la página, así que su borde superior queda sobre la cabecera:
      // «destaparlo» llevaría al inicio y movería el enlace pulsado antes de soltar, perdiendo el clic.
      if (target.tagName === 'MAIN') return;
      if (getComputedStyle(target).position === 'fixed') return; // p. ej. el enlace de salto
      const headerBottom = header.getBoundingClientRect().bottom;
      const top = target.getBoundingClientRect().top;
      if (top < headerBottom + GAP / 2) {
        window.scrollBy({ top: top - headerBottom - GAP, behavior: 'instant' });
        return;
      }
      const down = offsetFromBottomBar(target, headerBottom);
      if (down > 0) window.scrollBy({ top: down, behavior: 'instant' });
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      window.cancelAnimationFrame(frame);
      if (fromPointer) return;
      // Tras el desplazamiento propio del navegador al enfocar.
      frame = window.requestAnimationFrame(() => {
        adjust(target);
      });
    };

    // En captura: deben conocerse antes del `focusin` que provocan.
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('focusin', onFocusIn);
      window.cancelAnimationFrame(frame);
    };
  }, []);
}

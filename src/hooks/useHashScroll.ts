import { useEffect } from 'react';

const USER_INPUT_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
/** Ventana tras la carga en la que se realinea el destino si el contenido se reajusta. */
const SETTLE_MS = 5000;

/**
 * Permite el acceso directo por fragmento (p. ej. /#experience): como el contenido se
 * renderiza con React, el navegador no encuentra el destino al cargar, así que se
 * desplaza al ancla una vez montada la página.
 *
 * Al cargar las fuentes (font-display: swap) la altura del contenido puede cambiar y desplazar el
 * destino. Durante una ventana corta, un ResizeObserver repite el salto si el contenido se
 * reajusta, salvo que el usuario ya haya interactuado (rueda, táctil, teclado o puntero).
 */
export function useHashScroll(): void {
  useEffect(() => {
    const raw = window.location.hash.slice(1);
    if (raw === '') return;
    let id = raw;
    try {
      id = decodeURIComponent(raw);
    } catch {
      // Fragmento mal codificado: se usa tal cual.
    }
    const target = document.getElementById(id);
    if (!target) return;

    const jump = () => {
      target.scrollIntoView({ behavior: 'instant', block: 'start' });
    };
    jump();

    let userInteracted = false;
    const markInteraction = () => {
      userInteracted = true;
    };
    for (const type of USER_INPUT_EVENTS) {
      window.addEventListener(type, markInteraction, { once: true, passive: true });
    }

    // jsdom y navegadores muy antiguos no implementan ResizeObserver.
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(() => {
            if (!userInteracted) jump();
          });
    observer?.observe(document.body);
    const timer = window.setTimeout(() => {
      observer?.disconnect();
    }, SETTLE_MS);

    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
      for (const type of USER_INPUT_EVENTS) window.removeEventListener(type, markInteraction);
    };
  }, []);
}

import { useEffect, useState } from 'react';

/**
 * Devuelve el id de la sección activa según el scroll: la última cuyo borde superior
 * ya pasó por debajo de la cabecera fija. Al llegar al final de la página activa la última.
 * `ids` debe estar en el mismo orden que las secciones en el documento.
 */
export function useActiveSection(ids: readonly string[], offset = 96): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);
  const key = ids.join('|');

  useEffect(() => {
    const list = key === '' ? [] : key.split('|');
    let frame = 0;

    const compute = () => {
      frame = 0;
      let current = list[0] ?? null;
      for (const id of list) {
        const element = document.getElementById(id);
        if (element && element.getBoundingClientRect().top <= offset) current = id;
      }
      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom && window.scrollY > 0) current = list[list.length - 1] ?? current;
      setActive(current);
    };

    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, [key, offset]);

  return active;
}

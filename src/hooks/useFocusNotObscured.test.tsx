import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFocusNotObscured } from './useFocusNotObscured';

function rect(top: number, bottom = top + 40): DOMRect {
  return {
    top,
    bottom,
    left: 0,
    right: 100,
    width: 100,
    height: bottom - top,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
}

/** Elemento del DOM de la prueba; falla si no existe. */
function pick(selector: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`No existe ${selector}`);
  return element;
}

describe('useFocusNotObscured', () => {
  const scrollBy = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('scrollBy', scrollBy);
    scrollBy.mockClear();
    document.body.innerHTML =
      '<header><button id="in-header">menú</button></header><main><button id="content">contenido</button></main><a id="skip" href="#main" style="position:fixed">saltar</a>';
    pick('header').getBoundingClientRect = () => rect(0, 65);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = '';
  });

  const focusAndFlush = (id: string, top: number) => {
    const element = pick(`#${id}`);
    element.getBoundingClientRect = () => rect(top);
    element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    vi.advanceTimersByTime(40);
  };

  it('desplaza lo mínimo cuando el elemento enfocado queda bajo la cabecera', () => {
    renderHook(() => {
      useFocusNotObscured();
    });
    focusAndFlush('content', 55);
    expect(scrollBy).toHaveBeenCalledWith({ top: 55 - 65 - 16, behavior: 'instant' });
  });

  it('no desplaza si el elemento ya es plenamente visible bajo la cabecera', () => {
    renderHook(() => {
      useFocusNotObscured();
    });
    focusAndFlush('content', 200);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('ignora los controles de la propia cabecera y los elementos con posición fija', () => {
    renderHook(() => {
      useFocusNotObscured();
    });
    focusAndFlush('in-header', 10);
    focusAndFlush('skip', 10);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('no ajusta si el elemento se desmontó antes del siguiente frame (regresión: menú móvil)', () => {
    renderHook(() => {
      useFocusNotObscured();
    });
    const element = pick('#content');
    element.getBoundingClientRect = () => rect(0);
    element.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    element.remove();
    vi.advanceTimersByTime(40);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  describe('regresión: el contenedor <main> enfocable no debe desplazar la página', () => {
    // Temporizadores reales: user-event los necesita para simular pulsaciones y teclado.
    beforeEach(() => {
      vi.useRealTimers();
    });

    /** El hook ajusta en el siguiente fotograma: se espera a que se haya ejecutado. */
    const nextFrame = () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            resolve();
          });
        });
      });

    /** Como en Layout: <main tabIndex={-1}> con su borde superior muy por encima de la ventana. */
    function renderPage(): void {
      document.body.innerHTML =
        '<header><button id="in-header">menú</button></header>' +
        '<main id="main" tabindex="-1"><p id="text">texto informativo</p><button id="first">uno</button></main>';
      pick('header').getBoundingClientRect = () => rect(0, 65);
      pick('#main').getBoundingClientRect = () => rect(-3000, 5000);
      renderHook(() => {
        useFocusNotObscured();
      });
    }

    it('ignora el focusin de <main> aunque su borde superior sea negativo', async () => {
      renderPage();
      pick('#main').dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      await nextFrame();
      expect(scrollBy).not.toHaveBeenCalled();
    });

    it('un clic en contenido no interactivo enfoca <main> y no desplaza', async () => {
      renderPage();
      const user = userEvent.setup({ delay: null });
      await user.click(pick('#text'));
      await nextFrame();
      expect(document.activeElement).toBe(pick('#main')); // el clic mueve el foco a <main>
      expect(scrollBy).not.toHaveBeenCalled();
    });

    it('enfocar <main> como destino del enlace de salto no desplaza', async () => {
      renderPage();
      pick('#main').focus();
      await nextFrame();
      expect(document.activeElement).toBe(pick('#main'));
      expect(scrollBy).not.toHaveBeenCalled();
    });

    it('con teclado, un elemento interactivo de <main> bajo la cabecera sí se destapa', async () => {
      renderPage();
      pick('#first').getBoundingClientRect = () => rect(30);
      const user = userEvent.setup({ delay: null });
      pick('#main').focus(); // tras «saltar al contenido»
      await user.tab();
      await nextFrame();
      expect(document.activeElement).toBe(pick('#first'));
      expect(scrollBy).toHaveBeenCalledExactlyOnceWith({ top: 30 - 65 - 16, behavior: 'instant' });
    });

    it('con teclado, un elemento ya visible no provoca desplazamiento', async () => {
      renderPage();
      pick('#first').getBoundingClientRect = () => rect(300);
      const user = userEvent.setup({ delay: null });
      pick('#main').focus();
      await user.tab();
      await nextFrame();
      expect(scrollBy).not.toHaveBeenCalled();
    });
  });

  describe('regresión: el foco dado por puntero no mueve el elemento mientras se pulsa', () => {
    beforeEach(() => {
      vi.useRealTimers();
      document.body.innerHTML =
        '<header></header><main id="main" tabindex="-1"><button id="first">uno</button><button id="second">dos</button></main>';
      pick('header').getBoundingClientRect = () => rect(0, 65);
      // Ambos botones están parcialmente bajo la cabecera.
      pick('#first').getBoundingClientRect = () => rect(41);
      pick('#second').getBoundingClientRect = () => rect(41);
      renderHook(() => {
        useFocusNotObscured();
      });
    });

    const nextFrame = () =>
      new Promise<void>((resolve) => {
        window.requestAnimationFrame(() => {
          window.requestAnimationFrame(() => {
            resolve();
          });
        });
      });

    it('al mantener pulsado un control medio tapado no desplaza (el clic no se pierde)', async () => {
      const user = userEvent.setup({ delay: null });
      await user.pointer({ keys: '[MouseLeft>]', target: pick('#first') }); // presiona sin soltar
      await nextFrame();
      expect(document.activeElement).toBe(pick('#first'));
      expect(scrollBy).not.toHaveBeenCalled();
      await user.pointer({ keys: '[/MouseLeft]' });
    });

    it('después de usar el ratón, el teclado vuelve a destapar el foco', async () => {
      const user = userEvent.setup({ delay: null });
      await user.click(pick('#first'));
      await nextFrame();
      await user.tab();
      await nextFrame();
      expect(document.activeElement).toBe(pick('#second'));
      expect(scrollBy).toHaveBeenCalledExactlyOnceWith({ top: 41 - 65 - 16, behavior: 'instant' });
    });

    it('con Mayús+Tab (hacia atrás) también destapa', async () => {
      const user = userEvent.setup({ delay: null });
      await user.click(pick('#second'));
      await nextFrame();
      await user.tab({ shift: true });
      await nextFrame();
      expect(document.activeElement).toBe(pick('#first'));
      expect(scrollBy).toHaveBeenCalledOnce();
    });
  });

  it('deja de escuchar al desmontar', () => {
    const { unmount } = renderHook(() => {
      useFocusNotObscured();
    });
    unmount();
    focusAndFlush('content', 55);
    expect(scrollBy).not.toHaveBeenCalled();
  });
});

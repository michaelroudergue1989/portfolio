import { renderHook } from '@testing-library/react';
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

  it('deja de escuchar al desmontar', () => {
    const { unmount } = renderHook(() => {
      useFocusNotObscured();
    });
    unmount();
    focusAndFlush('content', 55);
    expect(scrollBy).not.toHaveBeenCalled();
  });
});

import { renderHook } from '@testing-library/react';
import { useHashScroll } from './useHashScroll';

/** ResizeObserver simulado: permite disparar un reajuste de contenido a voluntad. */
class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  disconnected = false;
  constructor(private readonly callback: () => void) {
    FakeResizeObserver.instances.push(this);
  }
  observe() {
    // sin efecto: solo se necesita registrar la instancia
  }
  disconnect() {
    this.disconnected = true;
  }
  trigger() {
    this.callback();
  }
}

describe('useHashScroll', () => {
  const scrolled: string[] = [];

  beforeEach(() => {
    scrolled.length = 0;
    FakeResizeObserver.instances = [];
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this.id);
    };
    document.body.innerHTML = '<section id="skills"></section>';
  });

  afterEach(() => {
    window.history.replaceState(null, '', window.location.pathname);
    document.body.innerHTML = '';
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const mount = () =>
    renderHook(() => {
      useHashScroll();
    });

  it('no hace nada sin fragmento', () => {
    mount();
    expect(scrolled).toEqual([]);
  });

  it('desplaza al destino indicado por el fragmento', () => {
    window.history.replaceState(null, '', '#skills');
    mount();
    expect(scrolled).toEqual(['skills']);
  });

  it('ignora fragmentos inexistentes o mal codificados sin lanzar errores', () => {
    for (const hash of ['#no-existe', '#%E0%A4%A']) {
      window.history.replaceState(null, '', hash);
      expect(mount).not.toThrow();
    }
    expect(scrolled).toEqual([]);
  });

  it('repite el salto si el contenido se reajusta (p. ej. al cargar las fuentes)', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    window.history.replaceState(null, '', '#skills');
    mount();
    expect(scrolled).toEqual(['skills']);
    FakeResizeObserver.instances[0]?.trigger();
    expect(scrolled).toEqual(['skills', 'skills']);
  });

  it('no repite el salto si el usuario ya interactuó', () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    window.history.replaceState(null, '', '#skills');
    mount();
    window.dispatchEvent(new Event('wheel'));
    FakeResizeObserver.instances[0]?.trigger();
    expect(scrolled).toEqual(['skills']);
  });

  it('deja de observar tras la ventana de estabilización y al desmontar', () => {
    vi.useFakeTimers();
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    window.history.replaceState(null, '', '#skills');
    const { unmount } = mount();
    const observer = FakeResizeObserver.instances[0];
    expect(observer?.disconnected).toBe(false);
    vi.advanceTimersByTime(5100);
    expect(observer?.disconnected).toBe(true);
    unmount();
  });
});

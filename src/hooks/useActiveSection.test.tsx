import { act, renderHook, waitFor } from '@testing-library/react';
import { useActiveSection } from './useActiveSection';

/** Crea secciones cuyo borde superior se lee de `tops` (mutable para simular el scroll). */
function mountSections(tops: Record<string, number>): Record<string, number> {
  for (const id of Object.keys(tops)) {
    const el = document.createElement('section');
    el.id = id;
    el.getBoundingClientRect = () => ({ top: tops[id] ?? 0 }) as DOMRect;
    document.body.append(el);
  }
  return tops;
}

describe('useActiveSection', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('marca como activa la última sección que ya pasó bajo la cabecera', () => {
    mountSections({ a: -800, b: -20, c: 400 });
    const { result } = renderHook(() => useActiveSection(['a', 'b', 'c']));
    expect(result.current).toBe('b');
  });

  it('usa la primera sección cuando aún no se ha hecho scroll', () => {
    mountSections({ a: 0, b: 600, c: 1200 });
    const { result } = renderHook(() => useActiveSection(['a', 'b', 'c']));
    expect(result.current).toBe('a');
  });

  it('se actualiza al hacer scroll', async () => {
    const tops = mountSections({ a: 0, b: 600, c: 1200 });
    const { result } = renderHook(() => useActiveSection(['a', 'b', 'c']));
    expect(result.current).toBe('a');

    Object.assign(tops, { a: -700, b: 50, c: 650 });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    await waitFor(() => {
      expect(result.current).toBe('b');
    });
  });
});

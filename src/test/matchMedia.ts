/** matchMedia cuyas consultas cumplidas decide `matches`, con avisos de cambio controlables. */
export function mockViewport(matches: (query: string) => boolean) {
  const listeners = new Set<() => void>();
  let current = matches;
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      get matches() {
        return current(query);
      },
      media: query,
      onchange: null,
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
      dispatchEvent: () => false,
    }),
  });
  return {
    change(next: (query: string) => boolean) {
      current = next;
      for (const listener of listeners) listener();
    },
    listenerCount: () => listeners.size,
  };
}

/** jsdom no implementa matchMedia: simulamos la preferencia de esquema de color. */
export function mockMatchMedia(prefersDark: boolean): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: prefersDark && query.includes('prefers-color-scheme: dark'),
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

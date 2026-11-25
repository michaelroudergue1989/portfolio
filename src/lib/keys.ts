/** Genera claves i18n numeradas: numberedKeys('a.b', 3) → ['a.b.1', 'a.b.2', 'a.b.3']. */
export function numberedKeys(prefix: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix}.${String(index + 1)}`);
}

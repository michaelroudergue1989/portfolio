import type { YearMonth } from '@/types/portfolio';

/** "Mayo 2025" / "May 2025", según el idioma. */
export function formatYearMonth({ year, month }: YearMonth, language: string): string {
  const name = new Intl.DateTimeFormat(language, { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, 1)),
  );
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${String(year)}`;
}

/** Valor ISO 8601 (AAAA-MM) para el atributo datetime de <time>. */
export function toIsoYearMonth({ year, month }: YearMonth): string {
  return `${String(year)}-${String(month).padStart(2, '0')}`;
}

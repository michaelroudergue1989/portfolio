import { formatYearMonth, toIsoYearMonth } from './period';

describe('period', () => {
  it('formatea mes y año con inicial mayúscula en español e inglés', () => {
    expect(formatYearMonth({ year: 2025, month: 5 }, 'es')).toBe('Mayo 2025');
    expect(formatYearMonth({ year: 2024, month: 12 }, 'es')).toBe('Diciembre 2024');
    expect(formatYearMonth({ year: 2025, month: 5 }, 'en')).toBe('May 2025');
    expect(formatYearMonth({ year: 2021, month: 8 }, 'en')).toBe('August 2021');
  });

  it('genera valores ISO AAAA-MM', () => {
    expect(toIsoYearMonth({ year: 2016, month: 6 })).toBe('2016-06');
    expect(toIsoYearMonth({ year: 2024, month: 12 })).toBe('2024-12');
  });
});

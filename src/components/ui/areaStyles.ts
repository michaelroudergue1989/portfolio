import type { AreaId } from '@/types/portfolio';

/**
 * Clases por área profesional. Se escriben completas (no concatenadas) para que
 * Tailwind las detecte. Colores y contraste: ver tokens `--area-*` y contrast.test.ts.
 */
export const areaTone: Record<AreaId, { text: string; soft: string; bar: string }> = {
  software: {
    text: 'text-area-software',
    soft: 'bg-area-software-soft',
    bar: 'bg-area-software',
  },
  leadership: {
    text: 'text-area-leadership',
    soft: 'bg-area-leadership-soft',
    bar: 'bg-area-leadership',
  },
  security: {
    text: 'text-area-security',
    soft: 'bg-area-security-soft',
    bar: 'bg-area-security',
  },
};

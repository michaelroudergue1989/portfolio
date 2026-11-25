import type { Education } from '@/types/portfolio';

/** Orden: más reciente primero. */
export const education: readonly Education[] = [
  {
    id: 'postitulo-ciberseguridad',
    institution: 'Universidad de Chile',
    titleKey: 'education.items.postitulo.title',
    period: { endYear: 2026 },
    hours: 216,
    statusKey: 'education.status.approved',
  },
  {
    id: 'diplomado-proyectos-ti',
    institution: 'Duoc UC',
    titleKey: 'education.items.diplomado.title',
    period: { endYear: 2022 },
    hours: 150,
    noteKey: 'education.items.diplomado.note',
  },
  {
    id: 'ingenieria-informatica',
    institution: 'INACAP',
    titleKey: 'education.items.inacap.title',
    period: { startYear: 2009, endYear: 2016 },
  },
];

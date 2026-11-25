import type { Certification } from '@/types/portfolio';

/**
 * `kind: 'certification'` es solo para credenciales profesionales; el resto son
 * certificados de finalización de curso. No hay enlaces ni identificadores públicos aún
 * (`credentialUrl` se añadirá cuando existan y sean verificables).
 */
export const certifications: readonly Certification[] = [
  {
    id: 'sfpc',
    nameKey: 'certifications.items.sfpc.name',
    issuer: 'CertiProf',
    kind: 'certification',
    year: 2023,
  },
  {
    id: 'iso27001-udemy',
    nameKey: 'certifications.items.iso27001.name',
    issuer: 'Udemy',
    kind: 'course',
    year: 2026,
    hours: 11,
    noteKey: 'certifications.items.iso27001.note',
  },
  {
    id: 'iso9001',
    nameKey: 'certifications.items.iso9001.name',
    issuer: 'Centro de Capacitación UCT',
    kind: 'course',
    year: 2025,
    hours: 22,
  },
  {
    id: 'agile-pm',
    nameKey: 'certifications.items.agile.name',
    issuer: 'SENCE / Fundación Telefónica',
    kind: 'course',
    year: 2024,
    hours: 40,
  },
  {
    id: 'leadership',
    nameKey: 'certifications.items.leadership.name',
    issuer: 'Santander Open Academy',
    kind: 'course',
    year: 2024,
    hours: 8,
  },
  {
    id: 'ai-intro',
    nameKey: 'certifications.items.ai.name',
    issuer: 'BiblioRedes',
    kind: 'course',
    year: 2023,
  },
  {
    id: 'law-21719',
    nameKey: 'certifications.items.law21719.name',
    issuer: 'OTEC WorkForce',
    kind: 'course',
  },
  {
    id: 'data-protection-procedures',
    nameKey: 'certifications.items.dataProtection.name',
    issuer: 'OTEC WorkForce',
    kind: 'course',
  },
];

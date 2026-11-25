import type { ProfessionalProject } from '@/types/portfolio';

/**
 * Proyectos con DENOMINACIONES PROFESIONALES GENÉRICAS. No contienen nombres internos de
 * sistemas ni de organizaciones (las instituciones empleadoras figuran solo en la experiencia).
 *
 * ⚠ No añadir nombres específicos sin autorización expresa (ver docs/PUBLICACION.md): una
 * condición en React no oculta nada, porque los datos viajan en el repositorio, el historial
 * y el JS compilado. Los borradores originales están fuera del repositorio (`private/`).
 */
export const projects: readonly ProfessionalProject[] = [
  {
    id: 'consent-management',
    titleKey: 'projects.consentManagement.title',
    descriptionKey: 'projects.consentManagement.description',
    technologies: ['React', 'NestJS', 'Prisma ORM', 'PostgreSQL', 'Docker', 'MinIO'],
    areaIds: ['software', 'leadership'],
  },
  {
    id: 'community-engagement',
    titleKey: 'projects.communityEngagement.title',
    descriptionKey: 'projects.communityEngagement.description',
    technologies: [],
    areaIds: ['software'],
  },
  {
    id: 'systems-administration',
    titleKey: 'projects.systemsAdministration.title',
    descriptionKey: 'projects.systemsAdministration.description',
    technologies: [],
    areaIds: ['software'],
  },
  {
    id: 'health-management',
    titleKey: 'projects.healthManagement.title',
    descriptionKey: 'projects.healthManagement.description',
    technologies: [],
    areaIds: ['software'],
  },
  {
    id: 'quality-security',
    titleKey: 'projects.qualitySecurity.title',
    descriptionKey: 'projects.qualitySecurity.description',
    technologies: ['SonarQube'],
    areaIds: ['security'],
  },
  {
    id: 'accessibility',
    titleKey: 'projects.accessibility.title',
    descriptionKey: 'projects.accessibility.description',
    technologies: [],
    areaIds: ['software'],
  },
  {
    id: 'ecommerce',
    titleKey: 'projects.ecommerce.title',
    descriptionKey: 'projects.ecommerce.description',
    technologies: ['PrestaShop', 'Webpay Plus'],
    areaIds: ['software'],
  },
];

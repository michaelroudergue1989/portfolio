import type { NavItem } from '@/types/portfolio';
import { SECTION_IDS } from './sections';

/** Navegación principal (barra horizontal de la cabecera). */
export const navItems: readonly NavItem[] = [
  { id: 'home', labelKey: 'nav.home', targetId: SECTION_IDS.home },
  { id: 'about', labelKey: 'nav.about', targetId: SECTION_IDS.about },
  { id: 'experience', labelKey: 'nav.experience', targetId: SECTION_IDS.experience },
  { id: 'projects', labelKey: 'nav.projects', targetId: SECTION_IDS.projects },
  { id: 'skills', labelKey: 'nav.skills', targetId: SECTION_IDS.skills },
  { id: 'education', labelKey: 'nav.education', targetId: SECTION_IDS.education },
  { id: 'certifications', labelKey: 'nav.certifications', targetId: SECTION_IDS.certifications },
  { id: 'contact', labelKey: 'nav.contact', targetId: SECTION_IDS.contact },
];

/**
 * Menú móvil y navegación rápida del pie: la principal más Currículum, que no figura en la
 * barra horizontal para que quepa en 1280 px. Mantiene el orden de las secciones del documento.
 */
export const extendedNavItems: readonly NavItem[] = [
  ...navItems.slice(0, -1),
  { id: 'resumes', labelKey: 'nav.resumes', targetId: SECTION_IDS.resumes },
  ...navItems.slice(-1),
];

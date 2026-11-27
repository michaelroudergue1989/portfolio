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
 * Ventanas en las que se muestra la barra inferior: menos de 768 px de ancho y más de 500 px de
 * alto. Por debajo de 360 px de ancho exige 550 px de alto, porque el Hero ocupa más y la barra
 * taparía «Descargar CV». En `em` para que se retire si el usuario usa una fuente base grande.
 */
export const BOTTOM_NAV_QUERY =
  '(min-width: 22.5em) and (max-width: 47.99875em) and (min-height: 31.26em), ' +
  '(min-width: 20em) and (max-width: 22.49875em) and (min-height: 34.375em)';

/**
 * Menú móvil y navegación rápida del pie: la principal más Currículum, que no figura en la
 * barra horizontal para que quepa en 1280 px. Mantiene el orden de las secciones del documento.
 */
export const extendedNavItems: readonly NavItem[] = [
  ...navItems.slice(0, -1),
  { id: 'resumes', labelKey: 'nav.resumes', targetId: SECTION_IDS.resumes },
  ...navItems.slice(-1),
];

const BOTTOM_NAV_IDS: readonly string[] = ['home', 'experience', 'projects', 'resumes', 'contact'];

/** Accesos directos de la barra inferior móvil: un subconjunto de los mismos destinos. */
export const bottomNavItems: readonly NavItem[] = extendedNavItems
  .filter((item) => BOTTOM_NAV_IDS.includes(item.id))
  .map((item) => (item.id === 'resumes' ? { ...item, labelKey: 'nav.resumesShort' } : item));

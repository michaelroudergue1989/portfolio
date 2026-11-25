/**
 * Identificadores estables de sección (destinos de las anclas #id).
 * No renombrar: forman parte de las URLs públicas (p. ej. /#experience).
 */
export const SECTION_IDS = {
  home: 'home',
  stats: 'stats',
  about: 'about',
  areas: 'areas',
  experience: 'experience',
  projects: 'projects',
  skills: 'skills',
  education: 'education',
  certifications: 'certifications',
  resumes: 'resumes',
  contact: 'contact',
} as const;

export type SectionId = (typeof SECTION_IDS)[keyof typeof SECTION_IDS];

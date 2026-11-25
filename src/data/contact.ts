import type { ContactLink } from '@/types/portfolio';

/**
 * Enlaces profesionales proporcionados por el propietario. No se publican correo ni
 * teléfono sin autorización explícita.
 */
export const contactLinks: readonly ContactLink[] = [
  {
    id: 'linkedin',
    kind: 'linkedin',
    labelKey: 'contact.linkedin',
    url: 'https://www.linkedin.com/in/michael-roudergue-a69035150',
  },
  {
    id: 'github',
    kind: 'github',
    labelKey: 'contact.github',
    url: 'https://github.com/michaelroudergue1989',
  },
];

export type InterestIcon = 'code' | 'users' | 'workflow' | 'shield' | 'lock';

export interface ContactInterest {
  id: string;
  icon: InterestIcon;
  labelKey: string;
}

/** Tipos de oportunidad laboral de interés (orientan a reclutadores). */
export const contactInterests: readonly ContactInterest[] = [
  { id: 'software', icon: 'code', labelKey: 'contact.interests.software' },
  { id: 'leadership', icon: 'users', labelKey: 'contact.interests.leadership' },
  { id: 'projects', icon: 'workflow', labelKey: 'contact.interests.projects' },
  { id: 'cybersecurity', icon: 'shield', labelKey: 'contact.interests.cybersecurity' },
  { id: 'infosec', icon: 'lock', labelKey: 'contact.interests.infosec' },
];

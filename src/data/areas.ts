import type { ProfessionalArea } from '@/types/portfolio';

/** Resumen por área. El detalle vive en experiencia, habilidades, formación y certificaciones. */
export const areas: readonly ProfessionalArea[] = [
  {
    id: 'software',
    icon: 'code',
    titleKey: 'areas.software.title',
    shortTitleKey: 'areas.software.shortTitle',
    descriptionKey: 'areas.software.description',
    experienceKeys: [
      'areas.software.experience.fullStack',
      'areas.software.experience.requirements',
    ],
    technologies: ['PHP', 'JavaScript', 'React', 'NestJS'],
    trainingKeys: ['areas.software.training.inacap'],
  },
  {
    id: 'leadership',
    icon: 'users',
    titleKey: 'areas.leadership.title',
    shortTitleKey: 'areas.leadership.shortTitle',
    descriptionKey: 'areas.leadership.description',
    experienceKeys: [
      'areas.leadership.experience.coordination',
      'areas.leadership.experience.techLead',
      'areas.leadership.experience.agile',
    ],
    technologies: [],
    trainingKeys: ['areas.leadership.training.diplomado'],
  },
  {
    id: 'security',
    icon: 'shield',
    titleKey: 'areas.security.title',
    shortTitleKey: 'areas.security.shortTitle',
    descriptionKey: 'areas.security.description',
    experienceKeys: ['areas.security.experience.quality'],
    technologies: ['SonarQube'],
    trainingKeys: ['areas.security.training.postitulo', 'areas.security.training.iso27001'],
  },
];

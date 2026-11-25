import type { Skill, SkillGroup } from '@/types/portfolio';

/** Niveles de autoevaluación profesional (perfil en Get on Board). No son mediciones. */
export const coreSkills: readonly Skill[] = [
  { id: 'full-stack', nameKey: 'skills.names.fullStack', level: 'advanced' },
  { id: 'php', name: 'PHP', level: 'advanced' },
  { id: 'javascript', name: 'JavaScript', level: 'advanced' },
  { id: 'tech-lead', name: 'Tech Lead', level: 'advanced' },
  { id: 'react', name: 'React', level: 'intermediate' },
  { id: 'nestjs', name: 'NestJS', level: 'intermediate' },
  { id: 'project-management', nameKey: 'skills.names.projectManagement', level: 'intermediate' },
  { id: 'scrum', name: 'Scrum', level: 'intermediate' },
  { id: 'cybersecurity', nameKey: 'skills.names.cybersecurity', level: 'intermediate' },
  {
    id: 'information-security',
    nameKey: 'skills.names.informationSecurity',
    level: 'intermediate',
  },
];

/** Tecnologías y competencias complementarias, sin niveles asignados. */
export const skillGroups: readonly SkillGroup[] = [
  {
    id: 'languages',
    titleKey: 'skills.groups.languages',
    skills: [
      { id: 'typescript', name: 'TypeScript' },
      { id: 'javascript', name: 'JavaScript' },
      { id: 'php', name: 'PHP' },
      { id: 'react', name: 'React' },
      { id: 'nestjs', name: 'NestJS' },
      { id: 'extjs', name: 'ExtJS' },
      { id: 'yii2', name: 'Yii2' },
      { id: 'laravel', name: 'Laravel' },
      { id: 'codeigniter3', name: 'CodeIgniter 3' },
      { id: 'jquery', name: 'jQuery' },
      { id: 'bootstrap', name: 'Bootstrap' },
    ],
  },
  {
    id: 'databases',
    titleKey: 'skills.groups.databases',
    skills: [
      { id: 'postgresql', name: 'PostgreSQL' },
      { id: 'sqlserver', name: 'SQL Server' },
      { id: 'mysql', name: 'MySQL' },
      { id: 'sybase', name: 'Sybase' },
      { id: 'oracle', name: 'Oracle' },
    ],
  },
  {
    id: 'tooling',
    titleKey: 'skills.groups.tooling',
    skills: [
      { id: 'docker', name: 'Docker' },
      { id: 'minio', name: 'MinIO' },
      { id: 'prisma', name: 'Prisma ORM' },
      { id: 'git', name: 'Git' },
      { id: 'gitlab', name: 'GitLab' },
      { id: 'github', name: 'GitHub' },
      { id: 'sonarqube', name: 'SonarQube' },
      { id: 'n8n', name: 'n8n' },
      { id: 'carbone', name: 'Carbone.io' },
    ],
  },
  {
    id: 'projectManagement',
    titleKey: 'skills.groups.projectManagement',
    skills: [
      { id: 'technical-coordination', nameKey: 'skills.names.technicalCoordination' },
      { id: 'requirements', nameKey: 'skills.names.requirements' },
      { id: 'technical-planning', nameKey: 'skills.names.technicalPlanning' },
      { id: 'deliverables', nameKey: 'skills.names.deliverables' },
      { id: 'scrum', name: 'Scrum' },
      { id: 'pmbok', name: 'PMBOK v6', basis: 'education' },
      { id: 'documentation', nameKey: 'skills.names.documentation' },
    ],
  },
  {
    id: 'cybersecurity',
    titleKey: 'skills.groups.cybersecurity',
    skills: [
      { id: 'software-security', nameKey: 'skills.names.softwareSecurity', basis: 'experience' },
      { id: 'static-analysis', nameKey: 'skills.names.staticAnalysis', basis: 'experience' },
      { id: 'information-security', nameKey: 'skills.names.informationSecurity' },
      { id: 'risk-management', nameKey: 'skills.names.riskManagement', basis: 'education' },
      { id: 'isms', nameKey: 'skills.names.isms', basis: 'education' },
      { id: 'iso27001', name: 'ISO/IEC 27001 / 27002', basis: 'education' },
      { id: 'data-protection', nameKey: 'skills.names.dataProtection', basis: 'education' },
      { id: 'law-21663', nameKey: 'skills.names.law21663', basis: 'education' },
      { id: 'law-21719', nameKey: 'skills.names.law21719', basis: 'education' },
    ],
  },
];

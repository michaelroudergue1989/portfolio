/**
 * Modelo de datos del portafolio.
 *
 * Convenciones:
 * - Los campos `*Key` son claves de i18n (texto traducible, en src/i18n/locales).
 * - Los nombres propios (organizaciones, tecnologías, credenciales oficiales) se guardan
 *   como texto literal o como clave cuyo valor conserva la denominación original.
 * - No se registran datos que no estén confirmados por el propietario.
 */

export type Language = 'es' | 'en';

export type AreaId = 'software' | 'leadership' | 'security';

export type AreaIconName = 'code' | 'users' | 'shield';

/** Mes en base 1 (1 = enero). */
export interface YearMonth {
  year: number;
  month: number;
}

export interface DateRange {
  start: YearMonth;
  end: YearMonth | 'present';
}

export interface ProfilePhoto {
  /** Ruta bajo /public o URL importada. Opcional: sin foto se muestra el monograma. */
  src: string;
  /** Clave i18n del texto alternativo. */
  altKey: string;
  width: number;
  height: number;
}

export interface ProfessionalProfile {
  fullName: string;
  displayName: string;
  titleKey: string;
  locationKey: string;
  /** Se muestra como "9+ años". */
  yearsOfExperience: number;
  /** Fotografía profesional real; se omite mientras no exista. */
  photo?: ProfilePhoto;
}

export interface ProfessionalArea {
  id: AreaId;
  icon: AreaIconName;
  titleKey: string;
  shortTitleKey: string;
  descriptionKey: string;
  /** Competencias respaldadas por experiencia laboral. */
  experienceKeys: readonly string[];
  /** Tecnologías con las que se ha trabajado (nombres propios, sin traducir). */
  technologies: readonly string[];
  /** Formación académica y cursos relacionados (se muestran separados de la experiencia). */
  trainingKeys: readonly string[];
}

export interface WorkExperience {
  id: string;
  organization: string;
  /** Unidad dentro de la organización, si corresponde (clave i18n). */
  unitKey?: string;
  roleKey: string;
  period: DateRange;
  responsibilityKeys: readonly string[];
  technologies: readonly string[];
}

/**
 * Proyecto / ámbito de trabajo PUBLICABLE.
 *
 * REGLA DE CONFIDENCIALIDAD: todo lo que está en el código versionado es público (repositorio,
 * historial, JS compilado, locales). Por eso aquí solo existen entradas genéricas, basadas en
 * competencias, sin nombres internos de proyectos ni de organizaciones. Los proyectos con nombre
 * pendientes de autorización viven fuera del repositorio (carpeta `private/`, ignorada por Git).
 * Ver docs/PUBLICACION.md.
 */
export interface ProfessionalProject {
  id: string;
  titleKey: string;
  descriptionKey: string;
  /** Solo tecnologías confirmadas para ese ámbito concreto. */
  technologies: readonly string[];
  areaIds: readonly AreaId[];
  /** Solo con autorización explícita; no existen por ahora. */
  repositoryUrl?: string;
  demoUrl?: string;
}

export type SkillLevel = 'basic' | 'intermediate' | 'advanced';

export type SkillGroupId =
  'languages' | 'databases' | 'tooling' | 'projectManagement' | 'cybersecurity';

export interface Skill {
  id: string;
  /** Nombre literal (tecnologías y términos que no se traducen). */
  name?: string;
  /** Clave i18n cuando el nombre se traduce. Tiene prioridad sobre `name`. */
  nameKey?: string;
  /** Autoevaluación profesional; solo para las habilidades principales. */
  level?: SkillLevel;
  /** Origen principal de la competencia; `education` = formación académica. */
  basis?: 'experience' | 'education';
}

export interface SkillGroup {
  id: SkillGroupId;
  titleKey: string;
  skills: readonly Skill[];
}

export interface Education {
  id: string;
  institution: string;
  /** Denominación oficial del programa (con glosa en inglés en el locale `en`). */
  titleKey: string;
  period: { startYear?: number; endYear: number };
  hours?: number;
  /** Clave i18n del estado (p. ej. "Aprobado"). */
  statusKey?: string;
  noteKey?: string;
}

export interface Certification {
  id: string;
  nameKey: string;
  issuer: string;
  /** `certification`: credencial profesional. `course`: certificado de finalización de curso. */
  kind: 'certification' | 'course';
  year?: number;
  hours?: number;
  noteKey?: string;
  /** Enlace público verificable (https). Aún no existen. */
  credentialUrl?: string;
}

/**
 * Currículum profesional: existe un único documento público.
 *
 * Los metadatos (idioma, fecha de actualización y número de páginas) describen el PDF ya
 * revisado. `available` es el único interruptor de publicación: mientras sea false no se
 * genera ningún enlace y el PDF NO debe estar en public/cv/ (lo verifica el build). Habilitarlo
 * exige autorización expresa, el archivo en la ruta indicada y metadatos coherentes.
 */
export interface Resume {
  /** Ruta pública prevista (/cv/nombre.pdf). Solo se enlaza si `available` es true. */
  path: string;
  available: boolean;
  /** Idioma del documento (se declara como atributo `hreflang`/`lang` del enlace). */
  language: Language;
  /** Fecha real de la última versión del PDF (AAAA-MM-DD). */
  updatedAt: string;
  /** Número de páginas verificado del PDF. */
  pages: number;
}

export type ContactKind = 'github' | 'linkedin' | 'email';

export interface ContactLink {
  id: string;
  kind: ContactKind;
  labelKey: string;
  /** URL https (github/linkedin) o dirección de correo (email). */
  url: string;
}

export interface NavItem {
  id: string;
  labelKey: string;
  /** Id estable de la sección destino, sin '#'. */
  targetId: string;
}

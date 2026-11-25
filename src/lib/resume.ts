import type { Resume } from '@/types/portfolio';

/** Ruta pública válida del currículum: /cv/<nombre>.pdf, sin subdirectorios ni '..'. */
export const RESUME_PATH_PATTERN = /^\/cv\/[a-z0-9][a-z0-9-]*\.pdf$/;

/**
 * El currículum solo es descargable/visible si está habilitado, su ruta es válida y sus
 * metadatos son coherentes. Cualquier otro caso se trata como no disponible: nunca se genera
 * un enlace que pueda estar roto.
 */
export function isDownloadable(resume: Resume): boolean {
  return (
    resume.available &&
    RESUME_PATH_PATTERN.test(resume.path) &&
    /^\d{4}-\d{2}-\d{2}$/.test(resume.updatedAt) &&
    Number.isInteger(resume.pages) &&
    resume.pages > 0
  );
}

/** Nombre de archivo sugerido para la descarga (el último segmento de la ruta). */
export function resumeFileName(resume: Resume): string {
  return resume.path.slice(resume.path.lastIndexOf('/') + 1);
}

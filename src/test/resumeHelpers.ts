import { resume } from '@/data/resume';
import type { Resume } from '@/types/portfolio';

/** Variante deshabilitada del manifiesto real, para probar el estado «aún no autorizado». */
export function disabledResume(overrides: Record<string, unknown> = {}): Resume {
  return { ...resume, available: false, ...overrides };
}

/** Variante habilitada del manifiesto real para probar la disponibilidad condicionada. */
export function enabledResume(overrides: Record<string, unknown> = {}): Resume {
  return { ...resume, available: true, ...overrides };
}

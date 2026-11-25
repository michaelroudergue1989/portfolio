import type { Resume } from '@/types/portfolio';
import manifest from './resume.json';

/**
 * El manifiesto `resume.json` es la única fuente de verdad (también lo lee el verificador de
 * publicación en el build). Para habilitar el CV público:
 *   1. Contar con autorización expresa y haber revisado el PDF (ver docs/PUBLICACION.md).
 *   2. Colocar el PDF en public/cv/ con el nombre indicado en `path`.
 *   3. En resume.json: `"available": true` y comprobar `language`, `updatedAt` y `pages`.
 * Ningún PDF debe existir en public/cv/ mientras `available` sea false.
 */
export const resume: Resume = manifest as Resume;

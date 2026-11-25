export interface PdfInspection {
  isPdf: boolean;
  pages: number;
  text: string;
  /** Texto extraído de cada página (mismo orden que las páginas encontradas). */
  pageTexts: string[];
  info: {
    author?: string;
    title?: string;
    creator?: string;
    producer?: string;
    subject?: string;
    keywords?: string;
  };
  metadataText: string;
  hasXmp: boolean;
  xmpSoftware: boolean;
  encrypted: boolean;
  /** Estructuras que el inspector no puede analizar de forma fiable (deben tratarse como error). */
  limitations: string[];
  /** Marcas de contenido activo o adjuntos presentes (JavaScript, archivos incrustados, formularios…). */
  activeContent: string[];
  /** Destinos de las anotaciones de enlace (URI). */
  uris: string[];
  images: number;
  incremental: boolean;
}

export const MIN_PAGE_TEXT_CHARS: number;
export function decodePdfString(token: string): string;
export function inspectPdf(buffer: Uint8Array): PdfInspection;

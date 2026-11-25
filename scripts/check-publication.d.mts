import type { PdfInspection } from './pdf-text.mjs';

export interface ManifestResume {
  path: string;
  available: boolean;
  language?: string;
  updatedAt?: string;
  pages?: number;
}

export interface FileEntry {
  path: string;
  content?: string | undefined;
  size?: number | undefined;
  head?: string | undefined;
}

export interface PublicationInput {
  resume: ManifestResume;
  distFiles: FileEntry[];
  trackedFiles: FileEntry[] | null;
  denylist?: string[] | null;
  locales?: { es: object; en: object };
  profileUrls?: string[];
  siteUrl?: string | undefined;
  strictPrivate?: boolean;
}

export interface PublicationResult {
  errors: string[];
  warnings: string[];
  limitations: string[];
  privateReviewComplete: boolean;
}

export const TIERS: Record<'structural' | 'pdf' | 'dist' | 'meta' | 'content' | 'private', string>;
export const ALLOWED_PROFILE_URLS: string[];
export const PUBLIC_PDF_AUTHOR: string;
export const ALLOWED_DIST_HOSTS: Set<string>;
export const REVIEWED_BINARIES: Map<string, string>;
export const PATTERNS: Record<
  | 'email'
  | 'phone'
  | 'chileMobile'
  | 'landline'
  | 'rut'
  | 'rutLoose'
  | 'obfuscatedEmail'
  | 'localPath'
  | 'placeholder',
  RegExp
>;

export function evaluatePublication(input: PublicationInput): PublicationResult;
export function findPersonalData(text: string): string[];
export function pdfIntegrityIssues(pdf: PdfInspection): string[];
export function isTextPath(path: string): boolean;
export function runCheck(options?: {
  root?: string;
  distDir?: string;
  strictPrivate?: boolean;
  siteUrl?: string | undefined;
  /** Ruta de la lista privada (por defecto, private/denylist.txt dentro de `root`). */
  denylistPath?: string;
}): PublicationResult;

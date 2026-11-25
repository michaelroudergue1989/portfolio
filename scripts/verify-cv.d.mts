export interface CvVerification {
  errors: string[];
  warnings: string[];
  facts: Record<string, string | number | boolean>;
}

export function verifyCv(
  buffer: Uint8Array,
  options?: { pages?: number; language?: string; denylist?: string[] | null },
): CvVerification;

type ClassValue = string | false | null | undefined;

/** Une clases CSS descartando valores falsos. */
export function cx(...values: ClassValue[]): string {
  return values.filter(Boolean).join(' ');
}

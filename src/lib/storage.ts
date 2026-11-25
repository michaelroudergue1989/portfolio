/** Acceso tolerante a localStorage (puede estar bloqueado o lleno). */
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Sin almacenamiento disponible: la preferencia vale solo para la sesión.
  }
}

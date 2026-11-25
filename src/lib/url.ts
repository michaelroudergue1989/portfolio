/**
 * Devuelve la URL normalizada si es un destino externo seguro:
 * protocolo `https:`, con host y sin credenciales embebidas. Si no, `null`.
 */
export function parseSafeHttpsUrl(value: string): URL | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname === '') return null;
  if (url.username !== '' || url.password !== '') return null;
  return url;
}

export function isSafeHttpsUrl(value: string): boolean {
  return parseSafeHttpsUrl(value) !== null;
}

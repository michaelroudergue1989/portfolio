import { isSafeHttpsUrl, parseSafeHttpsUrl } from './url';

describe('isSafeHttpsUrl', () => {
  it.each([
    'https://github.com/michaelroudergue1989',
    'https://example.com/path?query=1#hash',
    'HTTPS://EXAMPLE.COM',
  ])('acepta %s', (value) => {
    expect(isSafeHttpsUrl(value)).toBe(true);
  });

  it.each([
    ['http plano', 'http://example.com'],
    ['javascript:', 'javascript:alert(1)'],
    ['data:', 'data:text/html,<script>alert(1)</script>'],
    ['mailto:', 'mailto:alguien@example.com'],
    ['ruta relativa', '/ruta/interna'],
    ['protocolo relativo', '//example.com'],
    ['cadena vacía', ''],
    ['texto libre', 'no es una url'],
    ['credenciales embebidas', 'https://usuario:clave@example.com'],
    ['usuario sin clave', 'https://usuario@example.com'],
  ])('rechaza %s', (_name, value) => {
    expect(isSafeHttpsUrl(value)).toBe(false);
  });

  it('devuelve la URL normalizada', () => {
    expect(parseSafeHttpsUrl('HTTPS://Example.com')?.href).toBe('https://example.com/');
  });
});

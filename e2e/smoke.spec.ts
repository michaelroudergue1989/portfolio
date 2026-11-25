import { readFileSync } from 'node:fs';
import { DESKTOP, expect, SECTION_IDS, test } from './fixtures';

const vercel = JSON.parse(readFileSync('vercel.json', 'utf8')) as {
  headers: { source: string; headers: { key: string; value: string }[] }[];
};
const expectedHeaders = vercel.headers.find((rule) => rule.source === '/(.*)')?.headers ?? [];

test.describe('carga inicial', () => {
  test.use({ viewport: DESKTOP });

  test('carga la página con título, idioma, h1 y todas las secciones', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('Michael Roudergue | Ingeniero en Informática');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Michael Roudergue');
    for (const id of SECTION_IDS) await expect(page.locator(`main #${id}`)).toHaveCount(1);
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('las fuentes autoalojadas se cargan y no hay desbordamiento horizontal', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const result = await page.evaluate(() => ({
      inter: document.fonts.check('16px "Inter Variable"'),
      mono: document.fonts.check('16px "JetBrains Mono Variable"'),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    }));
    expect(result).toEqual({ inter: true, mono: true, overflow: false });
  });

  test('sin desbordamiento horizontal desde 320 px (reflujo, equivalente a 400 % de zoom)', async ({
    page,
  }) => {
    for (const width of [320, 360, 375, 720, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto('/');
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflow, `desbordamiento a ${String(width)} px`).toBe(false);
    }
  });

  test('las cabeceras de seguridad de vercel.json se aplican a la respuesta', async ({ page }) => {
    const response = await page.request.get('/');
    expect(expectedHeaders.length).toBeGreaterThan(5);
    for (const { key, value } of expectedHeaders) {
      expect(response.headers()[key.toLowerCase()], key).toBe(value);
    }
  });

  test('la CSP no admite unsafe-inline ni unsafe-eval y restringe el origen', async ({ page }) => {
    const csp = (await page.request.get('/')).headers()['content-security-policy'] ?? '';
    expect(csp).not.toMatch(/unsafe-inline|unsafe-eval|\*/);
    for (const directive of [
      "default-src 'none'",
      "script-src 'self'",
      "style-src 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'none'",
    ]) {
      expect(csp).toContain(directive);
    }
  });

  test('robots.txt es indexable y no inventa dominio; sin sitemap sin SITE_URL', async ({
    page,
  }) => {
    const robots = await page.request.get('/robots.txt');
    expect(robots.status()).toBe(200);
    const body = await robots.text();
    expect(body).toMatch(/^User-agent: \*/m);
    expect(body).not.toMatch(/Disallow:\s*\/\s*$/m);
    expect(body).not.toMatch(/Sitemap:/);
    await page.goto('/');
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(0);
  });

  test('no se publican mapas de código fuente ni archivos privados', async ({ page }) => {
    await page.goto('/');
    const scriptSrc = await page.locator('script[type="module"]').getAttribute('src');
    expect(scriptSrc).toMatch(/^\/assets\/.+\.js$/);
    const source = await (await page.request.get(scriptSrc ?? '')).text();
    expect(source).not.toMatch(/sourceMappingURL/);
    for (const path of [`${scriptSrc ?? ''}.map`, '/private/denylist.txt', '/.env']) {
      const type = (await page.request.get(path)).headers()['content-type'] ?? '';
      // vite preview devuelve index.html (SPA) para rutas desconocidas; Vercel devuelve 404.
      expect(type, path).toContain('text/html');
    }
  });

  test('solo existe el PDF público: ninguna otra ruta de CV responde con un PDF', async ({
    page,
  }) => {
    const paths = [
      'michael-roudergue-cv-maestro',
      'michael-roudergue-cv-jefatura-proyectos',
      'michael-roudergue-cv-desarrollo',
      'michael-roudergue-cv-ciberseguridad',
    ];
    for (const name of paths) {
      const response = await page.request.get(`/cv/${name}.pdf`);
      expect(response.headers()['content-type'] ?? '', name).not.toContain('pdf');
    }
  });

  test('/favicon.ico responde con un icono válido del propio origen (sin 404)', async ({
    page,
  }) => {
    const response = await page.request.get('/favicon.ico');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type'] ?? '').toMatch(/^image\//);
    expect(response.headers()['content-security-policy']).toContain("default-src 'none'");
    const body = await response.body();
    expect([...body.subarray(0, 4)]).toEqual([0, 0, 1, 0]); // cabecera ICO
    // El favicon SVG declarado en index.html no cambia.
    await page.goto('/');
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
  });

  test('solo se guardan en localStorage las preferencias de tema e idioma', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Cambiar a tema oscuro' }).click();
    await page.getByRole('button', { name: 'EN, English' }).click();
    const storage = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
    expect(storage).toEqual({ 'portfolio-theme': 'dark', 'portfolio-lang': 'en' });
    expect(await page.evaluate(() => document.cookie)).toBe('');
  });
});

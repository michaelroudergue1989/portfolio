import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { verifyCv } from '../scripts/verify-cv.mjs';
import { DESKTOP, expect, MOBILE, test } from './fixtures';

const PDF_PATH = '/cv/michael-roudergue-cv.pdf';
const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');
const publicFile = readFileSync('public/cv/michael-roudergue-cv.pdf');
const distFile = readFileSync('dist/cv/michael-roudergue-cv.pdf');
const resume = JSON.parse(readFileSync('src/data/resume.json', 'utf8')) as {
  available: boolean;
  pages: number;
  language: string;
};

test.describe('CV público real (archivo servido por el build)', () => {
  test.use({ viewport: DESKTOP });

  test('dist/ contiene exactamente el PDF autorizado de public/', () => {
    expect(resume.available).toBe(true);
    expect(sha256(distFile)).toBe(sha256(publicFile));
  });

  test('responde 200 con application/pdf, cabeceras de seguridad y el mismo contenido', async ({
    page,
  }) => {
    const response = await page.request.get(PDF_PATH);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/pdf');
    expect(response.headers()['x-content-type-options']).toBe('nosniff');
    expect(response.headers()['content-security-policy']).toContain("default-src 'none'");
    const body = await response.body();
    expect(body.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    expect(sha256(body)).toBe(sha256(publicFile));
  });

  test('el PDF servido supera la verificación de contenido (sin datos privados)', async ({
    page,
  }) => {
    const body = await (await page.request.get(PDF_PATH)).body();
    const result = verifyCv(new Uint8Array(body), {
      pages: resume.pages,
      language: resume.language,
      denylist: [],
    });
    expect(result.errors).toEqual([]);
    expect(result.facts.pages).toBe(2);
    expect(result.facts.linkAnnotations).toBe(1);
  });

  test('"Descargar CV" del Hero descarga el PDF íntegro', async ({ page }) => {
    await page.goto('/');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page
        .locator('#home')
        .getByRole('link', { name: /Descargar CV/ })
        .click(),
    ]);
    expect(download.suggestedFilename()).toBe('michael-roudergue-cv.pdf');
    const path = await download.path();
    expect(sha256(readFileSync(path))).toBe(sha256(publicFile));
  });

  test('"Descargar CV" de la sección Currículum descarga el mismo PDF', async ({ page }) => {
    await page.goto('/#resumes');
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page
        .locator('#resumes')
        .getByRole('link', { name: /Descargar CV/ })
        .click(),
    ]);
    expect(download.suggestedFilename()).toBe('michael-roudergue-cv.pdf');
    expect(sha256(readFileSync(await download.path()))).toBe(sha256(publicFile));
  });

  test('"Visualizar CV" abre una pestaña nueva con el PDF y sin vínculo con la página', async ({
    page,
    context,
  }) => {
    await page.goto('/#resumes');
    const link = page.locator('#resumes').getByRole('link', { name: /Visualizar CV/ });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    // Los navegadores sin ventana no tienen visor de PDF: según el motor, la navegación de la
    // pestaña nueva se convierte en una descarga y la pestaña queda sin URL.
    // Para comprobar de forma determinista el comportamiento de la PÁGINA (pestaña nueva, URL y
    // desvinculación del opener) se sustituye solo esa navegación por un HTML mínimo. El contenido
    // real del PDF se verifica byte a byte en las otras pruebas, y su visualización en Chromium y
    // Firefox con ventana (docs/PRUEBAS.md).
    await context.route(`**${PDF_PATH}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>visor</title>',
      }),
    );
    const [popup] = await Promise.all([context.waitForEvent('page'), link.click()]);
    await popup.waitForLoadState();
    expect(new URL(popup.url()).pathname).toBe(PDF_PATH);
    expect(await popup.evaluate(() => window.opener === null)).toBe(true);
    expect(page.url()).toContain('/#resumes');
    await popup.close();
  });

  test('"Ver experiencia" y la navegación hacia Currículum siguen funcionando', async ({
    page,
  }) => {
    await page.goto('/');
    await page
      .locator('#home')
      .getByRole('link', { name: /Ver experiencia/ })
      .click();
    await expect(page).toHaveURL(/#experience$/);
    await page
      .getByRole('navigation', { name: 'Navegación rápida' })
      .getByRole('link', { name: 'Currículum' })
      .click();
    await expect(page).toHaveURL(/#resumes$/);
    await expect(page.locator('#resumes')).toBeInViewport();
  });
});

for (const lang of ['es', 'en'] as const) {
  for (const theme of ['light', 'dark'] as const) {
    for (const [device, viewport] of [
      ['escritorio', DESKTOP],
      ['móvil', MOBILE],
    ] as const) {
      test(`CV disponible: ${lang}, tema ${theme}, ${device} (sin errores de consola ni CSP)`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await page.emulateMedia({ colorScheme: theme });
        await page.addInitScript(
          ([l, t]) => {
            localStorage.setItem('portfolio-lang', l ?? '');
            localStorage.setItem('portfolio-theme', t ?? '');
          },
          [lang, theme],
        );
        await page.goto('/');
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
        const download = lang === 'es' ? /Descargar CV/ : /Download CV/;
        const view = lang === 'es' ? /Visualizar CV/ : /View CV/;
        await expect(page.locator('#home').getByRole('link', { name: download })).toBeVisible();
        const section = page.locator('#resumes');
        await section.scrollIntoViewIfNeeded();
        await expect(section.getByRole('link', { name: download })).toBeVisible();
        await expect(section.getByRole('link', { name: view })).toBeVisible();
        await expect(section.getByRole('button')).toHaveCount(0);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
        );
        expect(overflow).toBe(false);
      });
    }
  }
}

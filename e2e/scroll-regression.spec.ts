/**
 * Regresión: pulsar contenido de <main> devolvía la página al inicio y, en WebKit (y con enlaces
 * medio tapados en cualquier motor), la página se movía entre presionar y soltar, perdiendo el clic.
 * Todas las interacciones son reales (ratón o toque), sin reintentos, clics forzados ni esperas fijas.
 */
import type { BrowserContext, Locator, Page } from '@playwright/test';
import { DESKTOP, expect, HEADER_HEIGHT, MOBILE, test } from './fixtures';

/** Duración de una pulsación humana (ms): deja tiempo a que cualquier ajuste actúe antes de soltar. */
const PRESS_MS = 100;
const PDF_PATH = '/cv/michael-roudergue-cv.pdf';

const CONTENT: readonly (readonly [string, string])[] = [
  ['título de una tarjeta de proyecto', '#projects li:nth-child(1) h3'],
  ['descripción de una tarjeta de proyecto', '#projects li:nth-child(1) article > p'],
  ['etiqueta tecnológica', '#projects li:nth-child(1) article ul li'],
  ['título de otra tarjeta', '#projects li:nth-child(3) h3'],
  ['encabezado de Proyectos', '#projects-title'],
  ['texto de Sobre mí', '#about p'],
  ['texto de Experiencia', '#experience li'],
  ['texto de Habilidades', '#skills h3'],
  ['texto de Formación', '#education h3'],
  ['texto de Certificaciones', '#certifications li'],
  ['nombre en la tarjeta de Currículum', '#resumes article h3'],
  ['encabezado de Contacto', '#contact h2'],
];

/** Dos fotogramas: cualquier ajuste programado tras el foco ya se habrá ejecutado. */
const settle = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve();
          });
        });
      }),
  );

const position = (page: Page) =>
  page.evaluate(() => ({ y: window.scrollY, hash: location.hash, path: location.pathname }));

async function open(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#contact')).toHaveCount(1);
  // Desplazamientos de preparación instantáneos (el comportamiento probado es el del clic).
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
  });
}

async function center(page: Page, target: Locator): Promise<void> {
  await target.evaluate((node) => {
    node.scrollIntoView({ block: 'center' });
  });
  await settle(page);
}

/** La posición, el hash y la ruta no cambian (tolerancia de 1 px por redondeo del navegador). */
async function expectStill(page: Page, before: Awaited<ReturnType<typeof position>>) {
  await settle(page);
  const after = await position(page);
  expect(
    Math.abs(after.y - before.y),
    `scrollY ${String(before.y)} -> ${String(after.y)}`,
  ).toBeLessThanOrEqual(1);
  expect(after.hash).toBe(before.hash);
  expect(after.path).toBe(before.path);
}

async function stubExternal(context: BrowserContext): Promise<void> {
  const page = {
    status: 200,
    contentType: 'text/html',
    body: '<!doctype html><title>externo</title>',
  };
  await context.route(/^https:\/\/(www\.linkedin|github)\.com\//, (route) => route.fulfill(page));
}

for (const mode of ['ratón', 'ratón con pulsación', 'toque'] as const) {
  test.describe(`clic en contenido no interactivo (${mode})`, () => {
    test.use(mode === 'toque' ? { viewport: MOBILE, hasTouch: true } : { viewport: DESKTOP });

    const press = (target: Locator, position?: { x: number; y: number }) => {
      if (mode === 'toque') return target.tap(position ? { position } : {});
      return target.click({
        ...(mode === 'ratón con pulsación' ? { delay: PRESS_MS } : {}),
        ...(position ? { position } : {}),
      });
    };

    test('no desplaza la página ni cambia la URL en ninguna sección', async ({ page }) => {
      await open(page);
      for (const [name, selector] of CONTENT) {
        await test.step(name, async () => {
          const target = page.locator(selector).first();
          await center(page, target);
          const before = await position(page);
          expect(before.y, name).toBeGreaterThan(0);
          await press(target);
          await expectStill(page, before);
        });
      }
    });

    test('tampoco al pulsar un espacio vacío de una tarjeta', async ({ page }) => {
      await open(page);
      const card = page.locator('#projects li:nth-child(1) article');
      await center(page, card);
      const before = await position(page);
      await press(card, { x: 8, y: 12 });
      await expectStill(page, before);
    });
  });
}

test.describe('enlaces y botones de <main> con la página desplazada (pulsación de 100 ms)', () => {
  test.use({ viewport: DESKTOP });

  for (const [name, host] of [
    ['LinkedIn', 'linkedin.com'],
    ['GitHub', 'github.com'],
  ] as const) {
    test(`Contacto: ${name} abre su pestaña sin mover la página`, async ({ page, context }) => {
      await stubExternal(context);
      await open(page);
      const link = page.locator(`#contact a[href*="${host}"]`);
      await center(page, link);
      const before = await position(page);
      const opened = context.waitForEvent('page');
      await link.click({ delay: PRESS_MS });
      const popup = await opened;
      await popup.waitForLoadState();
      expect(popup.url()).toContain(host);
      await popup.close();
      await expectStill(page, before);
    });
  }

  test('Contacto: el enlace interno a Currículum navega', async ({ page }) => {
    await open(page);
    const link = page.locator('#contact a[href="#resumes"]');
    await center(page, link);
    await link.click({ delay: PRESS_MS });
    await expect(page).toHaveURL(/#resumes$/);
  });

  test('Hero desplazado: «Ver experiencia» navega', async ({ page }) => {
    await open(page);
    await page.evaluate(() => {
      window.scrollTo(0, 60);
    });
    await page.locator('#home a[href="#experience"]').click({ delay: PRESS_MS });
    await expect(page).toHaveURL(/#experience$/);
  });

  for (const [name, selector, offset] of [
    ['Hero desplazado', '#home a[download]', 120],
    ['sección Currículum', '#resumes a[download]', null],
  ] as const) {
    test(`${name}: «Descargar CV» descarga`, async ({ page }) => {
      await open(page);
      const link = page.locator(selector);
      if (offset === null) await center(page, link);
      else
        await page.evaluate((y) => {
          window.scrollTo(0, y);
        }, offset);
      const before = await position(page);
      const download = page.waitForEvent('download');
      await link.click({ delay: PRESS_MS });
      expect((await download).suggestedFilename()).toBe('michael-roudergue-cv.pdf');
      await expectStill(page, before);
    });
  }

  test('«Visualizar CV» abre su pestaña sin mover la página', async ({ page, context }) => {
    await context.route(`**${PDF_PATH}`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<!doctype html><title>visor</title>',
      }),
    );
    await open(page);
    const link = page.locator('#resumes').getByRole('link', { name: /Visualizar CV/ });
    await center(page, link);
    const before = await position(page);
    const opened = context.waitForEvent('page');
    await link.click({ delay: PRESS_MS });
    const popup = await opened;
    await popup.waitForLoadState();
    expect(new URL(popup.url()).pathname).toBe(PDF_PATH);
    await popup.close();
    await expectStill(page, before);
  });

  test('un enlace medio tapado por la cabecera no se mueve al pulsarlo', async ({ page }) => {
    await open(page);
    const link = page.locator('#resumes a[download]');
    // Deja unos 24 px del enlace ocultos bajo la cabecera fija.
    await link.evaluate((node) => {
      window.scrollBy(0, node.getBoundingClientRect().top - 41);
    });
    await settle(page);
    const box = await link.boundingBox();
    if (!box) throw new Error('El enlace no tiene caja');
    expect(box.y).toBeLessThan(HEADER_HEIGHT);
    const before = await position(page);
    const download = page.waitForEvent('download');
    await page.mouse.move(box.x + box.width / 2, HEADER_HEIGHT + 4);
    await page.mouse.down();
    await settle(page); // mientras sigue pulsado, nada se mueve
    await expectStill(page, before);
    await page.mouse.up();
    expect((await download).suggestedFilename()).toBe('michael-roudergue-cv.pdf');
  });
});

test.describe('foco por teclado (se conserva)', () => {
  test.use({ viewport: DESKTOP });

  test('«Saltar al contenido» lleva a <main> sin saltos posteriores', async ({ page }) => {
    await open(page);
    await page.locator('a[href="#main"]').focus();
    await page.keyboard.press('Enter');
    await settle(page);
    await expect(page.locator('#main')).toBeFocused();
    expect((await position(page)).y).toBeLessThanOrEqual(1);
  });

  test('tras un clic con ratón, Mayús+Tab destapa un enlace oculto bajo la cabecera', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'WebKit no enfoca enlaces con Tab por defecto');
    await open(page);
    const view = page.locator('#resumes').getByRole('link', { name: /Visualizar CV/ });
    const download = page.locator('#resumes a[download]');
    await center(page, page.locator('#resumes article h3'));
    await page.locator('#resumes article h3').click(); // foco por puntero antes de usar el teclado
    await view.focus();
    await download.evaluate((node) => {
      window.scrollBy(0, node.getBoundingClientRect().top - 20);
    });
    await settle(page);
    await page.keyboard.press('Shift+Tab');
    await settle(page);
    await expect(download).toBeFocused();
    const box = await download.boundingBox();
    expect(box?.y ?? 0).toBeGreaterThanOrEqual(HEADER_HEIGHT);
  });
});

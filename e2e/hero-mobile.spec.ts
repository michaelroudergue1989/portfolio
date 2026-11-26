import type { Page } from '@playwright/test';
import { DESKTOP, expect, expectScrolledTo, HEADER_HEIGHT, test } from './fixtures';

/** Distribución del Hero según la pantalla y acceso a Currículum desde el menú móvil. */
const PORTRAIT = [
  [320, 568],
  [320, 640],
  [360, 640],
  [360, 800],
  [375, 667],
  [390, 844],
  [414, 896],
] as const;
const LANDSCAPE = [
  [667, 375],
  [844, 390],
] as const;
const LANGS = ['es', 'en'] as const;

const DOWNLOAD = /Descargar CV|Download CV/;

/** En pantallas compactas solo queda el monograma de la cabecera. */
async function expectOnlyHeaderMonogram(page: Page) {
  await expect(page.locator('#home [role="img"]')).toBeHidden();
  await expect(page.locator('#home svg[viewBox="0 0 360 360"]')).toBeHidden();
  await expect(page.locator('header a[href="#home"] [aria-hidden="true"]')).toBeVisible();
}

async function open(page: Page, lang: (typeof LANGS)[number], width: number, height: number) {
  await page.setViewportSize({ width, height });
  await page.addInitScript((value) => localStorage.setItem('portfolio-lang', value), lang);
  await page.goto('/');
  // La aplicación se monta con React: esperar al contenido antes de medir el DOM.
  await page.locator('#contact').waitFor();
  await page.evaluate(() => document.fonts.ready);
}

/** Datos geométricos y de orden del Hero. */
function inspect(page: Page) {
  return page.evaluate(() => {
    const hero = document.getElementById('home');
    if (!hero) throw new Error('sin Hero');
    const links = [...hero.querySelectorAll('a')];
    const nodes = [...hero.querySelectorAll<HTMLElement>('h1, p, a')];
    const tops = nodes.map((node) => Math.round(node.getBoundingClientRect().top));
    const download = hero.querySelector('a[download]')?.getBoundingClientRect();
    return {
      download: { top: download?.top ?? -1, bottom: download?.bottom ?? Infinity },
      viewport: innerHeight,
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      links: links.length,
      smallTargets: links
        .map((a) => a.getBoundingClientRect())
        .filter((r) => r.width < 44 || r.height < 44).length,
      downloadIsFirstLink: links[0]?.hasAttribute('download') ?? false,
      // En una sola columna, el orden del DOM debe bajar (o quedar en la misma fila).
      domOrderFollowsVisual: tops.every((top, i) => i === 0 || top >= (tops[i - 1] ?? 0) - 1),
      textAfterActions: Boolean(
        links.at(-1) &&
        hero.querySelector('p.border-l-2') &&
        (links.at(-1) as Node).compareDocumentPosition(hero.querySelector('p.border-l-2') as Node) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ),
      minFont: Math.min(
        ...[...hero.querySelectorAll('p, a')].map((el) =>
          parseFloat(getComputedStyle(el).fontSize),
        ),
      ),
    };
  });
}

test.describe('Hero móvil: Descargar CV en el primer pantallazo', () => {
  for (const [width, height] of PORTRAIT) {
    for (const lang of LANGS) {
      test(`${String(width)}×${String(height)} (${lang})`, async ({ page }) => {
        await open(page, lang, width, height);
        const hero = await inspect(page);
        expect(hero.download.top).toBeGreaterThanOrEqual(HEADER_HEIGHT);
        expect(hero.download.bottom).toBeLessThanOrEqual(hero.viewport);
        expect(hero.overflowX).toBe(false);
        expect(hero.links).toBe(4);
        expect(hero.smallTargets).toBe(0);
        expect(hero.downloadIsFirstLink).toBe(true);
        expect(hero.domOrderFollowsVisual).toBe(true);
        expect(hero.textAfterActions).toBe(true);
        expect(hero.minFont).toBeGreaterThanOrEqual(14);
        await expectOnlyHeaderMonogram(page);
      });
    }
  }
});

test.describe('Hero móvil en horizontal', () => {
  for (const [width, height] of LANDSCAPE) {
    for (const lang of LANGS) {
      test(`${String(width)}×${String(height)} (${lang})`, async ({ page }) => {
        await open(page, lang, width, height);
        const hero = await inspect(page);
        expect(hero.download.bottom).toBeLessThanOrEqual(hero.viewport);
        expect(hero.overflowX).toBe(false);
        expect(hero.smallTargets).toBe(0);
        expect(hero.domOrderFollowsVisual).toBe(true);
        await expectOnlyHeaderMonogram(page);
      });
    }
  }
});

test.describe('Hero: escritorio y cambios de tamaño', () => {
  for (const [width, height] of [
    [1024, 768],
    [1440, 900],
  ] as const) {
    test(`${String(width)}×${String(height)} conserva el texto antes de las acciones y el gráfico a la derecha`, async ({
      page,
    }) => {
      await open(page, 'es', width, height);
      expect((await inspect(page)).textAfterActions).toBe(false);
      const title = await page.locator('#home h1').boundingBox();
      const graphic = await page.getByRole('img', { name: 'Monograma MR' }).boundingBox();
      expect(graphic?.x ?? 0).toBeGreaterThan((title?.x ?? 0) + (title?.width ?? 0) / 2);
    });
  }

  test('en 768×1024 se mantiene la distribución anterior, sin gráfico', async ({ page }) => {
    await open(page, 'es', 768, 1024);
    expect((await inspect(page)).textAfterActions).toBe(false);
    await expect(page.getByRole('img', { name: 'Monograma MR' })).toBeHidden();
  });

  test('al girar o cambiar el tamaño se reordena sin duplicar enlaces', async ({ page }) => {
    await open(page, 'es', DESKTOP.width, DESKTOP.height);
    const hero = page.locator('#home');
    for (const [width, height, textAfterActions] of [
      [375, 667, true],
      [768, 1024, false],
      [844, 390, true],
      [1440, 900, false],
    ] as const) {
      await page.setViewportSize({ width, height });
      await expect(async () => {
        expect((await inspect(page)).textAfterActions).toBe(textAfterActions);
      }).toPass();
      await expect(hero.getByRole('link', { name: DOWNLOAD })).toHaveCount(1);
      await expect(hero.getByRole('link')).toHaveCount(4);
    }
  });

  test('el idioma y el tema se cambian en móvil sin alterar la visibilidad de la descarga', async ({
    page,
  }) => {
    await open(page, 'es', 360, 640);
    await page.getByRole('button', { name: 'Cambiar a tema oscuro' }).click();
    await page.getByRole('button', { name: 'EN, English' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#home').getByRole('link', { name: /Download CV/ })).toBeVisible();
    const hero = await inspect(page);
    expect(hero.download.bottom).toBeLessThanOrEqual(hero.viewport);
    expect(hero.overflowX).toBe(false);
  });

  test('el teclado recorre las acciones en el orden visible en móvil', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'WebKit no enfoca enlaces con Tab por defecto');
    await open(page, 'es', 375, 667);
    const hero = page.locator('#home');
    await hero.getByRole('link', { name: DOWNLOAD }).focus();
    for (const name of [/Ver experiencia/, /LinkedIn/, /GitHub/]) {
      await page.keyboard.press('Tab');
      await expect(hero.getByRole('link', { name })).toBeFocused();
    }
  });
});

test.describe('menú móvil: Currículum', () => {
  for (const [lang, name, openName, menuName] of [
    ['es', 'Currículum', 'Abrir menú de navegación', 'Menú de navegación'],
    ['en', 'Résumé', 'Open navigation menu', 'Navigation menu'],
  ] as const) {
    for (const colorScheme of ['light', 'dark'] as const) {
      test(`"${name}" navega a #resumes sin descargar (${lang}, ${colorScheme})`, async ({
        page,
      }) => {
        await page.emulateMedia({ colorScheme });
        await open(page, lang, 375, 667);
        let downloads = 0;
        page.on('download', () => (downloads += 1));
        await page.getByRole('button', { name: openName }).click();
        const menu = page.getByRole('navigation', { name: menuName });
        await menu.getByRole('link', { name, exact: true }).click();
        await expect(menu).toHaveCount(0);
        await expect(page).toHaveURL(/#resumes$/);
        await expectScrolledTo(page, 'resumes');

        await page.getByRole('button', { name: openName }).focus();
        await page.keyboard.press('Enter');
        await expect(menu.getByRole('link', { name, exact: true })).toHaveAttribute(
          'aria-current',
          'location',
        );
        await expect(menu.locator('[aria-current]')).toHaveCount(1);
        expect(downloads).toBe(0);
      });
    }
  }
});

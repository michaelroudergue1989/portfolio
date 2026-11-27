import type { Page } from '@playwright/test';
import { DESKTOP, expect, test } from './fixtures';

/** Realce de las etiquetas de tecnologías al pasar el puntero (escala visual, sin mover nada). */
const SCALE = 1.07;

async function open(page: Page) {
  await page.goto('/');
  await page.locator('#contact').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = 'auto';
  });
}

const badge = (page: Page, section: string, name: string) =>
  page.locator(`#${section} .tech-badge`, { hasText: name }).first();

/** Geometría de maquetación (offset*) de todas las etiquetas: no la altera `transform`. */
const layout = (page: Page) =>
  page.evaluate(() => ({
    badges: [...document.querySelectorAll<HTMLElement>('.tech-badge')].map((el) =>
      [el.offsetLeft, el.offsetTop, el.offsetWidth, el.offsetHeight].join(','),
    ),
    height: document.documentElement.scrollHeight,
    width: document.documentElement.scrollWidth,
    y: scrollY,
  }));

const scaleOf = (page: Page, section: string, name: string) =>
  badge(page, section, name).evaluate((el) => {
    const value = getComputedStyle(el).transform;
    return value === 'none' ? 1 : new DOMMatrix(value).a;
  });

async function center(page: Page, section: string, name: string) {
  await badge(page, section, name).evaluate((node) => {
    node.scrollIntoView({ block: 'center' });
  });
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`con puntero fino (${colorScheme})`, () => {
    test.use({ viewport: DESKTOP, colorScheme });

    test('escala y resalta la etiqueta sin mover las demás ni la página', async ({ page }) => {
      await open(page);
      expect(
        await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches),
      ).toBe(true);
      for (const [section, name] of [
        ['skills', 'Prisma ORM'],
        ['skills', 'React'],
        ['projects', 'React'],
        ['experience', 'PHP'],
      ] as const) {
        await page.mouse.move(0, 0);
        await center(page, section, name);
        const target = badge(page, section, name);
        const border = await target.evaluate((el) => getComputedStyle(el).borderTopColor);
        const before = await layout(page);
        await target.hover();
        // La transición dura 160 ms: se espera al valor final, no un tiempo fijo.
        await expect.poll(() => scaleOf(page, section, name)).toBeCloseTo(SCALE, 3);
        await expect(target).not.toHaveCSS('border-top-color', border);
        await expect(target).toHaveCSS('cursor', 'auto');
        expect(await layout(page)).toEqual(before);
        // Nada recorta la etiqueta ampliada.
        expect(
          await target.evaluate((el) => {
            const r = el.getBoundingClientRect();
            for (let node = el.parentElement; node; node = node.parentElement) {
              if (getComputedStyle(node).overflow === 'visible') continue;
              const box = node.getBoundingClientRect();
              if (r.left < box.left || r.right > box.right) return false;
              if (node !== document.documentElement && (r.top < box.top || r.bottom > box.bottom))
                return false;
            }
            return true;
          }),
        ).toBe(true);
        await page.mouse.move(0, 0);
        await expect.poll(() => scaleOf(page, section, name)).toBe(1);
      }
    });
  });
}

test.describe('movimiento reducido', () => {
  test.use({ viewport: DESKTOP, reducedMotion: 'reduce' });

  test('no escala (el borde sí cambia)', async ({ page }) => {
    await open(page);
    await center(page, 'skills', 'Docker');
    const target = badge(page, 'skills', 'Docker');
    const border = await target.evaluate((el) => getComputedStyle(el).borderTopColor);
    await target.hover();
    await expect(target).not.toHaveCSS('border-top-color', border);
    await expect(target).toHaveCSS('transform', 'none');
  });
});

test.describe('pantalla táctil', () => {
  test.use({ viewport: { width: 375, height: 667 }, hasTouch: true });

  test('tocar una etiqueta no la escala ni desplaza la página', async ({ page, browserName }) => {
    await open(page);
    const touchOnly = await page.evaluate(
      () => !matchMedia('(hover: hover) and (pointer: fine)').matches,
    );
    // En automatización, Firefox sigue declarando puntero fino aunque se emule el toque.
    test.skip(browserName === 'firefox' && !touchOnly, 'Firefox no emula un puntero grueso');
    expect(touchOnly).toBe(true);
    await center(page, 'skills', 'Docker');
    const before = await layout(page);
    await badge(page, 'skills', 'Docker').tap();
    await expect(badge(page, 'skills', 'Docker')).toHaveCSS('transform', 'none');
    expect(await layout(page)).toEqual(before);
  });
});

test('las etiquetas siguen siendo informativas: no se alcanzan con Tab', async ({ page }) => {
  await open(page);
  const focusable = await page
    .locator('.tech-badge')
    .evaluateAll(
      (badges) =>
        badges.filter((el) => (el as HTMLElement).tabIndex >= 0 || el.closest('a, button') !== null)
          .length,
    );
  expect(focusable).toBe(0);
});

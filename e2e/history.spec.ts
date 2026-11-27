import type { Page } from '@playwright/test';
import { DESKTOP, expect, expectScrolledTo, topOf, test } from './fixtures';

/**
 * Regresión del historial: con `scroll-behavior: smooth`, un «adelante» que llegaba mientras
 * «atrás» aún se desplazaba dejaba la URL en una sección y la página en otra (Chromium).
 * El retardo no es una espera para estabilizar: es el instante en que se lanza la segunda orden.
 */
const DELAYS = [0, 16, 50, 100, 200, 300, 400, 600, 900] as const;

const VIEWS = [
  { name: 'escritorio', viewport: DESKTOP, hasTouch: false, nav: 'Navegación principal' },
  { name: 'móvil', viewport: { width: 375, height: 667 }, hasTouch: true, nav: 'Accesos directos' },
] as const;

type Section = 'experience' | 'projects';
const LABEL: Record<Section, string> = { experience: 'Experiencia', projects: 'Proyectos' };

/** Resuelve cuando scrollY lleva 500 ms sin cambiar: estado final, sin animaciones en curso. */
const still = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let last = scrollY;
        let since = performance.now();
        const tick = (now: number) => {
          if (scrollY !== last) {
            last = scrollY;
            since = now;
          }
          if (now - since >= 500) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );

async function open(page: Page) {
  await page.goto('/');
  await page.locator('#contact').waitFor();
  await page.evaluate(() => document.fonts.ready);
}

const link = (page: Page, nav: string, id: Section) =>
  page.getByRole('navigation', { name: nav }).getByRole('link', { name: LABEL[id], exact: true });

/** Navegación normal hasta una sección; devuelve la posición final. */
async function visit(page: Page, nav: string, id: Section) {
  await link(page, nav, id).click();
  await expectScrolledTo(page, id);
  await still(page);
  return page.evaluate(() => scrollY);
}

/** «Atrás» y, `delay` ms después de que el documento lo reciba, «adelante». */
async function backThenForward(page: Page, delay: number) {
  // La orden retorna enseguida: con una evaluación pendiente durante el recorrido, Chromium
  // reproducía el defecto solo a veces y la prueba no habría protegido nada.
  await page.evaluate((ms) => {
    const target = window as unknown as { traversals: number };
    target.traversals = 0;
    addEventListener('popstate', () => (target.traversals += 1));
    addEventListener(
      'popstate',
      () => {
        setTimeout(() => {
          history.forward();
        }, ms);
      },
      { once: true },
    );
    history.back();
  }, delay);
  await page.waitForFunction(() => (window as unknown as { traversals: number }).traversals >= 2);
}

/** URL, hash, posición, sección visible y sección activa deben coincidir. */
async function expectConsistent(page: Page, nav: string, id: Section, y: number) {
  await still(page);
  await expect(page).toHaveURL(new RegExp(`#${id}$`));
  expect(await page.evaluate(() => location.hash)).toBe(`#${id}`);
  expect(Math.abs((await page.evaluate(() => scrollY)) - y), 'scrollY').toBeLessThanOrEqual(2);
  const top = await topOf(page, id);
  expect(top, 'borde de la sección').toBeGreaterThanOrEqual(55);
  expect(top, 'borde de la sección').toBeLessThanOrEqual(90);
  await expect(
    page.getByRole('navigation', { name: nav }).locator('[aria-current="location"]'),
  ).toHaveAttribute('href', `#${id}`);
}

for (const view of VIEWS) {
  test.describe(`historial (${view.name})`, () => {
    test.use({
      viewport: view.viewport,
      hasTouch: view.hasTouch,
      reducedMotion: 'no-preference',
    });

    test('atrás y adelante esperando a cada paso', async ({ page }) => {
      await open(page);
      const experience = await visit(page, view.nav, 'experience');
      const projects = await visit(page, view.nav, 'projects');
      await page.goBack();
      await expectConsistent(page, view.nav, 'experience', experience);
      await page.goForward();
      await expectConsistent(page, view.nav, 'projects', projects);
    });

    for (const delay of DELAYS) {
      test(`adelante ${String(delay)} ms después de atrás`, async ({ page }) => {
        await open(page);
        await visit(page, view.nav, 'experience');
        const projects = await visit(page, view.nav, 'projects');
        await backThenForward(page, delay);
        await expectConsistent(page, view.nav, 'projects', projects);
      });
    }

    test('botones del navegador seguidos', async ({ page }) => {
      await open(page);
      await visit(page, view.nav, 'experience');
      const projects = await visit(page, view.nav, 'projects');
      await page.goBack();
      await page.goForward();
      await expectConsistent(page, view.nav, 'projects', projects);
    });

    for (const delay of [0, 100] as const) {
      test(`atrás ${String(delay)} ms después de pulsar un enlace`, async ({ page }) => {
        await open(page);
        const experience = await visit(page, view.nav, 'experience');
        await link(page, view.nav, 'projects').click();
        await page.evaluate(
          (ms) =>
            new Promise<void>((resolve) => {
              setTimeout(() => {
                addEventListener(
                  'popstate',
                  () => {
                    resolve();
                  },
                  { once: true },
                );
                history.back();
              }, ms);
            }),
          delay,
        );
        await expectConsistent(page, view.nav, 'experience', experience);
      });
    }
  });
}

test.describe('historial tras navegar con el menú hamburguesa', () => {
  test.use({ viewport: { width: 375, height: 667 }, reducedMotion: 'no-preference' });

  test('adelante 200 ms después de atrás', async ({ page }) => {
    await open(page);
    const positions: number[] = [];
    for (const id of ['experience', 'projects'] as const) {
      await page.getByRole('button', { name: 'Abrir menú de navegación' }).click();
      await page
        .getByRole('navigation', { name: 'Menú de navegación' })
        .getByRole('link', { name: LABEL[id], exact: true })
        .click();
      await expectScrolledTo(page, id);
      await still(page);
      positions.push(await page.evaluate(() => scrollY));
    }
    await backThenForward(page, 200);
    await expectConsistent(page, 'Accesos directos', 'projects', positions[1] ?? 0);
  });
});

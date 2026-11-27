import type { Page } from '@playwright/test';
import { DESKTOP, expect, expectScrolledTo, test } from './fixtures';

/** Barra de accesos directos móvil. Sin reintentos, clics forzados ni esperas fijas. */
const PHONE = { width: 375, height: 667 };
const SHORTCUTS = [
  { id: 'home', es: 'Inicio', en: 'Home' },
  { id: 'experience', es: 'Experiencia', en: 'Experience' },
  { id: 'projects', es: 'Proyectos', en: 'Projects' },
  { id: 'resumes', es: 'CV', en: 'Résumé' },
  { id: 'contact', es: 'Contacto', en: 'Contact' },
] as const;

const VISIBLE = [
  [320, 550],
  [320, 568],
  [320, 640],
  [359, 550],
  [360, 501],
  [360, 560],
  [360, 640],
  [360, 740],
  [375, 553],
  [375, 667],
  [375, 812],
  [390, 844],
  [414, 896],
  [767, 600],
] as const;
const HIDDEN = [
  [319, 700],
  [320, 480],
  [320, 549],
  [359, 549],
  [360, 500],
  [667, 375],
  [844, 390],
  [768, 600],
  [768, 1024],
  [1024, 768],
  [1280, 720],
  [1440, 900],
] as const;

const bar = (page: Page) => page.locator('[data-bottom-nav]');
const current = (page: Page) => bar(page).locator('[aria-current="location"]');

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

async function open(
  page: Page,
  { path = '/', lang = 'es', size = PHONE }: { path?: string; lang?: string; size?: typeof PHONE },
) {
  await page.setViewportSize(size);
  await page.addInitScript((value) => {
    if (!localStorage.getItem('portfolio-lang')) localStorage.setItem('portfolio-lang', value);
  }, lang);
  await page.goto(path);
  await page.locator('#contact').waitFor();
  await page.evaluate(() => document.fonts.ready);
}

/** Desplaza (sin animación) para dejar la sección justo bajo la cabecera. */
async function scrollToSection(page: Page, id: string) {
  await page.evaluate((sectionId) => {
    const top = document.getElementById(sectionId)?.getBoundingClientRect().top ?? 0;
    window.scrollTo({ top: window.scrollY + top - 80, behavior: 'instant' });
  }, id);
}

/** Píxeles del elemento enfocado que quedan bajo la barra o bajo la cabecera. */
const obstruction = (page: Page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    const nav = document.querySelector('[data-bottom-nav]');
    if (!el || el === document.body || !nav) return null;
    if (el.tagName === 'MAIN' || el.closest('header, [data-bottom-nav]')) return null;
    if (el.getAttribute('href') === '#main') return null;
    const rect = el.getBoundingClientRect();
    return {
      name: (el.textContent ?? '').trim().slice(0, 40),
      underBar: Math.max(0, Math.round(rect.bottom - nav.getBoundingClientRect().top)),
      underHeader: rect.top < 64.5,
    };
  });

test.describe('visibilidad según la ventana', () => {
  for (const [width, height] of VISIBLE) {
    test(`${String(width)}×${String(height)}: visible, accesible y sin tapar Descargar CV`, async ({
      page,
    }) => {
      for (const lang of ['es', 'en']) {
        await page.setViewportSize({ width, height });
        await page.goto('/');
        await page.evaluate((value) => localStorage.setItem('portfolio-lang', value), lang);
        await page.reload();
        await page.locator('#contact').waitFor();
        await page.evaluate(() => document.fonts.ready);
        await expect(bar(page)).toBeVisible();
        const data = await page.evaluate(() => {
          const nav = document.querySelector('[data-bottom-nav]');
          if (!nav) throw new Error('sin barra');
          const box = nav.getBoundingClientRect();
          const range = document.createRange();
          return {
            height: box.height,
            inside: box.left >= 0 && box.right <= innerWidth && box.bottom <= innerHeight,
            targets: [...nav.querySelectorAll('a')].map((a) => {
              const r = a.getBoundingClientRect();
              range.selectNodeContents(a.lastChild as Node);
              const lines = range.getClientRects();
              return {
                big: r.width >= 44 && r.height >= 44,
                labelFits:
                  lines.length === 1 &&
                  (lines[0]?.left ?? -1) >= r.left - 0.5 &&
                  (lines[0]?.right ?? Infinity) <= r.right + 0.5,
              };
            }),
            overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
            downloadClear:
              (document.querySelector('#home a[download]')?.getBoundingClientRect().bottom ??
                Infinity) <= box.top,
          };
        });
        expect(data.height).toBeGreaterThanOrEqual(56);
        expect(data.height).toBeLessThanOrEqual(64);
        expect(data.inside).toBe(true);
        expect(data.targets).toEqual(Array(5).fill({ big: true, labelFits: true }));
        expect(data.overflowX).toBe(false);
        expect(data.downloadClear).toBe(true);
      }
    });
  }

  for (const [width, height] of HIDDEN) {
    test(`${String(width)}×${String(height)}: no existe ni reserva espacio`, async ({ page }) => {
      await open(page, { size: { width, height } });
      await expect(bar(page)).toHaveCount(0);
      expect(
        await page.evaluate(() => getComputedStyle(document.documentElement).scrollPaddingBottom),
      ).toBe('auto');
      // El pie es lo último: sin hueco añadido debajo.
      expect(
        await page.evaluate(() => {
          const footer = document.querySelector('footer');
          return Math.round(
            document.documentElement.scrollHeight -
              ((footer?.getBoundingClientRect().bottom ?? 0) + scrollY),
          );
        }),
      ).toBeLessThanOrEqual(1);
    });
  }

  test('girar y redimensionar monta y retira la barra', async ({ page }) => {
    await open(page, {});
    for (const [width, height, visible] of [
      [667, 375, false],
      [375, 667, true],
      [768, 1024, false],
      [414, 896, true],
      [1440, 900, false],
    ] as const) {
      await page.setViewportSize({ width, height });
      await expect(bar(page)).toHaveCount(visible ? 1 : 0);
    }
  });
});

for (const mode of ['ratón', 'toque'] as const) {
  test.describe(`navegación con la barra (${mode})`, () => {
    test.use(mode === 'toque' ? { viewport: PHONE, hasTouch: true } : { viewport: PHONE });

    for (const item of SHORTCUTS) {
      test(`"${item.es}" lleva a #${item.id} y queda como único activo`, async ({ page }) => {
        let downloads = 0;
        page.on('download', () => (downloads += 1));
        await open(page, { path: item.id === 'home' ? '/#contact' : '/' });
        const link = bar(page).getByRole('link', { name: item.es, exact: true });
        if (mode === 'toque') await link.tap();
        else await link.click({ delay: 100 });
        await expect(page).toHaveURL(new RegExp(`#${item.id}$`));
        await expectScrolledTo(page, item.id);
        await expect(current(page)).toHaveCount(1);
        await expect(current(page)).toHaveText(item.es);
        expect(downloads).toBe(0);
      });
    }
  });
}

test.describe('sección activa', () => {
  test('sigue al desplazamiento manual sin tocar el hash y no marca falsos activos', async ({
    page,
  }) => {
    await open(page, {});
    for (const [id, label] of [
      ['experience', 'Experiencia'],
      ['about', null],
      ['projects', 'Proyectos'],
      ['skills', null],
      ['education', null],
      ['certifications', null],
      ['resumes', 'CV'],
      ['contact', 'Contacto'],
      ['home', 'Inicio'],
    ] as const) {
      await scrollToSection(page, id);
      if (label) await expect(current(page), id).toHaveText(label);
      else await expect(current(page), id).toHaveCount(0);
    }
    expect(await page.evaluate(() => location.hash)).toBe('');
  });

  test('acceso directo con hash y recarga', async ({ page }) => {
    await open(page, { path: '/#projects' });
    await expectScrolledTo(page, 'projects');
    await expect(current(page)).toHaveText('Proyectos');
    await page.reload();
    await page.locator('#contact').waitFor();
    await expect(current(page)).toHaveText('Proyectos');
  });

  test('atrás y adelante del navegador', async ({ page }) => {
    await open(page, {});
    for (const name of ['Experiencia', 'Proyectos']) {
      await bar(page).getByRole('link', { name, exact: true }).click();
      await expect(current(page)).toHaveText(name);
    }
    await expectScrolledTo(page, 'projects');
    await page.goBack();
    await expect(page).toHaveURL(/#experience$/);
    await expect(current(page)).toHaveText('Experiencia');
    await page.goForward();
    await expect(page).toHaveURL(/#projects$/);
    await expect(current(page)).toHaveText('Proyectos');
  });

  test('tras cambiar tema o idioma la barra refleja la sección que realmente queda arriba', async ({
    page,
  }) => {
    await open(page, {});
    await scrollToSection(page, 'resumes');
    await expect(current(page)).toHaveText('CV');
    await page.getByRole('button', { name: 'Cambiar a tema oscuro' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(current(page)).toHaveText('CV');
    await page.getByRole('button', { name: 'EN, English' }).click();
    await expect(page.getByRole('navigation', { name: 'Shortcuts' })).toBeVisible();
    await expect(bar(page).getByRole('link')).toHaveText(SHORTCUTS.map((item) => item.en));

    // Al cambiar la longitud del texto, cada motor ancla la posición de forma distinta: Chromium y
    // WebKit pueden dejar arriba la sección anterior (sin acceso en la barra). Se compara con la
    // sección que dice la geometría: la última cuyo borde superior pasó bajo la cabecera.
    await expect(async () => {
      const expected = await page.evaluate(() => {
        const passed = [...document.querySelectorAll<HTMLElement>('header ~ main section[id]')]
          .filter((section) => !['stats', 'areas'].includes(section.id))
          .filter((section) => section.getBoundingClientRect().top <= 96);
        return passed.at(-1)?.id ?? 'home';
      });
      const marked = await bar(page)
        .locator('[aria-current]')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href')));
      const shortcut = SHORTCUTS.some((item) => item.id === expected);
      expect(marked).toEqual(shortcut ? [`#${expected}`] : []);
    }).toPass();

    await scrollToSection(page, 'resumes');
    await expect(current(page)).toHaveText('Résumé');
  });
});

test.describe('menú hamburguesa y barra', () => {
  test.use({ viewport: PHONE });

  test('el menú abierto oculta la barra; al cerrarlo vuelve', async ({ page }) => {
    await open(page, {});
    await page.getByRole('button', { name: 'Abrir menú de navegación' }).click();
    const menu = page.getByRole('navigation', { name: 'Menú de navegación' });
    await expect(menu.getByRole('link')).toHaveCount(9);
    await expect(bar(page)).toBeHidden();
    await expect(page.getByRole('navigation', { name: 'Accesos directos' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await expect(bar(page)).toBeVisible();
  });

  test('navegar con el menú actualiza la barra, también hacia una sección sin acceso', async ({
    page,
  }) => {
    await open(page, {});
    for (const [name, expected] of [
      ['Experiencia', 'Experiencia'],
      ['Habilidades', null],
    ] as const) {
      await page.getByRole('button', { name: 'Abrir menú de navegación' }).click();
      await page
        .getByRole('navigation', { name: 'Menú de navegación' })
        .getByRole('link', { name, exact: true })
        .click();
      await expect(bar(page)).toBeVisible();
      if (expected) await expect(current(page)).toHaveText(expected);
      else await expect(current(page)).toHaveCount(0);
    }
  });
});

test.describe('teclado y foco con la barra', () => {
  test.use({ reducedMotion: 'reduce' });
  test.skip(
    ({ browserName }) => browserName === 'webkit',
    'WebKit no enfoca enlaces con Tab por defecto',
  );

  test('regresión: «Ver experiencia» no queda bajo la barra a 320×568', async ({ page }) => {
    await open(page, { size: { width: 320, height: 568 } });
    await page.locator('#home a[download]').focus();
    await page.keyboard.press('Tab');
    await settle(page);
    await expect(page.locator('#home a[href="#experience"]')).toBeFocused();
    expect((await obstruction(page))?.underBar).toBe(0);
  });

  for (const [width, height] of [
    [320, 568],
    [375, 667],
  ] as const) {
    for (const direction of ['Tab', 'Shift+Tab'] as const) {
      test(`${direction} por toda la página sin foco oculto (${String(width)}×${String(height)})`, async ({
        page,
      }) => {
        await open(page, { size: { width, height } });
        if (direction === 'Shift+Tab') {
          await page.evaluate(() =>
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
          );
          await page.locator('footer a').last().focus();
        }
        const problems: unknown[] = [];
        let stops = 0;
        for (let i = 0; i < 70; i += 1) {
          await page.keyboard.press(direction);
          await settle(page);
          if (await page.evaluate(() => document.activeElement === document.body)) break;
          const info = await obstruction(page);
          if (!info) continue;
          stops += 1;
          if (info.underBar > 0 || info.underHeader) problems.push(info);
        }
        expect(stops).toBeGreaterThan(15);
        expect(problems).toEqual([]);
      });
    }
  }

  test('los accesos van al final del orden de tabulación, con foco visible', async ({ page }) => {
    await open(page, {});
    await page.locator('footer a').last().focus();
    for (const item of SHORTCUTS) {
      await page.keyboard.press('Tab');
      const link = bar(page).getByRole('link', { name: item.es, exact: true });
      await expect(link).toBeFocused();
      await expect(link).toHaveCSS('outline-style', 'solid');
    }
  });

  test('Enter en un acceso navega y el salto al contenido se conserva', async ({ page }) => {
    await open(page, {});
    await bar(page).getByRole('link', { name: 'Proyectos', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expectScrolledTo(page, 'projects');
    await page.locator('a[href="#main"]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });
});

test.describe('contenido, pie y punteros', () => {
  test.use({ viewport: PHONE });

  test('al final de la página el pie queda completo por encima de la barra', async ({ page }) => {
    await open(page, {});
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
    );
    const clear = await page.evaluate(() => {
      const top = document.querySelector('[data-bottom-nav]')?.getBoundingClientRect().top ?? 0;
      return [...document.querySelectorAll('footer a, footer p, footer li')].every(
        (el) => el.getBoundingClientRect().bottom <= top,
      );
    });
    expect(clear).toBe(true);
    await page.locator('footer a').last().click({ trial: true }); // nada intercepta el clic
  });

  test('pulsar un enlace medio tapado por la barra no mueve la página y descarga', async ({
    page,
  }) => {
    await open(page, {});
    const link = page.locator('#resumes a[download]');
    // Deja la mitad inferior del enlace bajo la barra.
    await link.evaluate((node) => {
      const top = document.querySelector('[data-bottom-nav]')?.getBoundingClientRect().top ?? 0;
      window.scrollBy({ top: node.getBoundingClientRect().top - (top - 24), behavior: 'instant' });
    });
    await settle(page);
    const box = await link.boundingBox();
    if (!box) throw new Error('El enlace no tiene caja');
    const before = await page.evaluate(() => scrollY);
    const download = page.waitForEvent('download');
    await page.mouse.move(box.x + box.width / 2, box.y + 8);
    await page.mouse.down();
    await settle(page);
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await page.mouse.up();
    expect((await download).suggestedFilename()).toBe('michael-roudergue-cv.pdf');
  });
});

test('en escritorio no hay barra', async ({ page }) => {
  await open(page, { size: DESKTOP });
  await expect(bar(page)).toHaveCount(0);
  await expect(page.getByRole('navigation', { name: 'Accesos directos' })).toHaveCount(0);
});

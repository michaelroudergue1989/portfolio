import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { DESKTOP, expect, MOBILE, MOBILE_NAV_ITEMS, test } from './fixtures';

/**
 * Accesibilidad automatizada (axe-core, reglas WCAG 2.0/2.1/2.2 A y AA + buenas prácticas) y
 * comprobaciones propias. Cero violaciones de axe NO equivale a cumplir WCAG 2.2 AA: ver
 * docs/ACCESIBILIDAD.md para lo verificado, lo incompleto y lo no verificado.
 */
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const THEMES = ['light', 'dark'] as const;
const LANGS = ['es', 'en'] as const;
const VIEWPORTS = { escritorio: DESKTOP, móvil: MOBILE } as const;

async function prepare(page: Page, theme: (typeof THEMES)[number], lang: (typeof LANGS)[number]) {
  await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
  await page.addInitScript((value) => localStorage.setItem('portfolio-lang', value), lang);
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
}

async function scan(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const summary = (items: typeof results.violations) =>
    items.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target.join(' ')).slice(0, 5),
    }));
  test.info().annotations.push({
    type: 'axe',
    description: JSON.stringify({
      passes: results.passes.length,
      incomplete: results.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
    }),
  });
  return { violations: summary(results.violations), incomplete: results.incomplete };
}

for (const theme of THEMES) {
  for (const lang of LANGS) {
    for (const [vpName, viewport] of Object.entries(VIEWPORTS)) {
      test(`axe: ${theme} · ${vpName} · ${lang}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await prepare(page, theme, lang);
        const { violations, incomplete } = await scan(page);
        expect(violations).toEqual([]);
        expect(incomplete.map((v) => v.id)).toEqual([]);
      });
    }

    test(`axe: ${theme} · menú móvil abierto · ${lang}`, async ({ page }) => {
      await page.setViewportSize(MOBILE);
      await prepare(page, theme, lang);
      await page.getByRole('button', { name: /(Abrir|Open) .*(menú|menu)/i }).click();
      await expect(
        page.getByRole('navigation', { name: /Menú de navegación|Navigation menu/ }),
      ).toBeVisible();
      const { violations, incomplete } = await scan(page);
      expect(violations).toEqual([]);
      expect(incomplete.map((v) => v.id)).toEqual([]);
      // Comprobación adicional e independiente de axe: contraste de los enlaces del menú con colores computados.
      const ratios = await page.evaluate(() => {
        const channels = (css: string) => (css.match(/[\d.]+/g) ?? []).map(Number);
        const lum = ([r = 0, g = 0, b = 0]: number[]) => {
          const f = (v: number) =>
            (v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
          return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
        };
        const solidBackground = (el: Element | null): number[] => {
          for (let node = el; node; node = node.parentElement) {
            const c = channels(getComputedStyle(node).backgroundColor);
            if (c.length === 3 || (c.length === 4 && (c[3] ?? 0) > 0.99)) return c;
          }
          return [255, 255, 255];
        };
        return [
          ...document.querySelectorAll(
            'nav[aria-label="Menú de navegación"] a, nav[aria-label="Navigation menu"] a',
          ),
        ]
          .filter((a) => a.getBoundingClientRect().width > 0)
          .map((a) => {
            const [l1, l2] = [
              lum(channels(getComputedStyle(a).color)),
              lum(solidBackground(a)),
            ].sort((x, y) => y - x);
            return ((l1 ?? 0) + 0.05) / ((l2 ?? 0) + 0.05);
          });
      });
      expect(ratios.length).toBe(MOBILE_NAV_ITEMS.length);
      for (const ratio of ratios) expect(ratio).toBeGreaterThanOrEqual(4.5);
    });
  }
}

test.describe('estructura semántica', () => {
  test.use({ viewport: DESKTOP });

  for (const lang of LANGS) {
    test(`jerarquía de encabezados y landmarks (${lang})`, async ({ page }) => {
      await prepare(page, 'light', lang);
      const data = await page.evaluate(() => ({
        levels: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) =>
          Number(h.tagName.slice(1)),
        ),
        h1: document.querySelectorAll('h1').length,
        landmarks: [
          ...document.querySelectorAll('nav,section[aria-labelledby],header,footer,main'),
        ].map((el) =>
          el.tagName === 'NAV'
            ? `nav:${el.getAttribute('aria-label') ?? ''}`
            : el.tagName.toLowerCase(),
        ),
        unlabeledButtons: [...document.querySelectorAll('button')].filter(
          (b) => !(b.textContent ?? '').trim() && !b.getAttribute('aria-label'),
        ).length,
        duplicateIds: (() => {
          const ids = [...document.querySelectorAll('[id]')].map((e) => e.id);
          return ids.filter((id, i) => ids.indexOf(id) !== i);
        })(),
      }));
      expect(data.h1).toBe(1);
      expect(data.levels[0]).toBe(1);
      data.levels.forEach((level, i) => {
        if (i > 0)
          expect(level, `salto de nivel en el encabezado nº ${String(i + 1)}`).toBeLessThanOrEqual(
            (data.levels[i - 1] ?? 0) + 1,
          );
      });
      const navs = data.landmarks.filter((l) => l.startsWith('nav:'));
      expect(new Set(navs).size, 'los <nav> tienen nombres únicos').toBe(navs.length);
      expect(data.landmarks.filter((l) => l === 'main')).toHaveLength(1);
      expect(data.unlabeledButtons).toBe(0);
      expect(data.duplicateIds).toEqual([]);
    });
  }

  test('el área de interacción de todos los controles visibles es de al menos 24 × 24 px (WCAG 2.5.8)', async ({
    page,
  }) => {
    await prepare(page, 'light', 'es');
    const small = await page.evaluate(() =>
      [...document.querySelectorAll('a[href], button')]
        .filter((el) => !el.closest('.sr-only') && el.getAttribute('href') !== '#main')
        .map((el) => ({ el, rect: el.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0 && (rect.width < 24 || rect.height < 24))
        .map(
          ({ el, rect }) =>
            `${(el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 30)} ${String(Math.round(rect.width))}×${String(Math.round(rect.height))}`,
        ),
    );
    expect(small).toEqual([]);
  });

  test('en móvil los controles principales miden al menos 36 px de alto (mínimo WCAG 2.5.8: 24 px)', async ({
    page,
  }) => {
    await page.setViewportSize(MOBILE);
    await prepare(page, 'light', 'es');
    const heights = await page.evaluate(() =>
      [...document.querySelectorAll('header button, header a[href="#home"]')]
        .map((el) => Math.round(el.getBoundingClientRect().height))
        .filter((height) => height > 0),
    );
    expect(Math.min(...heights)).toBeGreaterThanOrEqual(36);
  });
});

test.describe('reflujo y zoom (equivalentes por ventana; no es zoom real del navegador)', () => {
  // 200 % de zoom en 1440 px = 720 px CSS; 400 % en 1280 px = 320 px CSS (WCAG 1.4.10).
  for (const [label, width, scale] of [
    ['200 %', 720, 2],
    ['400 %', 320, 4],
  ] as const) {
    test(`sin desplazamiento horizontal ni violaciones de axe al ${label}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width, height: 800 },
        deviceScaleFactor: scale,
        reducedMotion: 'reduce',
      });
      const page = await context.newPage();
      await page.goto('/');
      await page.evaluate(() => document.fonts.ready);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
        ),
      ).toBe(true);
      const { violations } = await scan(page);
      expect(violations).toEqual([]);
      await context.close();
    });
  }
});

test.describe('espaciado de texto (WCAG 1.4.12)', () => {
  test.use({ viewport: MOBILE, bypassCSP: true }); // se inyecta una hoja de estilos de prueba

  test('con interlineado 1,5, letras 0,12em, palabras 0,16em y párrafos 2em no se pierde contenido', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    await page.addStyleTag({
      content:
        '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }',
    });
    const report = await page.evaluate(() => ({
      overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      clipped: [...document.querySelectorAll('body *')]
        .filter((el) => {
          const s = getComputedStyle(el);
          return (
            (s.overflow === 'hidden' || s.overflowX === 'hidden' || s.overflowY === 'hidden') &&
            el.scrollHeight > el.clientHeight + 1 &&
            el.clientHeight > 0 &&
            el.closest('.sr-only') === null
          );
        })
        .map((el) => `${el.tagName}.${(el.getAttribute('class') ?? '').slice(0, 30)}`),
    }));
    expect(report).toEqual({ overflowX: false, clipped: [] });
  });
});

test.describe('modos de contraste y preferencias del usuario', () => {
  test.use({ viewport: DESKTOP });

  test('con colores forzados (alto contraste) los controles siguen siendo operables', async ({
    page,
  }) => {
    await page.emulateMedia({ forcedColors: 'active' });
    await page.goto('/');
    await page.getByRole('button', { name: 'EN, English' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });
});

test.describe('idioma de las partes (WCAG 3.1.2)', () => {
  test.use({ viewport: DESKTOP });

  // Nombres oficiales que se conservan en español dentro de la interfaz en inglés.
  const OFFICIAL_NAMES = [
    'Diploma de Postítulo en Ciberseguridad',
    'Diplomado en Gestión y Dirección de Proyectos TI',
    'Ingeniería en Informática',
    'Dirección de Vinculación con el Medio',
    'Curso Internacional de ISO/IEC 27001 Lead Implementer',
    'Aplicación Norma ISO 9001:2015',
    'Gestión de Proyectos con Metodologías Ágiles',
    'Introducción a la Inteligencia Artificial',
    'Ley de Protección de Datos 21.719',
    'Normas y Procedimientos de Protección de Datos Personales',
  ];

  /** Para cada nombre, los idiomas efectivos (lang más cercano) de todos los textos que lo contienen. */
  async function languagesOf(page: Page) {
    return page.evaluate((names) => {
      const result: Record<string, string[]> = {};
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const parent = node.parentElement;
        if (!parent || parent.closest('.sr-only')) continue;
        for (const name of names) {
          if (node.textContent?.includes(name)) {
            const lang = parent.closest('[lang]')?.getAttribute('lang') ?? '(ninguno)';
            (result[name] ??= []).push(lang);
          }
        }
      }
      return result;
    }, OFFICIAL_NAMES);
  }

  test('en inglés, cada nombre oficial en español está marcado con lang="es"', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-lang', 'en'));
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    const found = await languagesOf(page);
    expect(Object.keys(found).sort()).toEqual([...OFFICIAL_NAMES].sort());
    for (const [name, langs] of Object.entries(found)) {
      expect(new Set(langs), name).toEqual(new Set(['es']));
    }
  });

  test('en español esos nombres no llevan marcas de idioma adicionales', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    const found = await languagesOf(page);
    for (const langs of Object.values(found)) expect(new Set(langs)).toEqual(new Set(['es']));
    expect(await page.locator('main [lang]').count()).toBe(0);
  });

  test('el cambio de idioma de la interfaz no deja etiquetas <es> literales', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'EN, English' }).click();
    const text = await page.locator('body').innerText();
    expect(text).not.toMatch(/<\/?es>/);
  });

  test('axe no reporta problemas de idioma en la página en inglés', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-lang', 'en'));
    await page.goto('/');
    const results = await new AxeBuilder({ page })
      .withRules(['valid-lang', 'html-has-lang', 'html-lang-valid'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

import { DESKTOP, expect, expectScrolledTo, HEADER_HEIGHT, NAV_ITEMS, test } from './fixtures';

test.describe('navegación por anclas (escritorio)', () => {
  test.use({ viewport: DESKTOP });

  for (const item of NAV_ITEMS) {
    test(`"${item.es}" lleva a #${item.id}, actualiza el hash y marca la sección activa`, async ({
      page,
    }) => {
      await page.goto('/');
      const nav = page.getByRole('navigation', { name: 'Navegación principal' });
      await nav.getByRole('link', { name: item.es, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`#${item.id}$`));
      await expectScrolledTo(page, item.id);
      await expect(nav.getByRole('link', { name: item.es, exact: true })).toHaveAttribute(
        'aria-current',
        'location',
      );
      await expect(nav.locator('[aria-current]')).toHaveCount(1);
    });

    test(`acceso directo por fragmento /#${item.id}`, async ({ page }) => {
      await page.goto(`/#${item.id}`);
      await expectScrolledTo(page, item.id);
      await expect(
        page
          .getByRole('navigation', { name: 'Navegación principal' })
          .getByRole('link', { name: item.es, exact: true }),
      ).toHaveAttribute('aria-current', 'location');
    });
  }

  test('la sección activa sigue al desplazamiento', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav.getByRole('link', { name: 'Inicio', exact: true })).toHaveAttribute(
      'aria-current',
      'location',
    );
    await page.evaluate(() => {
      const top = document.getElementById('skills')?.getBoundingClientRect().top ?? 0;
      window.scrollTo({ top: window.scrollY + top - 80, behavior: 'instant' });
    });
    await expect(nav.getByRole('link', { name: 'Habilidades', exact: true })).toHaveAttribute(
      'aria-current',
      'location',
    );
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
    );
    await expect(nav.getByRole('link', { name: 'Contacto', exact: true })).toHaveAttribute(
      'aria-current',
      'location',
    );
  });

  test('todos los enlaces internos tienen un destino existente (sin enlaces rotos)', async ({
    page,
  }) => {
    await page.goto('/');
    const broken = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')]
        .map((a) => a.getAttribute('href') ?? '')
        .filter((href) => !document.getElementById(href.slice(1))),
    );
    expect(broken).toEqual([]);
  });

  test('los enlaces del pie (navegación rápida) llevan a su sección, incluido Currículum', async ({
    page,
  }) => {
    await page.goto('/');
    const quick = page.getByRole('navigation', { name: 'Navegación rápida' });
    await quick.getByRole('link', { name: 'Currículum' }).click();
    await expect(page).toHaveURL(/#resumes$/);
    await expectScrolledTo(page, 'resumes');
  });
});

test.describe('teclado (escritorio)', () => {
  test.use({ viewport: DESKTOP, reducedMotion: 'reduce' });
  // WebKit/Safari no enfoca enlaces con Tab por defecto (requiere Option+Tab o un ajuste del sistema):
  // el recorrido con Tab solo es comparable en Chromium y Firefox.
  test.skip(
    ({ browserName }) => browserName === 'webkit',
    'WebKit no enfoca enlaces con Tab por defecto',
  );

  test('el enlace de salto es el primer foco y mueve el foco a <main>', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Saltar al contenido principal' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/#main$/);
    await expect(page.locator('main')).toBeFocused();
  });

  test('Enter en un enlace de navegación desplaza a la sección', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('link', { name: 'Formación', exact: true })
      .focus();
    await page.keyboard.press('Enter');
    await expectScrolledTo(page, 'education');
  });

  test('recorrer toda la página con Tab: foco visible, nunca oculto bajo la cabecera y sin trampas', async ({
    page,
  }) => {
    await page.goto('/');
    const stops: { name: string; outline: string; obscured: boolean }[] = [];
    for (let i = 0; i < 80; i += 1) {
      await page.keyboard.press('Tab');
      const info = await page.evaluate((headerBottom) => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const inHeader = el.closest('header') !== null || el.getAttribute('href') === '#main';
        return {
          name: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40),
          outline: `${style.outlineStyle} ${style.outlineWidth}`,
          obscured: !inHeader && rect.top < headerBottom,
        };
      }, HEADER_HEIGHT);
      if (!info) break;
      stops.push(info);
    }
    expect(stops.length).toBeGreaterThan(25);
    expect(stops.length).toBeLessThan(80); // sin trampas: el foco sale del documento
    expect(stops.filter((s) => s.outline.startsWith('none') || s.outline.endsWith(' 0px'))).toEqual(
      [],
    );
    expect(stops.filter((s) => s.obscured)).toEqual([]);
  });

  test('Shift+Tab desde el pie recorre el contenido hacia atrás sin ocultar el foco bajo la cabecera', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
    );
    await page.locator('footer a').last().focus();
    const obscured: string[] = [];
    for (let i = 0; i < 40; i += 1) {
      await page.keyboard.press('Shift+Tab');
      const info = await page.evaluate((headerBottom) => {
        const el = document.activeElement;
        if (!el || el === document.body || el.closest('header')) return null;
        return {
          name: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40),
          obscured: el.getBoundingClientRect().top < headerBottom,
        };
      }, HEADER_HEIGHT);
      if (!info) break;
      if (info.obscured) obscured.push(info.name);
    }
    expect(obscured).toEqual([]);
  });

  test('el orden del foco sigue el orden visual: cabecera, contenido y pie', async ({ page }) => {
    await page.goto('/');
    const order: string[] = [];
    for (let i = 0; i < 80; i += 1) {
      await page.keyboard.press('Tab');
      const zone = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        return el.closest('header')
          ? 'header'
          : el.closest('footer')
            ? 'footer'
            : el.closest('main')
              ? 'main'
              : 'skip';
      });
      if (!zone) break;
      if (order[order.length - 1] !== zone) order.push(zone);
    }
    expect(order).toEqual(['skip', 'header', 'main', 'footer']);
  });
});

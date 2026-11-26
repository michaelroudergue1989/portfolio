import { expect, expectScrolledTo, MOBILE, MOBILE_NAV_ITEMS, test } from './fixtures';

const OPEN = 'Abrir menú de navegación';
const CLOSE = 'Cerrar menú de navegación';

test.describe('menú móvil (375 px)', () => {
  test.use({ viewport: MOBILE });

  test('la navegación horizontal está oculta y el menú se abre y se cierra con el botón', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation', { name: 'Navegación principal' })).toBeHidden();
    const toggle = page.getByRole('button', { name: OPEN });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await toggle.click();
    const close = page.getByRole('button', { name: CLOSE });
    await expect(close).toHaveAttribute('aria-expanded', 'true');
    const menu = page.getByRole('navigation', { name: 'Menú de navegación' });
    await expect(menu.getByRole('link')).toHaveCount(MOBILE_NAV_ITEMS.length);
    const controls = await close.getAttribute('aria-controls');
    await expect(page.locator(`[id="${controls ?? ''}"]`)).toBeVisible();

    await close.click();
    await expect(menu).toHaveCount(0);
    await expect(page.getByRole('button', { name: OPEN })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  test('Escape cierra el menú y devuelve el foco al botón', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: OPEN }).click();
    await page
      .getByRole('navigation', { name: 'Menú de navegación' })
      .getByRole('link')
      .first()
      .focus();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('navigation', { name: 'Menú de navegación' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: OPEN })).toBeFocused();
  });

  for (const item of MOBILE_NAV_ITEMS) {
    test(`elegir "${item.es}" cierra el menú y navega a #${item.id}`, async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: OPEN }).click();
      await page
        .getByRole('navigation', { name: 'Menú de navegación' })
        .getByRole('link', { name: item.es, exact: true })
        .click();
      await expect(page.getByRole('navigation', { name: 'Menú de navegación' })).toHaveCount(0);
      await expect(page).toHaveURL(new RegExp(`#${item.id}$`));
      await expectScrolledTo(page, item.id);
    });
  }

  test('un clic fuera del menú lo cierra', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: OPEN }).click();
    await page.mouse.click(200, 760);
    await expect(page.getByRole('navigation', { name: 'Menú de navegación' })).toHaveCount(0);
  });

  test('el teclado recorre el menú y, al salir del último enlace, se cierra', async ({
    page,
    browserName,
  }) => {
    test.skip(browserName === 'webkit', 'WebKit no enfoca enlaces con Tab por defecto');
    await page.goto('/');
    await page.getByRole('button', { name: OPEN }).focus();
    await page.keyboard.press('Enter');
    const menu = page.getByRole('navigation', { name: 'Menú de navegación' });
    await expect(menu).toBeVisible();
    for (const item of MOBILE_NAV_ITEMS) {
      await page.keyboard.press('Tab');
      await expect(menu.getByRole('link', { name: item.es, exact: true })).toBeFocused();
    }
    await page.keyboard.press('Tab');
    await expect(menu).toHaveCount(0);
  });

  test('abrir el menú con teclado a gran profundidad no desplaza la página (regresión)', async ({
    page,
  }) => {
    await page.goto('/#skills');
    await expectScrolledTo(page, 'skills');
    const before = await page.evaluate(() => Math.round(scrollY));
    await page.getByRole('button', { name: OPEN }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('navigation', { name: 'Menú de navegación' })).toBeVisible();
    await page.waitForTimeout(1000); // un desplazamiento suave tardaría en manifestarse
    expect(await page.evaluate(() => Math.round(scrollY))).toBe(before);
  });

  test('marca la sección activa dentro del menú', async ({ page }) => {
    await page.goto('/#skills');
    await expectScrolledTo(page, 'skills');
    // Se activa con teclado: el click() de Playwright, a gran profundidad y con cabecera fija,
    // reajusta el desplazamiento (artefacto de la herramienta; un clic DOM no lo hace).
    await page.getByRole('button', { name: OPEN }).focus();
    await page.keyboard.press('Enter');
    await expect(
      page
        .getByRole('navigation', { name: 'Menú de navegación' })
        .getByRole('link', { name: 'Habilidades', exact: true }),
    ).toHaveAttribute('aria-current', 'location');
  });
});

import { DESKTOP, expect, test } from './fixtures';

test.describe('idioma', () => {
  test.use({ viewport: DESKTOP });

  test('cambia el idioma de toda la interfaz y actualiza <html lang>', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'EN, English' }).click();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 2, name: 'Work experience' })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toContainText('All rights reserved');
    await expect(page.getByRole('button', { name: 'EN, English' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('persiste el idioma tras recargar y se puede volver al español', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'EN, English' }).click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await page.evaluate(() => localStorage.getItem('portfolio-lang'))).toBe('en');
    await page.getByRole('button', { name: 'ES, Español' }).click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Experiencia laboral' }),
    ).toBeVisible();
  });

  test('la preferencia guardada prevalece sobre el idioma del navegador', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-lang', 'es'));
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });
});

test.describe('idioma inicial según el navegador', () => {
  test.use({ locale: 'en-GB' });
  test('un navegador en inglés abre el sitio en inglés', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });
});

test.describe('idioma inicial: otros idiomas', () => {
  test.use({ locale: 'fr-FR' });
  test('cualquier otro idioma usa español por defecto', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });
});

test.describe('tema', () => {
  test.use({ viewport: DESKTOP });

  test('alterna entre claro y oscuro y persiste la elección', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Cambiar a tema oscuro' }).click();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => localStorage.getItem('portfolio-theme'))).toBe('dark');
    await page.getByRole('button', { name: 'Cambiar a tema claro' }).click();
    await page.reload();
    await expect(html).toHaveAttribute('data-theme', 'light');
  });

  test('el tema se aplica antes de que React monte (sin parpadeo)', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-theme', 'dark'));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('dark');
    const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(background).toBe('rgb(15, 23, 42)');
  });
});

test.describe('tema inicial según el sistema', () => {
  test.use({ colorScheme: 'dark' });

  test('sin preferencia guardada usa el esquema oscuro del sistema', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('la elección manual prevalece sobre el sistema tras recargar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Cambiar a tema claro' }).click();
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });
});

test.describe('tema: valores guardados inválidos', () => {
  test('ignora valores no válidos de localStorage', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('portfolio-theme', '<script>x</script>');
      localStorage.setItem('portfolio-lang', 'fr');
    });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });
});

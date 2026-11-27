import { DESKTOP, expect, expectScrolledTo, test } from './fixtures';

test.describe('movimiento reducido', () => {
  test.use({ viewport: DESKTOP, reducedMotion: 'reduce' });

  test('desactiva el desplazamiento suave y las transiciones', async ({ page }) => {
    await page.goto('/');
    const styles = await page.evaluate(() => ({
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
      transition: getComputedStyle(document.querySelector('header nav a') ?? document.body)
        .transitionDuration,
    }));
    expect(styles.scrollBehavior).toBe('auto');
    expect(Number.parseFloat(styles.transition)).toBeLessThan(0.001);
  });

  test('la navegación por anclas llega al destino de inmediato', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('link', { name: 'Contacto', exact: true })
      .click();
    // Sin animación: no se necesita esperar un desplazamiento progresivo.
    await expect(async () => {
      const top = await page.evaluate(() =>
        Math.round(document.getElementById('contact')?.getBoundingClientRect().top ?? NaN),
      );
      expect(top).toBeLessThanOrEqual(90);
    }).toPass({ timeout: 1500 });
  });
});

test.describe('movimiento normal', () => {
  test.use({ viewport: DESKTOP, reducedMotion: 'no-preference' });

  test('el desplazamiento entre secciones es inmediato, sin animación', async ({ page }) => {
    await page.goto('/');
    await page.locator('#contact').waitFor();
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior),
    ).toBe('auto');
    // Un desplazamiento animado produciría varias posiciones intermedias.
    await page.evaluate(() => {
      const target = window as unknown as { positions: number[] };
      target.positions = [];
      addEventListener('scroll', () => target.positions.push(Math.round(scrollY)));
    });
    await page
      .getByRole('navigation', { name: 'Navegación principal' })
      .getByRole('link', { name: 'Experiencia', exact: true })
      .click();
    await expectScrolledTo(page, 'experience');
    const positions = await page.evaluate(
      () => (window as unknown as { positions: number[] }).positions,
    );
    expect(new Set(positions).size).toBe(1);
  });
});

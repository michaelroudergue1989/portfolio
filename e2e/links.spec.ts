import { DESKTOP, expect, test } from './fixtures';

const LINKEDIN = 'https://www.linkedin.com/in/michael-roudergue-a69035150';
const GITHUB = 'https://github.com/michaelroudergue1989';

test.describe('enlaces', () => {
  test.use({ viewport: DESKTOP });

  test('LinkedIn y GitHub están en Hero, Contacto y pie con atributos seguros', async ({
    page,
  }) => {
    await page.goto('/');
    for (const [href, minimum] of [
      [LINKEDIN, 3],
      [GITHUB, 3],
    ] as const) {
      const links = page.locator(`a[href="${href}"]`);
      expect(await links.count()).toBeGreaterThanOrEqual(minimum);
      for (const link of await links.all()) {
        await expect(link).toHaveAttribute('target', '_blank');
        await expect(link).toHaveAttribute('rel', /noopener/);
        await expect(link).toHaveAttribute('rel', /noreferrer/);
      }
    }
    await expect(page.getByRole('link', { name: /Contactar por LinkedIn/ })).toBeVisible();
  });

  test('los enlaces externos usan https; el único enlace interno de archivo es el CV público', async ({
    page,
  }) => {
    await page.goto('/');
    const report = await page.evaluate(() => {
      const anchors = [...document.querySelectorAll<HTMLAnchorElement>('a[href]')];
      const hrefs = anchors.map((a) => a.getAttribute('href') ?? '');
      return {
        insecure: hrefs.filter(
          (href) =>
            !href.startsWith('#') &&
            !href.startsWith('https://') &&
            href !== '/cv/michael-roudergue-cv.pdf',
        ),
        withoutRel: anchors
          .filter((a) => a.target === '_blank' && !a.rel.includes('noopener'))
          .map((a) => a.href),
        files: [...new Set(hrefs.filter((href) => /\.[a-z0-9]{2,4}$/i.test(href)))],
        mailOrTel: hrefs.filter((href) => /^(mailto|tel):/i.test(href)),
        forms: document.querySelectorAll('form, input, textarea').length,
      };
    });
    expect(report).toEqual({
      insecure: [],
      withoutRel: [],
      files: ['/cv/michael-roudergue-cv.pdf'],
      mailOrTel: [],
      forms: 0,
    });
  });
});

test.describe('currículum: CV público disponible', () => {
  test.use({ viewport: DESKTOP });

  test('hay un único currículum profesional con descarga y visualización habilitadas', async ({
    page,
  }) => {
    await page.goto('/#resumes');
    const section = page.locator('#resumes');
    await expect(
      section.getByRole('heading', { level: 2, name: 'Currículum profesional' }),
    ).toBeVisible();
    await expect(section.getByRole('article')).toHaveCount(1);
    await expect(section.getByText('Ingeniero en Informática')).toBeVisible();
    await expect(section.getByText('PDF · Español · 2 páginas · Actualizado:')).toBeVisible();
    for (const name of [/Descargar CV/, /Visualizar CV/]) {
      await expect(section.getByRole('link', { name })).toHaveAttribute(
        'href',
        '/cv/michael-roudergue-cv.pdf',
      );
    }
    await expect(section.getByRole('button')).toHaveCount(0);
    await expect(section.getByText('No disponible')).toHaveCount(0);
  });

  test('no quedan referencias a los currículums especializados', async ({ page }) => {
    await page.goto('/');
    const text = await page.locator('body').innerText();
    for (const obsolete of [
      'Jefatura de Proyectos TI',
      'CV Desarrollo de Software',
      'CV Ciberseguridad',
      'Currículums especializados',
      'CV Maestro',
      'Currículum principal',
      'Más currículums',
    ]) {
      expect(text, obsolete).not.toContain(obsolete);
    }
  });

  test('el Hero ofrece "Descargar CV" como acción principal junto a "Ver experiencia"', async ({
    page,
  }) => {
    await page.goto('/');
    const hero = page.locator('#home');
    await expect(hero.getByRole('link', { name: /Ver experiencia/ })).toHaveAttribute(
      'href',
      '#experience',
    );
    await expect(hero.getByRole('link', { name: /Descargar CV/ })).toHaveAttribute(
      'href',
      '/cv/michael-roudergue-cv.pdf',
    );
  });

  test('en inglés la sección y el CTA se traducen', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'EN, English' }).click();
    const section = page.locator('#resumes');
    await expect(
      section.getByRole('heading', { level: 2, name: 'Professional résumé' }),
    ).toBeVisible();
    await expect(section.getByRole('link', { name: /Download CV/ })).toBeVisible();
    await expect(section.getByRole('link', { name: /View CV/ })).toBeVisible();
    await expect(section.getByText('PDF · Spanish · 2 pages · Updated:')).toBeVisible();
    await expect(page.locator('#home').getByRole('link', { name: /Download CV/ })).toBeVisible();
    await expect(
      page.locator('#home').getByRole('link', { name: /View experience/ }),
    ).toBeVisible();
  });
});

import { createHash } from 'node:crypto';
import { AUTHORIZED_CV, findPersonalData } from '../scripts/check-publication.mjs';
import { DESKTOP, expect, test } from './fixtures';

/** El correo autorizado vive solo dentro del PDF del CV: nunca en la web que lo enlaza. */
test.use({ viewport: DESKTOP });

test('la página y sus recursos no contienen correos ni enlaces mailto', async ({ page }) => {
  const resources: Promise<[string, string]>[] = [];
  page.on('response', (response) => {
    if (/\.(woff2|ico|png)$/.test(new URL(response.url()).pathname)) return;
    resources.push(response.text().then((body) => [response.url(), body]));
  });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('#contact').waitFor();

  const bodies = await Promise.all(resources);
  expect(bodies.some(([url]) => url.endsWith('.js'))).toBe(true);
  expect(bodies.some(([url]) => url.endsWith('.css'))).toBe(true);
  for (const [url, body] of bodies) expect(findPersonalData(body), url).toEqual([]);

  for (const language of ['ES, Español', 'EN, English']) {
    await page.getByRole('button', { name: language }).click();
    expect(findPersonalData(await page.content()), language).toEqual([]);
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  }
});

test('el CV servido es exactamente el archivo autorizado', async ({ request }) => {
  const response = await request.get(`/${AUTHORIZED_CV.distPath}`);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/pdf');
  expect(
    createHash('sha256')
      .update(await response.body())
      .digest('hex'),
  ).toBe(AUTHORIZED_CV.sha256);
});

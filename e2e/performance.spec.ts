import { DESKTOP, expect, test } from './fixtures';

/** Métricas de campo básicas en Chromium (no sustituyen a Lighthouse; ver docs/RENDIMIENTO.md). */
test.describe('rendimiento básico', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Las métricas se miden solo en Chromium',
  );
  test.use({ viewport: DESKTOP });

  test('CLS ≈ 0, FCP/LCP razonables y pocas peticiones', async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __cls: number; __lcp: number };
      w.__cls = 0;
      w.__lcp = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as {
          value: number;
          hadRecentInput: boolean;
        }[]) {
          if (!entry.hadRecentInput) w.__cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver((list) => {
        const last = list.getEntries().at(-1);
        if (last) w.__lcp = last.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    });
    await page.goto('/', { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
    const metrics = await page.evaluate(() => {
      const w = window as unknown as { __cls: number; __lcp: number };
      const fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? -1;
      return {
        cls: w.__cls,
        lcp: w.__lcp,
        fcp,
        requests: performance.getEntriesByType('resource').length,
      };
    });
    test.info().annotations.push({ type: 'metrics', description: JSON.stringify(metrics) });
    expect(metrics.cls).toBeLessThan(0.1);
    expect(metrics.fcp).toBeGreaterThan(0);
    expect(metrics.fcp).toBeLessThan(1800);
    expect(metrics.lcp).toBeLessThan(2500);
    expect(metrics.requests).toBeLessThanOrEqual(8);
  });
});

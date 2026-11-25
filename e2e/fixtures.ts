import { test as base, expect, type Page } from '@playwright/test';

/** Observador de incidencias de una página: se verifica automáticamente al terminar cada prueba. */
export interface Monitor {
  consoleErrors: string[];
  pageErrors: string[];
  externalRequests: string[];
  badResponses: string[];
  cspViolations: () => Promise<string[]>;
}

interface CspWindow {
  __cspViolations?: string[];
}

/** Hosts locales permitidos; cualquier otro origen es una petición externa inesperada. */
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

export const test = base.extend<{ monitor: Monitor }>({
  monitor: [
    async ({ page }, use) => {
      const monitor: Monitor = {
        consoleErrors: [],
        pageErrors: [],
        externalRequests: [],
        badResponses: [],
        cspViolations: () =>
          page.evaluate(() => (window as unknown as CspWindow).__cspViolations ?? []),
      };

      await page.addInitScript(() => {
        const target = window as unknown as CspWindow;
        target.__cspViolations = [];
        document.addEventListener('securitypolicyviolation', (event) => {
          target.__cspViolations?.push(`${event.violatedDirective} → ${event.blockedURI}`);
        });
      });

      page.on('console', (message) => {
        if (message.type() === 'error') monitor.consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => monitor.pageErrors.push(error.message));
      page.on('request', (request) => {
        const url = new URL(request.url());
        if (url.protocol === 'data:' || url.protocol === 'about:' || url.protocol === 'blob:')
          return;
        if (!LOCAL_HOSTS.has(url.hostname)) monitor.externalRequests.push(request.url());
      });
      page.on('response', (response) => {
        const url = new URL(response.url());
        if (LOCAL_HOSTS.has(url.hostname) && response.status() >= 400) {
          monitor.badResponses.push(`${String(response.status())} ${url.pathname}`);
        }
      });

      await use(monitor);

      expect(monitor.pageErrors, 'errores de JavaScript no capturados').toEqual([]);
      expect(monitor.consoleErrors, 'errores en la consola del navegador').toEqual([]);
      expect(monitor.externalRequests, 'peticiones a orígenes externos').toEqual([]);
      expect(monitor.badResponses, 'respuestas HTTP >= 400 del propio sitio').toEqual([]);
      expect(await monitor.cspViolations(), 'violaciones de la CSP').toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

/** Altura de la cabecera fija y margen de desplazamiento (--header-height + 1rem). */
export const HEADER_HEIGHT = 65;
export const SCROLL_TARGET_TOP = 80;

export const NAV_ITEMS = [
  { id: 'home', es: 'Inicio', en: 'Home' },
  { id: 'about', es: 'Sobre mí', en: 'About' },
  { id: 'experience', es: 'Experiencia', en: 'Experience' },
  { id: 'projects', es: 'Proyectos', en: 'Projects' },
  { id: 'skills', es: 'Habilidades', en: 'Skills' },
  { id: 'education', es: 'Formación', en: 'Education' },
  { id: 'certifications', es: 'Certificaciones', en: 'Certifications' },
  { id: 'contact', es: 'Contacto', en: 'Contact' },
] as const;

export const SECTION_IDS = [
  'home',
  'stats',
  'about',
  'areas',
  'experience',
  'projects',
  'skills',
  'education',
  'certifications',
  'resumes',
  'contact',
] as const;

export const DESKTOP = { width: 1440, height: 900 };
export const MOBILE = { width: 375, height: 800 };

/** Distancia (px) entre el borde superior de la sección y la parte superior de la ventana. */
export function topOf(page: Page, id: string): Promise<number> {
  return page.evaluate(
    (sectionId) =>
      Math.round(document.getElementById(sectionId)?.getBoundingClientRect().top ?? NaN),
    id,
  );
}

/** Espera a que el desplazamiento (posiblemente suave) llegue a la sección. */
export async function expectScrolledTo(page: Page, id: string): Promise<void> {
  await expect(async () => {
    const top = await topOf(page, id);
    expect(top).toBeGreaterThanOrEqual(HEADER_HEIGHT - 10);
    expect(top).toBeLessThanOrEqual(SCROLL_TARGET_TOP + 10);
  }).toPass({ timeout: 10_000 });
}

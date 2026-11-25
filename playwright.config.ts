import { defineConfig, devices } from '@playwright/test';

// Los navegadores se instalan dentro del proyecto (npm run e2e:install): sin caché global.
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '0';

const PORT = 4173;
const BASE_URL = `http://localhost:${String(PORT)}`;

/**
 * E2E sobre el build de producción servido con `vite preview` (que replica las cabeceras de
 * vercel.json). Requiere `npm run build` previo: usa `npm run test:e2e`.
 * Chromium, Firefox y WebKit (motor de Safari: NO equivale a probar Safari real).
 * Las pruebas de accesibilidad con axe corren solo en Chromium (el análisis es independiente del motor).
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  // Concurrencia acotada: tres motores en paralelo con muchos workers producen fluctuaciones por carga.
  workers: process.env.CI ? 2 : 3,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL: BASE_URL,
    locale: 'es-CL',
    colorScheme: 'light',
    serviceWorkers: 'block',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run preview -- --port ${String(PORT)} --strictPort`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] }, testIgnore: /a11y\.spec\.ts/ },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testIgnore: /a11y\.spec\.ts/,
      // El build de WebKit para Windows muestra fluctuaciones puntuales bajo carga (las pruebas pasan en
      // aislamiento). Un reintento; Playwright lo informa como "flaky" (no se oculta).
      retries: 1,
    },
  ],
});

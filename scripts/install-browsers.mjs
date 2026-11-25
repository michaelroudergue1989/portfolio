#!/usr/bin/env node
/**
 * Instala los navegadores de Playwright DENTRO del proyecto (node_modules/playwright-core/.local-browsers,
 * ignorado por Git) en lugar del caché global del usuario. No requiere permisos de administrador.
 * Uso: npm run e2e:install [-- chromium firefox webkit]
 */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const cli = require.resolve('@playwright/test/cli');
const requested = process.argv.slice(2);
const browsers = requested.length > 0 ? requested : ['chromium', 'firefox', 'webkit'];

const result = spawnSync(process.execPath, [cli, 'install', ...browsers], {
  stdio: 'inherit',
  env: { ...process.env, PLAYWRIGHT_BROWSERS_PATH: '0' },
});
process.exit(result.status ?? 1);

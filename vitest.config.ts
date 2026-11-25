import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'], // e2e/ lo ejecuta Playwright, no Vitest
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // true: permite leer tokens.css con ?raw en la prueba de contraste (css:false lo devuelve vacío).
    css: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/test/**',
        'src/main.tsx',
        'src/types/**',
        'src/**/*.d.ts',
      ],
      reporter: ['text-summary', 'json-summary'],
      // Mínimos para evitar regresiones (medido: líneas 99 %, sentencias 98 %, funciones 99 %, ramas 89 %).
      thresholds: { lines: 95, statements: 95, functions: 95, branches: 80 },
    },
  },
});

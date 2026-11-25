# Rendimiento

Medido el 2026-11-24 y **repetido el 2026-11-25** (tras el ajuste del CV único y 3.1.2) sobre el **build de producción local** servido con `vite preview` (con las cabeceras
de `vercel.json`). No es una medición en el sitio desplegado.

## 1. Entorno

| Elemento          | Valor                                                                                           |
| ----------------- | ----------------------------------------------------------------------------------------------- |
| Equipo            | Windows 11 Pro, 20 procesadores lógicos, Node 24.22.1                                           |
| Herramienta       | Lighthouse **13.6.0** (instalado **fuera** del repositorio; no es dependencia)                  |
| Navegador         | Chromium headless 157 (build de Playwright `chromium-1255`)                                     |
| Perfil móvil      | Emulación móvil, throttling simulado (RTT 150 ms, 1,6 Mbps, CPU ×4) — configuración por defecto |
| Perfil escritorio | `--preset=desktop` (RTT 40 ms, 10 Mbps, CPU ×1)                                                 |
| Repeticiones      | 3 por perfil; se informa la **mediana**                                                         |
| Condiciones       | Servidor local (sin red real, sin CDN, **sin compresión** gzip/brotli de `vite preview`)        |

No se alteraron las condiciones de prueba para mejorar las puntuaciones.

## 2. Resultados Lighthouse (medianas)

| Categoría / métrica      | Móvil                  | Escritorio |
| ------------------------ | ---------------------- | ---------- |
| **Performance**          | **99** (96, 99, 100)   | **100**    |
| **Accessibility**        | **100**                | **100**    |
| **Best Practices**       | **100**                | **100**    |
| **SEO**                  | **100**                | **100**    |
| First Contentful Paint   | 0,92 s                 | 0,27 s     |
| Largest Contentful Paint | 0,95 s                 | 0,27 s     |
| Total Blocking Time      | 149 ms                 | 0 ms       |
| Cumulative Layout Shift  | **0**                  | **0**      |
| Speed Index              | 0,92 s                 | 0,27 s     |
| Peso transferido         | 214 kB (sin comprimir) | 214 kB     |
| Peticiones               | 7                      | 7          |

Objetivo (≥ 90 en las cuatro categorías): **cumplido** en este entorno.

**Hallazgo sobre SEO.** Con `connect-src 'none'` en la CSP, Lighthouse puntuaba SEO = 91 por
"robots.txt is not valid": el robots.txt era válido, pero Lighthouse lo descarga con `fetch` dentro de la
página y la CSP lo bloqueaba (confirmado: sin cabeceras, SEO = 100). Se ajustó a `connect-src 'self'`
(no abre ningún destino externo; ver `docs/SEGURIDAD.md`). Medición previa al ajuste: 99/100/100/**91** (móvil).

**Cambio respecto a la medición del 2026-11-24:** el JavaScript creció ≈ 11 kB (≈ 4 kB gzip) por el componente `Trans` de `react-i18next` (marcado `lang="es"`, WCAG 3.1.2); la puntuación móvil se mantiene en 99 (mediana; una de las tres ejecuciones dio 96, por variación de TBT) y el TBT subió de 136 a 149 ms.

## 3. Tamaño del build

| Archivo                                    | Tamaño    | gzip      |
| ------------------------------------------ | --------- | --------- |
| JavaScript (`assets/index-*.js`)           | 364,47 kB | 112,22 kB |
| CSS (`assets/index-*.css`)                 | 26,42 kB  | 6,19 kB   |
| Inter (WOFF2, subconjunto latino)          | 48,25 kB  | —         |
| JetBrains Mono (WOFF2, subconjunto latino) | 40,40 kB  | —         |
| `index.html`                               | 1,91 kB   | 0,72 kB   |

En producción (Vercel) el JS, CSS y HTML se sirven comprimidos; las fuentes WOFF2 ya están comprimidas.

## 4. Auditorías no perfectas y decisiones

| Auditoría                               | Valor                                    | Decisión                                                                                                                                                        |
| --------------------------------------- | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reducir JavaScript no usado             | ~46 KiB (≈ 44 % del bundle)              | Aceptado: es el runtime de React/i18next y el contenido; la división de código añadiría complejidad sin beneficio medible con una sola página                   |
| Solicitudes que bloquean el renderizado | `theme-init.js` (1,5 kB) y el CSS (7 kB) | **Intencional**: el script aplica el tema antes del primer pintado (sin parpadeo) y debe ser un archivo externo por la CSP. El CSS es crítico para el contenido |
| Árbol de dependencias de red            | Cadena de 110 ms                         | Informativa; las fuentes se precargan                                                                                                                           |

**Optimizaciones aplicadas (sin complicar la arquitectura):**

- Fuentes WOFF2 latinas autoalojadas y **precargadas** (`<link rel="preload" as="font" crossorigin>`
  inyectado en el build). Mejora CLS y evita reajustes del diseño al aplicar la fuente.
- `font-display: swap`; sin CDN ni recursos de terceros; sin imágenes pesadas.
- Activos con hash y `Cache-Control: immutable` de 1 año.
- Sin `data:` URIs ni librerías de animación/UI.

## 5. Métricas de campo básicas en las E2E (Chromium)

`e2e/performance.spec.ts` exige: CLS < 0,1, FCP < 1,8 s, LCP < 2,5 s y ≤ 8 peticiones. Pasa.

## 6. Cómo reproducir (herramienta externa)

```powershell
npm run build ; npm run preview -- --port 4173 --strictPort
# En otra terminal, en un directorio fuera del repositorio:
npm install lighthouse@13.6.0
node node_modules/lighthouse/cli/index.js http://localhost:4173/ --only-categories=performance,accessibility,best-practices,seo --output=json
# Escritorio: añadir --preset=desktop
```

(Se usó el Chromium descargado por Playwright mediante `--chrome-path`.)

## 7. Limitaciones y pendientes

- Una sola máquina y un solo navegador (Chromium); sin datos de campo (CrUX/RUM).
- Localhost: sin latencia real, sin CDN, sin compresión; los valores de transferencia son sin comprimir.
- Lighthouse no está integrado en CI (decisión: evitar una dependencia pesada y resultados variables).
- **Pendiente tras el despliegue:** repetir Lighthouse sobre la URL definitiva (móvil y escritorio),
  verificar compresión y caché reales, y revisar Core Web Vitals en el panel de Vercel si se activara
  (no autorizado: sería analítica).

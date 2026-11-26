# Seguridad y privacidad

El repositorio será **público**; el sitio es estático (sin backend, base de datos, formularios, cookies,
analítica ni APIs). Este documento es publicable: no contiene información confidencial.

> **Estado de verificación.** Lo descrito como "verificado" se comprobó **en local** (build servido con
> `vite preview`, que replica las cabeceras de `vercel.json`) y mediante pruebas automatizadas.
> **No se ha desplegado:** las cabeceras HTTP **no están verificadas en producción** (ver sección 9).

## 1. Superficie de ataque y supuestos

- Sitio estático: no procesa entradas de usuarios (sin formularios ni parámetros), no consume APIs ni
  carga recursos de terceros. El riesgo principal es la **fuga de información** (repositorio,
  historial, artefactos) y la **cadena de suministro** (dependencias, CI).
- Datos del usuario en el navegador: solo dos preferencias en `localStorage` (`portfolio-theme`,
  `portfolio-lang`), con valores de lista cerrada; los valores no válidos se ignoran (probado).
- Sin cookies, sin autenticación, sin datos sensibles, sin `sessionStorage`/`IndexedDB`.

## 2. Cabeceras HTTP (`vercel.json`) y justificación

Fuente única: `vercel.json`. `vite preview` y la suite E2E leen esas mismas cabeceras
(`vite.config.ts`), de modo que lo que se prueba es lo que se configura.

| Cabecera                       | Valor                                                                                                                | Justificación                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `Content-Security-Policy`      | Ver sección 3                                                                                                        | Mitiga XSS e inyección de recursos                                                  |
| `X-Content-Type-Options`       | `nosniff`                                                                                                            | Evita MIME sniffing                                                                 |
| `Referrer-Policy`              | `strict-origin-when-cross-origin`                                                                                    | No filtra rutas a otros orígenes (los enlaces salientes además llevan `noreferrer`) |
| `Permissions-Policy`           | Cámara, micrófono, geolocalización, pago, USB, sensores, `browsing-topics`, etc. deshabilitados; `fullscreen=(self)` | El sitio no usa esas APIs: mínimo privilegio                                        |
| `X-Frame-Options`              | `DENY`                                                                                                               | Refuerzo heredado de `frame-ancestors 'none'` (navegadores antiguos)                |
| `Cross-Origin-Opener-Policy`   | `same-origin`                                                                                                        | Aísla el contexto de navegación                                                     |
| `Cross-Origin-Resource-Policy` | `same-origin`                                                                                                        | Impide que otros orígenes incrusten los recursos                                    |
| `Cache-Control` (`/assets/*`)  | `public, max-age=31536000, immutable`                                                                                | Archivos con hash en el nombre                                                      |
| `Strict-Transport-Security`    | **No se define** (decisión)                                                                                          | Vercel la aplica por defecto (ver abajo)                                            |

**HSTS.** Según la documentación de Vercel, el valor por defecto es `max-age=63072000` (2 años) en
dominios propios y en `*.vercel.app` incluye además `includeSubDomains; preload` y están precargados
([Response headers](https://vercel.com/docs/headers/response-headers),
[Encryption](https://vercel.com/docs/cdn-security/encryption)). Se evita redefinirla para no
duplicar ni degradar el valor efectivo. Un hilo de la comunidad indica que sobrescribirla desde
`vercel.json` podría no tener efecto ([comunidad](https://community.vercel.com/t/hsts-header/14985));
no está confirmado, por eso **la cabecera efectiva debe comprobarse tras el despliegue**.

## 3. Content-Security-Policy

```
default-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self';
connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'none';
frame-ancestors 'none'; object-src 'none'
```

| Directiva                  | Valor    | Por qué                                                                                                                                                                                                    |
| -------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `default-src`              | `'none'` | Todo lo no listado queda prohibido                                                                                                                                                                         |
| `script-src`               | `'self'` | Solo el bundle propio y `theme-init.js` (archivo externo). **Sin `unsafe-inline` ni `unsafe-eval`**                                                                                                        |
| `style-src`                | `'self'` | Tailwind se compila a un archivo CSS; React no usa atributos `style` en línea. **Sin `unsafe-inline`**                                                                                                     |
| `font-src`                 | `'self'` | Fuentes autoalojadas (WOFF2)                                                                                                                                                                               |
| `img-src`                  | `'self'` | Favicon e imágenes locales (futura foto). El build desactiva `data:` (`assetsInlineLimit: 0`)                                                                                                              |
| `connect-src`              | `'self'` | El sitio no hace peticiones de red; `'self'` evita un falso "robots.txt inválido" en Lighthouse (que lo descarga con `fetch` dentro de la página, bloqueado por `'none'`) y no abre ningún destino externo |
| `manifest-src`             | `'self'` | Previsto; sin manifiesto hoy                                                                                                                                                                               |
| `base-uri` / `form-action` | `'none'` | No hay `<base>` ni formularios                                                                                                                                                                             |
| `frame-ancestors`          | `'none'` | Anti-clickjacking (equivale a `X-Frame-Options: DENY`)                                                                                                                                                     |
| `object-src`               | `'none'` | Sin plugins                                                                                                                                                                                                |

**Justificación de no usar `unsafe-inline`.** Se evaluó y **no es necesaria**: no hay scripts ni
estilos en línea (la guardia de publicación lo exige sobre `dist/index.html`), el tema se aplica con un
script **externo** (`/theme-init.js`) y el CSS está en archivo. La suite E2E falla ante cualquier
violación de CSP (`securitypolicyviolation`) o error de consola.

**No incluido a propósito:** `upgrade-insecure-requests` (no hay recursos http; además rompe el servidor
local), `require-trusted-types-for` (no evaluado con React 19: posible mejora futura) y `report-uri`
(no hay endpoint ni backend).

**Cambios futuros que exigen revisar la CSP:** fotografía (`img-src` ya permite `'self'`), analítica
(no autorizada), incrustaciones de terceros (no previstas).

## 4. Revisión de seguridad del código (Fase 5)

| Área                                                                                                                              | Resultado                                                                                                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dangerouslySetInnerHTML`, `innerHTML`/`outerHTML`, `insertAdjacentHTML`, `document.write`, `eval`, `new Function`, `javascript:` | **Ninguno** en el código de producción; ESLint los **prohíbe** como error (`no-restricted-syntax`, `no-eval`, `no-implied-eval`, `no-new-func`, `no-script-url`)                                                                         |
| Validación de URLs                                                                                                                | `ExternalLink` solo admite `https:` sin credenciales; fuera de eso no genera enlace (probado: `http`, `javascript:`, `data:`, relativas, vacías, con credenciales). El currículum solo se enlaza si cumple `/cv/<nombre>.pdf`            |
| Enlaces externos                                                                                                                  | `target="_blank"` siempre con `rel="noopener noreferrer"` (E2E recorre todos); solo LinkedIn y GitHub confirmados (la guardia rechaza otros perfiles)                                                                                    |
| XSS                                                                                                                               | React escapa el contenido; sin HTML dinámico; i18next con `escapeValue: false` solo porque React ya escapa                                                                                                                               |
| `localStorage`                                                                                                                    | Solo `portfolio-theme` y `portfolio-lang`; valores validados contra lista cerrada; E2E verifica que no hay otras claves ni cookies. Un valor manipulado no ejecuta código                                                                |
| Source maps                                                                                                                       | `build.sourcemap = false`; la guardia rechaza `.map` y `sourceMappingURL`; E2E comprueba que no se sirven                                                                                                                                |
| Archivos estáticos                                                                                                                | Solo `favicon.svg`, `favicon.ico` (generado a partir del SVG; evita el 404 que algunos navegadores provocan en la pestaña del PDF), `theme-init.js`, `robots.txt`, fuentes y (si se habilita) PDF; la guardia restringe tipos de archivo |
| Metadatos                                                                                                                         | Sin datos personales adicionales; sin JSON-LD; sin `og:image` (requeriría dominio)                                                                                                                                                       |
| Consola del navegador                                                                                                             | E2E exige **cero** errores de consola y de JavaScript en todos los flujos                                                                                                                                                                |
| Peticiones de red                                                                                                                 | E2E exige **cero** peticiones a orígenes distintos del local                                                                                                                                                                             |
| Dependencias                                                                                                                      | `npm audit`: 0 vulnerabilidades (completo y de producción)                                                                                                                                                                               |

## 5. Dependencias y cadena de suministro

- `package-lock.json` versionado; instalación reproducible con `npm ci`.
- Producción (5): react, react-dom, i18next, react-i18next, lucide-react. El resto son de desarrollo.
- Nuevas en la Fase 5 (solo desarrollo): `@playwright/test`, `@axe-core/playwright`,
  `@vitest/coverage-v8` (ver `docs/PRUEBAS.md`). Lighthouse **no** es dependencia (se usa fuera del repo).
- **Riesgos aceptados y documentados:**
  - `eslint@9.39.5` figura como sin soporte (`npm` lo marca _deprecated_): solo herramienta de
    desarrollo; migrar a ESLint 10 cuando `eslint-plugin-jsx-a11y` lo soporte.
  - `typescript@~6.0.3`: `typescript-eslint` exige `<6.1.0`.
  - Dependabot (`.github/dependabot.yml`) ignora esas actualizaciones incompatibles y agrupa el resto.
- Los binarios de Playwright se descargan del CDN oficial de Playwright y se guardan **dentro del
  proyecto** (`node_modules`, ignorado). Sin permisos de administrador ni instalaciones globales.

## 6. Integración continua (`.github/workflows/ci.yml`)

Se ejecuta en GitHub con cada push. Última ejecución registrada: `ed97d9e` (2026-11-26), **success**.

- Permisos: `permissions: {}` global y `contents: read` por job. Sin secretos. **Sin despliegue.**
- Acciones **fijadas por SHA de commit** (`actions/checkout`, `actions/setup-node`,
  `actions/upload-artifact`; versiones y SHA consultados en los repositorios oficiales de la organización
  `actions` el 2026-11-24). `persist-credentials: false` en el checkout.
- `npm ci`; Node 22.x y 24.x; formato, tipos, lint, pruebas con cobertura, build (incluye la guardia),
  `verify:publication`, `npm audit` y E2E en los tres motores.
- La guardia verifica estas reglas sobre los workflows versionados (acciones fijadas, permisos,
  sin `pull_request_target`, sin secretos, sin escritura, sin despliegue).

## 7. Privacidad e historial (resumen; detalle en `docs/PUBLICACION.md`)

- **Árbol de trabajo:** sin información pendiente de autorización (guardia estructural + revisión
  privada local). Los nombres específicos de sistemas se sustituyeron por denominaciones genéricas.
- **Historial local:** contiene commits anteriores con información pendiente de autorización. **No
  se debe publicar**; el repositorio público se alimenta solo con instantáneas saneadas desde un directorio
  separado. `push.default = nothing` está activo en la configuración local. No se reescribió el historial.
- **Guardia de publicación** por niveles: estructural, PDF, `dist/`, metadatos, contenido autorizado y
  privada (solo local). Cuando la lista privada no está disponible informa la **LIMITACIÓN** y la
  revisión queda **INCOMPLETA**: no se declara completa.

## 8. Riesgos pendientes

- Publicar el historial actual (mitigado solo por el procedimiento; requiere ejecución y autorización).
- La revisión privada no corre en CI/Vercel (por diseño).
- Los controles de datos personales de la guardia son **heurísticos**: no garantizan identificar todos los datos personales posibles (ver `docs/PUBLICACION.md`, 4.2). El inspector de PDF falla de forma segura ante estructuras que no puede analizar, pero no es un lector PDF completo.
- **Política de formatos versionables** (lista de permitidos, `docs/PUBLICACION.md` 4.3): los binarios no se inspeccionan por texto y requieren revisión expresa.
- **Remotos:** el repositorio de desarrollo no tiene remotos (eliminado `origin` el 2026-11-25); el remoto se añade solo en el repositorio de publicación. El éxito de CI **no** sustituye la revisión privada estricta local.
- Cabeceras de `/` comparadas en producción con `vercel.json` (2026-11-26): coinciden y HSTS está presente. No se usaron escáneres externos.
- La alcanzabilidad de los enlaces externos (LinkedIn/GitHub) no se prueba (dependen de terceros y
  bloquean automatización); solo se valida su estructura.

## 9. Verificaciones pendientes en producción (tras autorización de despliegue)

1. `curl -sI https://<dominio>/` (o equivalente): comparar **cada** cabecera con `vercel.json` y confirmar
   `Strict-Transport-Security` efectiva (`max-age=63072000`).
2. Abrir el sitio con la consola abierta: cero violaciones de CSP y cero errores.
3. Escáneres externos (p. ej. Mozilla Observatory, securityheaders.com) sobre la URL definitiva.
4. Comprobar `/robots.txt`, `/sitemap.xml` (solo con `SITE_URL`), que `/private/` y `*.map` respondan 404
   y que las rutas `/cv/*.pdf` no existan mientras no se autoricen.
5. Revisar la protección de despliegues de Vercel y la visibilidad de las URL de vista previa.
6. En GitHub: Secret scanning, Push protection, Dependabot y protección de la rama principal.

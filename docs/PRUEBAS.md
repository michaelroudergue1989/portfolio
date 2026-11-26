# Pruebas y calidad

Todo lo siguiente es reproducible desde el repositorio salvo lo indicado como "externo".
Resultados medidos el 2026-11-24 (Fase 5) y revalidados el 2026-11-25 (CV único, 3.1.2 y correcciones de la Fase 6) en Windows 11, Node 24.22.1, npm 11.19.1, 20 procesadores lógicos.

## 1. Comandos

| Comando                                                    | Qué hace                                                                                          |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `npm run check`                                            | Formato + tipos + lint + pruebas unitarias + build (con guardia)                                  |
| `npm run format:check` · `typecheck` · `lint`              | Prettier, `tsc -b`, ESLint (reglas estrictas, jsx-a11y y de seguridad)                            |
| `npm test`                                                 | Pruebas unitarias y de integración (Vitest)                                                       |
| `npm run test:coverage`                                    | Lo anterior con cobertura v8 y umbrales mínimos                                                   |
| `npm run build`                                            | Compila y ejecuta la guardia de publicación (`postbuild`)                                         |
| `npm run verify:publication` / `verify:publication:strict` | Guardia sobre `dist/` (la estricta exige la lista privada local)                                  |
| `npm run verify:public-branch -- <rama>`                   | Verifica que la futura rama pública no comparte historial (`--repo=<ruta>` para otro repositorio) |
| `npm run verify:cv -- <ruta.pdf>`                          | Verifica un PDF de CV antes de publicarlo (texto extraíble, datos personales, metadatos)          |
| `npm run e2e:install`                                      | Descarga Chromium, Firefox y WebKit **dentro del proyecto** (`node_modules`)                      |
| `npm run test:e2e`                                         | Compila y ejecuta Playwright (E2E + accesibilidad con axe) en los tres motores                    |
| `npm run test:e2e:built`                                   | Playwright sin recompilar (usa `dist/` existente)                                                 |
| `npm audit` / `npm run audit:deps`                         | Auditoría de dependencias (completa / solo producción)                                            |

## 2. Herramientas y versiones

| Herramienta                                        | Versión                                     | Uso                                                          |
| -------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| Vitest                                             | 5.1.1                                       | Unitarias/integración (jsdom 31, Testing Library 16)         |
| `@vitest/coverage-v8`                              | 5.1.1                                       | Cobertura (nueva, solo desarrollo)                           |
| `@playwright/test`                                 | 1.65.1                                      | E2E (nueva, solo desarrollo)                                 |
| `@axe-core/playwright` / axe-core                  | 4.14.1 / 4.14.1                             | Accesibilidad automatizada (nueva, solo desarrollo)          |
| Chromium / Firefox / WebKit (builds de Playwright) | chromium-1255 / Firefox 159.0 / WebKit 27.2 | Motores de E2E                                               |
| Lighthouse                                         | 13.6.0                                      | Rendimiento; **externo** al repo (ver `docs/RENDIMIENTO.md`) |

**Justificación de dependencias nuevas:** Playwright da pruebas reproducibles en tres motores;
`@axe-core/playwright` evita una segunda herramienta de accesibilidad equivalente; coverage-v8 aporta
evidencia medible para la auditoría. No se añadió ninguna dependencia de producción.

## 3. Resultados reales

### Unitarias e integración (Vitest)

- **26 archivos, 388 pruebas, todas pasan** (2026-11-25, tras la corrección de la Fase A).
- Cobertura: **líneas 99,37 %**, sentencias 98,28 %, funciones 99,21 %, ramas 89,57 %.
  Umbrales mínimos en `vitest.config.ts`: líneas/sentencias/funciones 95 %, ramas 80 %.
  Alcance: `src/` (los scripts de `scripts/` se prueban mediante sus funciones puras, pero no se
  incluyen en el informe de cobertura).
- Áreas: componentes, secciones, datos (integridad, claves de i18n ES/EN, orden cronológico),
  navegación, hooks (sección activa, hash, foco no oculto), tema/idioma/persistencia, contraste de
  tokens (≥ 4,5:1 texto, ≥ 3:1 componentes, ≥ 5:1 insignias), currículums y guardia de publicación
  (positivas y negativas por nivel con datos **sintéticos construidos por partes**, sin términos reales: formatos de teléfono y RUT chilenos, correos ofuscados, política de formatos versionables y PDF sintéticos que fallan de forma segura), inspección de PDF (10), `verify:cv` (9), idioma de las partes (10) y verificador de rama pública (5).

### E2E (Playwright)

| Motor     | Pruebas listadas | Resultado                                                               |
| --------- | ---------------- | ----------------------------------------------------------------------- |
| Chromium  | 123              | todas pasan                                                             |
| Firefox   | 99               | todas pasan                                                             |
| WebKit    | 99               | todas pasan (sin reintentos)                                            |
| **Total** | **321**          | **312 pasan, 9 omitidas, 0 fallan** (ejecución completa del 2026-11-25) |

Omitidas (9) y motivo:

- Recorrido con **Tab por enlaces** en WebKit (5 en navegación, 1 en menú móvil y 1 en foco por teclado): WebKit/Safari no
  enfoca enlaces con Tab por defecto (requiere Option+Tab o un ajuste del sistema).
- Métricas de rendimiento en Firefox y WebKit (2): se miden solo en Chromium.

Cobertura funcional de los E2E (`e2e/`):

| Archivo                     | Verifica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smoke.spec.ts`             | Carga inicial, título/idioma/h1, 11 secciones, fuentes, sin desbordamiento (320–1440 px), cabeceras de `vercel.json`, CSP sin `unsafe-*`, robots/sitemap sin dominio inventado, sin `.map`/`private`, sin PDF, solo claves de tema/idioma en `localStorage`, sin cookies                                                                                                                                                                                                                                                                                                               |
| `navigation.spec.ts`        | 8 enlaces × (clic + hash + `aria-current`) y 8 accesos directos por fragmento, sección activa al desplazar, enlaces internos sin rotos, pie, teclado: enlace de salto, Enter, recorrido completo con Tab (foco visible, no oculto, sin trampas), Shift+Tab hacia atrás, orden del foco                                                                                                                                                                                                                                                                                                 |
| `mobile-menu.spec.ts`       | Abrir/cerrar, Escape + foco, 8 enlaces × (cerrar y navegar), clic fuera, teclado, sección activa, **regresión**: abrir con teclado a gran profundidad no desplaza la página                                                                                                                                                                                                                                                                                                                                                                                                            |
| `preferences.spec.ts`       | Cambio de idioma, persistencia, idioma inicial por navegador, tema, persistencia, sin parpadeo, tema del sistema, valores guardados inválidos                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `links.spec.ts`             | LinkedIn/GitHub (atributos seguros), https, sin `mailto`/`tel`/descargas/formularios, **un único currículum** disponible (descarga y visualización con el mismo PDF; único enlace a archivo permitido), sin referencias a los otros tres, CTA "Descargar CV" + "Ver experiencia", traducción                                                                                                                                                                                                                                                                                           |
| `resume-pdf.spec.ts`        | **PDF real**: `dist/` idéntico a `public/` (SHA-256), HTTP 200, `application/pdf`, cabeceras/CSP, `verifyCv` sobre el archivo servido, descarga efectiva (Hero y sección, hash íntegro), pestaña nueva de «Visualizar CV», navegación a Currículum, ES/EN × claro/oscuro × escritorio/móvil sin errores de consola, CSP ni desbordamiento. El **visor** de PDF no existe en modo headless: se verificó a mano con Chromium y Firefox con ventana (el PDF se muestra con la CSP completa; Chromium solicita `/favicon.ico` en la pestaña del PDF y recibe 404, sin efecto en la página) |
| `motion.spec.ts`            | `prefers-reduced-motion`: sin scroll suave ni transiciones; movimiento normal                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `scroll-regression.spec.ts` | Clic (con y sin pulsación) y toque en contenido sin mover la página; enlaces y botones de `<main>` desplazado; enlace medio tapado; foco por teclado                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `a11y.spec.ts`              | axe + comprobaciones propias, incluido el **idioma de las partes** (WCAG 3.1.2; ver `docs/ACCESIBILIDAD.md`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `performance.spec.ts`       | CLS < 0,1, FCP < 1,8 s, LCP < 2,5 s, ≤ 8 peticiones (Chromium)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Cada prueba incluye un **monitor automático** que falla si hay: errores de JavaScript, errores de
consola, peticiones a orígenes externos, respuestas HTTP ≥ 400 del propio sitio o violaciones de CSP.

### Fase A: salto de scroll al hacer clic (2026-11-25)

**Defecto (presente en producción en el commit anterior).** Pulsar cualquier contenido de `<main>` devolvía la página
al inicio. `<main tabIndex={-1}>` recibía el foco y `useFocusNotObscured` lo «destapaba» (su borde superior es
negativo). En WebKit un clic en un enlace o botón no lo enfoca (el foco pasa a `<main>`), así que la página se movía
entre presionar y soltar y **el clic se perdía**. Un segundo camino afectaba a todos los motores: pulsar un enlace
medio tapado por la cabecera lo enfocaba y lo desplazaba antes de soltar.

**Corrección.** El hook ignora `<main>` y el foco originado por un puntero; sigue actuando con teclado y foco por
programa (WCAG 2.4.11).

**Corrige el diagnóstico de la Fase 6.** La «inestabilidad de WebKit» de las pruebas de CV **no era una limitación del
navegador ni del entorno: era este defecto**, y el reintento del clic (y el reintento de Playwright en WebKit) lo
ocultaba. Ambos se eliminaron: las pruebas usan un solo clic y `retries: 0`.

**Evidencia.** Las pruebas unitarias nuevas fallaban con el código anterior (3 del contenedor y 3 del puntero) y
`e2e/scroll-regression.spec.ts` falla en 28 casos contra el despliegue anterior. Tras la corrección, sin
reintentos: WebKit 300 de 300 (`--repeat-each=10` de regresión y PDF), Chromium y Firefox 186 de 186
(`--repeat-each=3`) y suite completa **321 listadas, 312 pasan, 9 omitidas, 0 fallan**; unitarias **388**.

**Entornos.** `e2e/environment.ts` distingue `vite preview` (SPA en rutas desconocidas) de un despliegue
(`E2E_BASE_URL=https://…`: 404 reales, canonical, sitemap y robots exigidos) y respeta `SITE_URL` si se compila y
prueba con ella.

**Limitaciones.** Todo es emulado: no se probó Safari en macOS o iOS ni dispositivos físicos.

### Fase 6: auditoría independiente y correcciones (2026-11-25)

**Resultados finales** (Windows 11, Node 24.22.1, ejecución completa en PowerShell): `npm run check`, `test:coverage`,
`verify:publication:strict`, `verify:cv`, `audit:deps` y `npm audit` con código de salida 0; unitarias 26 archivos y
**380 pruebas**; E2E **273 listadas (265 pasan, 8 omitidas, 0 fallan, 0 inestables)**; 0 vulnerabilidades.

**Inestabilidad de WebKit (M-04).** Se atribuyó entonces a WebKit y se mitigó con un reintento del clic. El
diagnóstico era **erróneo**: la causa era un defecto de la aplicación (ver «Fase A»).

**Vitest y la letra de unidad en Windows (B-05).** Reproducido: con el directorio de trabajo `c:\Proyectos\portfolio`
(unidad en **minúscula**) fallan las pruebas de componentes (los _matchers_ de `jest-dom` no se registran, «Invalid
Chai property»); con `C:\Proyectos\portfolio` pasan. El mismo Bash funciona cuando el directorio usa la unidad en
mayúscula (`cd 'C:\Proyectos\portfolio'`). No es un problema de Bash ni de la configuración del proyecto. No afecta
a GitHub Actions (Linux no tiene letras de unidad), pero **GitHub Actions no está verificado hasta ejecutar el
workflow en Linux**. No se modificó Vitest por este problema local; si se desarrolla en Windows, abrir el terminal
en la ruta con `C:` en mayúscula.

**Defectos corregidos en esta fase:** `origin` configurado en el repositorio de desarrollo (eliminado); detección de
teléfonos solo con «+» (ahora móviles y fijos chilenos, RUT sin puntos y correos ofuscados); inspector de PDF que
ignoraba estructuras no analizables (ahora informa limitaciones y falla); formatos versionables controlados solo
por lista de prohibidos (ahora lista de permitidos); `/favicon.ico` devolvía 404 (se añadió `public/favicon.ico`
generado a partir del SVG, sin tocar la CSP ni el favicon SVG).

### Defectos reales detectados en el ajuste del CV único (corregidos)

1. Una fecha mal formada en el manifiesto del CV lanzaba `RangeError` al renderizar la sección → la línea de metadatos se omite si los datos no son válidos (prueba de regresión).
2. La guardia no validaba el workflow de CI **mientras estaba sin versionar**; al versionarse marcó como "despliegue" un nombre de paso que citaba `vercel.json` → ahora ignora comentarios y nombres de pasos, e inspecciona comandos y acciones (pruebas positiva y negativa).
3. Al simular el CV habilitado, la guardia tomaba los URI de espacios de nombres XMP (`purl.org`, `ns.adobe.com`) por hosts externos → los PDF se revisan aparte (`mailto:`/`tel:`).
4. El extractor de texto no resolvía diccionarios anidados en línea (`/Resources<</Font<<…>>>>`) → extracción de diccionarios balanceada.
5. `git archive | tar` en PowerShell 5.1 corrompe el flujo binario (hallado al ensayar el procedimiento de publicación) → la guía usa `git archive -o`.

### Defectos reales detectados por las E2E en la Fase 5 (corregidos)

1. Acceso directo `/#seccion` en móvil aterrizaba ~67 px fuera de lugar: el cambio de fuente
   (`font-display: swap`) reajustaba el diseño. → `useHashScroll` realinea durante 5 s si el usuario no
   interactúa y las dos fuentes se **precargan** (mismo origen).
2. `scroll-padding-top` con cabecera _sticky_ desplazaba la página al activar el menú con teclado
   (Chromium/WebKit). → cabecera `fixed` + espaciador.
3. Firefox no desplaza al enfocar un elemento ya visible pero tapado por la cabecera (WCAG 2.4.11). →
   `useFocusNotObscured`.
4. El ajuste anterior cancelaba el desplazamiento al elegir un enlace del menú (el elemento ya estaba
   desmontado). → se ignoran elementos desconectados (con prueba de regresión).
5. Con cabecera semitransparente axe no podía calcular el contraste (resultado "incompleto"). →
   fondo opaco.

## 4. Lo que NO se prueba en esta suite (límites)

- **WebKit de Playwright no equivale a Safari real**; no se probó en macOS/iOS.
- Sin dispositivos físicos (táctil, teclados virtuales, lectores de pantalla móviles).
- **El estado "CV disponible" no se ejecuta en E2E** (no existen PDF autorizados y no se crean ficticios);
  se cubre con pruebas unitarias (enlace, `download`, idioma, fecha, rutas inválidas) y con la guardia.
- La accesibilidad automatizada no sustituye pruebas con lectores de pantalla (ver `docs/ACCESIBILIDAD.md`).
- No se comprueba que los enlaces externos respondan (terceros que bloquean automatización).
- **GitHub Actions no se ha ejecutado.** El workflow solo está validado sintácticamente (YAML) y por las
  reglas de la guardia.
- Observación de herramienta: el `click()` de Playwright, a gran profundidad y con la cabecera fija,
  puede reajustar el desplazamiento; un clic DOM no lo hace. Algunas pruebas activan el menú con teclado.

## 5. Estabilidad

Concurrencia acotada (`workers: 3` local, 2 en CI) y **ningún reintento** (`retries: 0`): una prueba inestable
se investiga, no se reintenta. Un reintento en WebKit ocultó un defecto real (ver «Fase A»).

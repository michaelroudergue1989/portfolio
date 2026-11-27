# Pruebas y calidad

Todo lo siguiente es reproducible desde el repositorio salvo lo indicado como "externo".
Resultados medidos el 2026-11-24 (Fase 5) y actualizados el 2026-11-26 (Fase C) en Windows 11, Node 24.22.1, npm 11.19.1, 20 procesadores lógicos.

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

- **28 archivos, 436 pruebas, todas pasan** (2026-11-26).
- Cobertura: **líneas 99,45 %**, sentencias 98,5 %, funciones 99,29 %, ramas 90,94 %.
  Umbrales mínimos en `vitest.config.ts`: líneas/sentencias/funciones 95 %, ramas 80 %.
  Alcance: `src/` (los scripts de `scripts/` se prueban mediante sus funciones puras, pero no se
  incluyen en el informe de cobertura).
- Áreas: componentes, secciones, datos (integridad, claves de i18n ES/EN, orden cronológico),
  navegación, hooks (sección activa, hash, foco no oculto), tema/idioma/persistencia, contraste de
  tokens (≥ 4,5:1 texto, ≥ 3:1 componentes, ≥ 5:1 insignias), currículums y guardia de publicación
  (positivas y negativas por nivel con datos **sintéticos construidos por partes**, sin términos reales: formatos de teléfono y RUT chilenos, correos ofuscados, política de formatos versionables y PDF sintéticos que fallan de forma segura), inspección de PDF (10), `verify:cv` (9), idioma de las partes (10) y verificador de rama pública (5).

### E2E (Playwright)

| Motor     | Pruebas listadas | Resultado                                                                                                                                              |
| --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Chromium  | 239              | todas pasan                                                                                                                                            |
| Firefox   | 215              | 214 pasan, 1 omitida                                                                                                                                   |
| WebKit    | 215              | 199 pasan, 16 omitidas                                                                                                                                 |
| **Total** | **669**          | **652 pasan, 17 omitidas, 0 fallan** (ejecución completa del 2026-11-26, sin reintentos). La anterior a la corrección: 570 pasan, 17 omitidas, 1 falla |

Omitidas (17) y motivo:

- Recorrido con **Tab por enlaces** en WebKit (5 en navegación, 1 en menú móvil, 1 en foco por teclado, 1 en el Hero
  móvil y 7 en la barra inferior): WebKit/Safari no enfoca enlaces con Tab por defecto (requiere Option+Tab o un ajuste
  del sistema).
- Métricas de rendimiento en Firefox y WebKit (2): se miden solo en Chromium.

Cobertura funcional de los E2E (`e2e/`):

| Archivo                     | Verifica                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `smoke.spec.ts`             | Carga inicial, título/idioma/h1, 11 secciones, fuentes, sin desbordamiento (320–1440 px), cabeceras de `vercel.json`, CSP sin `unsafe-*`, robots/sitemap sin dominio inventado, sin `.map`/`private`, sin PDF, solo claves de tema/idioma en `localStorage`, sin cookies                                                                                                                                                                                                                                                                                                               |
| `navigation.spec.ts`        | 8 enlaces × (clic + hash + `aria-current`) y 8 accesos directos por fragmento, sección activa al desplazar, enlaces internos sin rotos, pie, teclado: enlace de salto, Enter, recorrido completo con Tab (foco visible, no oculto, sin trampas), Shift+Tab hacia atrás, orden del foco                                                                                                                                                                                                                                                                                                 |
| `mobile-menu.spec.ts`       | Abrir/cerrar, Escape + foco, 9 enlaces (incluye Currículum) × (cerrar y navegar), clic fuera, teclado, sección activa, **regresión**: abrir con teclado a gran profundidad no desplaza la página                                                                                                                                                                                                                                                                                                                                                                                       |
| `preferences.spec.ts`       | Cambio de idioma, persistencia, idioma inicial por navegador, tema, persistencia, sin parpadeo, tema del sistema, valores guardados inválidos                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `links.spec.ts`             | LinkedIn/GitHub (atributos seguros), https, sin `mailto`/`tel`/descargas/formularios, **un único currículum** disponible (descarga y visualización con el mismo PDF; único enlace a archivo permitido), sin referencias a los otros tres, CTA "Descargar CV" + "Ver experiencia", traducción                                                                                                                                                                                                                                                                                           |
| `resume-pdf.spec.ts`        | **PDF real**: `dist/` idéntico a `public/` (SHA-256), HTTP 200, `application/pdf`, cabeceras/CSP, `verifyCv` sobre el archivo servido, descarga efectiva (Hero y sección, hash íntegro), pestaña nueva de «Visualizar CV», navegación a Currículum, ES/EN × claro/oscuro × escritorio/móvil sin errores de consola, CSP ni desbordamiento. El **visor** de PDF no existe en modo headless: se verificó a mano con Chromium y Firefox con ventana (el PDF se muestra con la CSP completa; Chromium solicita `/favicon.ico` en la pestaña del PDF y recibe 404, sin efecto en la página) |
| `motion.spec.ts`            | `prefers-reduced-motion` sin transiciones; con movimiento normal, el desplazamiento entre secciones también es inmediato                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| `history.spec.ts`           | Atrás y adelante (con retardos de 0 a 900 ms), botones del navegador seguidos, atrás tras pulsar un enlace y menú hamburguesa: URL, hash, `scrollY`, sección visible y activa; escritorio y móvil                                                                                                                                                                                                                                                                                                                                                                                      |
| `hero-mobile.spec.ts`       | «Descargar CV» en el primer pantallazo (320–414 px y horizontal), orden del DOM, 44 px, sin desbordamiento, escritorio y tableta sin cambios de orden, giro de pantalla, Currículum en el menú (ES/EN, claro/oscuro, sin descarga)                                                                                                                                                                                                                                                                                                                                                     |
| `bottom-nav.spec.ts`        | Barra móvil: ventanas donde aparece o no (incluidos los límites), áreas y etiquetas, Descargar CV libre, cinco accesos (ratón y toque), sección activa, hash, recarga, historial, idioma y tema, menú, teclado y foco no oculto, pie, pulsación sobre un enlace medio tapado                                                                                                                                                                                                                                                                                                           |
| `cv-privacy.spec.ts`        | La página y sus recursos no contienen correos ni `mailto:`; el CV servido es el archivo autorizado                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `tech-badges.spec.ts`       | Escala y borde con puntero fino, maquetación y desplazamiento intactos, sin recortes, movimiento reducido, toque, sin foco                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `scroll-regression.spec.ts` | Clic (con y sin pulsación) y toque en contenido sin mover la página; enlaces y botones de `<main>` desplazado; enlace medio tapado; foco por teclado                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `a11y.spec.ts`              | axe + comprobaciones propias, incluido el **idioma de las partes** (WCAG 3.1.2; ver `docs/ACCESIBILIDAD.md`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `performance.spec.ts`       | CLS < 0,1, FCP < 1,8 s, LCP < 2,5 s, ≤ 8 peticiones (Chromium)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

Cada prueba incluye un **monitor automático** que falla si hay: errores de JavaScript, errores de
consola, peticiones a orígenes externos, respuestas HTTP ≥ 400 del propio sitio o violaciones de CSP.

### Fase C: barra de accesos directos (2026-11-26; aprobada para publicación el 2026-11-27)

**Mediciones** en Chromium, Firefox y WebKit (26 ventanas × ES/EN × claro/oscuro, antes y después): barra de 58 px con
8 px de margen y 72 px reservados al final; accesos de al menos 48 px de alto; las cinco etiquetas caben a 320 px sin
abreviar; sin desbordamientos; **Descargar CV no deja de verse en ninguna ventana**; el pie queda completo por encima de
la barra. En el primer pantallazo la barra cubre en parte «Ver experiencia» (320×550/568, 360×501) o LinkedIn y GitHub
(además 360×560, 375×553): se alcanzan desplazando.

**Escritorio y tableta:** capturas de página completa idénticas byte a byte en Chromium. En Firefox y WebKit una primera
pasada dio 18 y 19 de 20; repetida sin desplazar la página antes de capturar dio 20 de 20 en ambos. La causa probable es
el resaltado de la navegación aún sin actualizar; no se demostró.

**Foco.** Antes de tocar `useFocusNotObscured` se reprodujo el defecto: en Firefox a 320×568, «Ver experiencia»
recibía el foco con 12 px bajo la barra (10 de 10 intentos). La prueba E2E correspondiente falla con el hook anterior y
pasa con el nuevo.

**Pruebas corregidas durante la fase.** La primera suite completa tuvo 2 fallos (Chromium y WebKit) en una prueba nueva
que suponía que, al cambiar de idioma, seguía arriba la misma sección. El texto se acorta, esos motores anclan en la
sección anterior (igual que en la versión sin barra) y la barra reflejaba lo correcto. La prueba compara ahora con la
sección que indica la geometría.

**Límites:** todo es emulado; sin dispositivos físicos, Safari real ni lectores de pantalla. Las consultas de altura en
navegadores móviles con barras dinámicas no se han comprobado en un teléfono.

### Correo dentro del CV y realce de etiquetas (2026-11-26; aprobados para publicación el 2026-11-27)

- El correo se retiró de la web antes de publicarse: se eliminaron 21 pruebas unitarias y 14 E2E por navegador de esa
  funcionalidad. Se añadieron 15 unitarias y 2 E2E por navegador sobre el PDF y la privacidad.
- Comprobaciones manuales del propietario con el emulador responsive de Chrome (ver ACCESIBILIDAD.md). **No hubo
  prueba en un teléfono físico.**

**Defecto de «atrás» y «adelante», corregido (2026-11-26).**

- **Síntoma:** si «adelante» llegaba mientras «atrás» aún se desplazaba, la URL quedaba en el destino nuevo y la página y
  la navegación activa en el anterior, de forma persistente.
- **Anterior a la Fase C:** reproducido en el Chromium de Playwright, en la versión entonces publicada (Fase B, sin
  barra), escritorio y móvil. No en Firefox, WebKit ni con movimiento reducido.
- **Causa:** `scroll-behavior: smooth` global en `src/styles/base.css` (desde la Fase 2): la animación en curso no se
  cancela. Una página mínima sin React lo reproducía con solo esa regla.
- **Decisión autorizada por el propietario:** eliminar el desplazamiento suave global. No se sustituyó por JavaScript. Las
  variantes que conservaban la animación se descartaron al medirlas (seguían fallando o introducían otro fallo).
- **Prueba cambiada:** `motion.spec.ts` exigía desplazamiento suave, requisito retirado; ahora exige que sea inmediato.
  La prueba que detectó el defecto no se modificó.
- **Pruebas nuevas:** `history.spec.ts`. Contra la implementación anterior fallan 15 de 27 en Chromium (15, 15 y 16 en
  tres pasadas) y la de movimiento en los tres motores; con la corrección pasan todas. La segunda orden debe lanzarse sin
  ninguna evaluación pendiente: de otro modo el defecto se manifestaba solo a veces.
- **Después:** la prueba original, 180 de 180 (60 por motor); las nuevas, 135 de 135 (5 pasadas en Chromium).
- Sin comprobar en Chrome ni Edge reales.

### Publicación de la Fase B (2026-11-26)

- Desarrollo `447478d`; público `a80cd2a`, con el mismo árbol de Git.
- GitHub Actions: **success** al primer intento. Vercel: **success**.
- Regresión en producción, sin reintentos: **398 aprobadas, 10 omitidas, 0 fallidas**.

### Fase B: Hero móvil y Currículum en el menú (2026-11-26)

- Medición con Chromium, ES y EN, claro y oscuro: «Descargar CV» queda **completo en el primer pantallazo** en
  320×568, 320×640, 360×640/740/800, 375×667/812, 390×844, 414×896, 667×375 y 844×390 (antes solo en 390×844 y
  414×896). Con alturas reducidas (320×480, 360×560, 375×553) también, en los tres motores; en 568×320 y 667×331 no.
- El gráfico central no se muestra en móvil: una variante intermedia que lo mostraba alargaba el Hero y se descartó.
  El Hero definitivo es más bajo que el original (375×667 en español: 945 → 869 px).
- Tableta (768×1024) y escritorio (1024×768, 1280×720, 1440×900): capturas de página completa **idénticas byte a
  byte** antes y después (16 de 16). En 1024×768 y 1280×720 la descarga sigue bajo el primer pantallazo, como antes.
- La primera suite completa tuvo **1 fallo** en una prueba nueva (WebKit, 320×568 en inglés): inspeccionaba el DOM
  antes de que React montara el contenido. Se corrigió esperando al contenido (sin esperas fijas ni reintentos) y la
  suite completa posterior pasó.
- Emulación: no se probó en dispositivos físicos ni en Safari real.

### Publicación de la Fase A (2026-11-26)

- Desarrollo `9f7bafa`; público `ed97d9e`, con el mismo árbol de Git.
- GitHub Actions: **success** (calidad en Node 22 y 24; E2E en los tres motores).
- Vercel: **success** (despliegue completado para `ed97d9e`).
- Regresión en producción, sin reintentos: **312 aprobadas, 9 omitidas, 0 fallidas**.

### Incidente en Firefox: foco bajo la cabecera (sin causa determinada)

- Ocurrió **una vez**, durante una suite E2E completa previa a la publicación de la Fase A (2026-11-26): 311 pasaron,
  **1 falló** y 9 se omitieron.
- Prueba: navegación hacia atrás con Shift+Tab desde el pie (`e2e/navigation.spec.ts`). El foco de «Contactar por
  LinkedIn» quedó medido bajo la cabecera.
- No se consiguió reproducir de forma sistemática (prueba aislada repetida, navegación en Firefox con el código
  nuevo y el anterior, suites completas instrumentadas).
- **No se determinó la causa** y **no está demostrado que sea independiente de la corrección**.
- Las comprobaciones posteriores fueron satisfactorias (GitHub Actions y la regresión en producción).
- El propietario **aceptó el riesgo residual** para publicar la corrección funcional. Si reaparece, se conserva la
  evidencia y se informa; no se reintenta.

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
- El visor de PDF no existe en modo headless (ver `resume-pdf.spec.ts`).
- La accesibilidad automatizada no sustituye pruebas con lectores de pantalla (ver `docs/ACCESIBILIDAD.md`).
- No se comprueba que los enlaces externos respondan (terceros que bloquean automatización).
- GitHub Actions ejecuta la misma suite en Linux; su primera comprobación registrada es la de `ed97d9e`.
- Observación de herramienta: el `click()` de Playwright, a gran profundidad y con la cabecera fija,
  puede reajustar el desplazamiento; un clic DOM no lo hace. Algunas pruebas activan el menú con teclado.

## 5. Estabilidad

Concurrencia acotada (`workers: 3` local, 2 en CI) y **ningún reintento** (`retries: 0`): una prueba inestable
se investiga, no se reintenta. Un reintento en WebKit ocultó un defecto real (ver «Fase A»).

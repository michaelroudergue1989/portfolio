# Arquitectura

## Visión general

SPA estática (sin backend) construida con Vite. Los datos profesionales son datos tipados locales; los textos visibles viven en archivos de traducción. Se despliega como sitio estático en Vercel.

## Estructura

```
src/
  components/
    ui/          Primitivas reutilizables (Button, Card, ExternalLink, Badge…)
    layout/      Header, Footer, navegación, selectores de idioma y tema
  sections/      Secciones de página (Hero, About, Experience…), compuestas de components
  data/          Datos profesionales tipados (experiencia, formación, skills…)
  hooks/         useTheme, useLanguage (persistencia), useActiveSection (scroll-spy), useHashScroll
  lib/           Utilidades sin React: storage, theme (store externo), url (validación https), cx
  types/         Tipos compartidos
  i18n/          Configuración i18next y locales/{es,en}.json
  styles/        CSS global y tokens de diseño (Tailwind)
  assets/        Imágenes procesadas por Vite
  test/          Setup de pruebas
public/          Archivos estáticos sin procesar (favicon, robots.txt)
docs/            Documentación técnica
```

Las pruebas unitarias se ubican junto al código (`*.test.tsx`); `src/test/` contiene solo la configuración común.

## Flujo de datos

`data/*.ts` (estructura, fechas, tecnologías, claves i18n) → `sections/*` (composición) → `components/*` (presentación). Los textos narrativos se resuelven con `t(clave)`; nunca se incrustan en componentes.

## Decisiones técnicas

| Decisión                                                                                           | Justificación                                                                                                  |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Vite 8 + `@vitejs/plugin-react` 6                                                                  | Versiones actuales; Node 24 cumple su requisito (`^20.19 \|\| >=22.12`).                                       |
| TypeScript fijado a `~6.0.3`                                                                       | `typescript-eslint` 8.74 declara `typescript <6.1.0`; TS 7.0 queda fuera de su rango. Reevaluar al actualizar. |
| ESLint 9.x (no 10)                                                                                 | `eslint-plugin-jsx-a11y` 6.10 solo soporta hasta ESLint 9. Ver riesgo de soporte en SEGURIDAD.md.              |
| Tailwind CSS 4 con `@tailwindcss/vite`                                                             | Sin PostCSS ni archivo de config; tokens vía CSS.                                                              |
| TS muy estricto (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`) | Detecta errores temprano.                                                                                      |
| Alias `@/` → `src/`                                                                                | Importes estables; configurado en tsconfig, Vite y Vitest.                                                     |
| Sin `baseUrl`                                                                                      | Deprecado en TS 6; `paths` con prefijo `./` basta.                                                             |
| Sin React Router                                                                                   | Sitio de una sola página con anclas; evita dependencia innecesaria.                                            |
| Sin librería de animación/UI                                                                       | CSS/Tailwind suficiente; menor superficie de dependencias.                                                     |
| i18next con recursos empaquetados                                                                  | Sin cargas de red ni detector externo; la preferencia se persistirá en Fase 4.                                 |
| Vitest `globals: true` + jsdom                                                                     | Compatible con Testing Library y tipos de jest-dom.                                                            |
| Reglas ESLint: `strictTypeChecked`, jsx-a11y, react-hooks, bloqueo de `dangerouslySetInnerHTML`    | Calidad y accesibilidad automatizadas.                                                                         |

## Decisiones de la Fase 2

- **`src/lib/`** (añadido a la estructura inicial): separa utilidades puras de los hooks de React.
- **Tema sin Provider:** `lib/theme.ts` es un store externo sobre `<html data-theme>`; `useTheme` usa `useSyncExternalStore`. Evita contexto y re-renders innecesarios.
- **Sin parpadeo de tema:** `public/theme-init.js` es un script externo bloqueante mínimo (sin inline, compatible con CSP estricta).
- **Fuentes:** WOFF2 latinas copiadas a `src/assets/fonts` con sus licencias (en lugar de paquetes `@fontsource`), para evitar dependencias y archivos de subconjuntos no usados.
- **Tokens:** CSS variables por tema + `@theme inline`; sin `tailwind.config`. Validados por `src/styles/contrast.test.ts`.
- **Navegación:** `data/navigation.ts` con bandera `available`; las secciones futuras se muestran deshabilitadas.
- **Vitest `css: true`:** necesario para leer `tokens.css?raw` en la prueba de contraste (`css: false` devuelve vacío).
- **Iconos:** lucide-react 1.x no incluye iconos de marcas (GitHub); el enlace a GitHub es solo texto.

## Decisiones de la Fase 3

- **Orden del documento y anclas:** `src/data/sections.ts` define los ids estables (`home, stats, about, areas, experience, projects, skills, education, certifications, resumes, contact`). Navegación, pie y pruebas los consumen; renombrarlos rompe URLs públicas.
- **Navegación por anclas, sin router:** `<a href="#id">` + `scroll-padding-top` global con cabecera `position: fixed` y opaca (ver Fase 5). `useActiveSection` calcula la sección activa en scroll (rAF, sin IntersectionObserver: más simple y verificable). `useHashScroll` cubre el acceso directo `/#id`, porque el contenido se monta con React.
- **Datos ↔ texto:** los datos guardan estructura (fechas, tecnologías, ids, claves); el texto vive en `locales/*.json`. Las listas de responsabilidades usan claves numeradas (`numberedKeys`). Una prueba verifica que toda clave usada por los datos exista en ES y EN.
- **Indicadores derivados:** `Stats` calcula años, empleos, horas y áreas desde los datos.
- **Fechas:** `lib/period.ts` formatea con `Intl.DateTimeFormat` según el idioma activo ("Mayo 2025" / "May 2025") y emite `<time dateTime>`.
- **Estado de publicación:** `Resume.available` (con `language` y `updatedAt` obligatorios al habilitar) controla las descargas; `profile.photo` y `Certification.credentialUrl` quedan preparados pero vacíos. Los proyectos del código son solo genéricos (ver Fase 4).
- **Sin filtros de proyectos:** con 7 tarjetas no aportan utilidad y añadirían superficie de accesibilidad.
- **Currículum fuera de la barra horizontal:** ocho entradas ya llenan 1280 px; se enlaza desde el pie y (Fase B) desde el menú móvil.
- **Títulos oficiales:** en inglés se conserva la denominación original en español con glosa entre paréntesis (sin traducción oficial confirmada).
- **Nuevos tokens:** `--background-alt` y `--area-*`; validados por `contrast.test.ts`.

## Decisiones de la Fase 4

- **Confidencialidad estructural:** los datos no autorizados no están en el repositorio. `src/data/projects.ts` contiene solo ámbitos genéricos; el modelo `ProfessionalProject` ya no tiene organización ni estado de borrador. Los borradores viven en `private/` (ignorado).
- **Un solo currículum público, en un manifiesto JSON** (`src/data/resume.json`): lo lee el código (`resume.ts`) y también el verificador de build (Node sin transpilar). `Resume` es un objeto simple (`path`, `available`, `language`, `updatedAt`, `pages`); `available` es el único interruptor de publicación. Los otros currículums (especializados) son privados y no existen en el repositorio. Para añadir más documentos en el futuro bastaría volver a una lista, pero hoy se evita esa complejidad.
- **Reglas de descarga en un solo lugar:** `lib/resume.ts` (`isDownloadable`: ruta `/cv/<nombre>.pdf`, fecha ISO y páginas válidas). Hero y la sección Currículum usan la misma regla; ante datos incompletos se muestran botones deshabilitados y "No disponible", nunca un enlace posiblemente roto.
- **CTA del Hero condicionado:** `Hero` recibe `item` (por defecto el del manifiesto): con el CV descargable muestra "Descargar CV" (principal) y "Ver experiencia" (secundario); si no, solo "Ver experiencia". LinkedIn y GitHub van en una segunda fila para no sobrecargar las acciones principales.
- **Idioma de las partes (WCAG 3.1.2):** los títulos oficiales que se conservan en español dentro de las cadenas inglesas se marcan `<es>…</es>` en `en.json` y se renderizan con `LocalizedText` (`<span lang="es">`). Una prueba exige que cada fragmento marcado sea el texto original de la misma clave en `es.json`.
- **Verificación del PDF sin dependencias:** `scripts/pdf-text.mjs` (solo `node:zlib`) extrae texto y metadatos; lo usan la guardia y `npm run verify:cv`. Es deliberadamente mínimo (fuentes con `/ToUnicode`, flujos Flate) y de **fallo seguro**: devuelve texto por página y una lista de `limitations` (objetos comprimidos, formularios XObject, filtros no admitidos, fuentes sin mapa Unicode, actualizaciones incrementales), contenido activo, destinos de enlace e imágenes; `pdfIntegrityIssues` (guardia y `verify:cv`) las trata como error, junto con las páginas con menos de 100 caracteres de texto.
- **Guardia de build:** `scripts/check-publication.mjs` (ESM sin dependencias). La lógica pura `evaluatePublication` se prueba en `src/test/publication.test.ts` (con `.d.mts` para tipos); `postbuild` la ejecuta tras cada build, también en Vercel.
- **`HeroVisual` acepta `photo`** por prop (por defecto `profile.photo`) para poder probarla sin una foto real.
- **Currículum y navegación:** la sección conserva el id `resumes` (anclas estables) y sigue fuera de la barra horizontal; se enlaza desde Contacto, el pie y el menú móvil. El Hero ofrece la descarga directa cuando el CV está autorizado.

## Decisiones de la Fase 5

- **Guardia por niveles** (`scripts/check-publication.mjs`): estructural, PDF, `dist/`, metadatos, contenido autorizado y privada (solo local). Lógica pura `evaluatePublication` probada con casos positivos y negativos (`src/test/publication.test.ts`, sin términos reales). Informa explícitamente su **limitación** cuando la lista privada no existe (CI/Vercel). Valida además los workflows de GitHub Actions.
- **Política de formatos y detección heurística (Fase 6):** la guardia admite solo una lista explícita de extensiones y binarios revisados (`REVIEWED_BINARIES`); los patrones de datos personales cubren formatos chilenos y correos ofuscados, pero siguen siendo heurísticos. `--root` y `--denylist` permiten revisar la instantánea con la lista local sin copiarla.
- **Verificador de rama pública** (`scripts/check-public-branch.mjs`, solo lectura): exige 1 commit, 1 raíz y ningún commit compartido con otras referencias. No modifica el repositorio.
- **Cabeceras de seguridad = fuente única `vercel.json`**; `vite preview` y las E2E las leen, así se prueba lo que se configura. CSP sin `unsafe-inline`/`unsafe-eval` (ver docs/SEGURIDAD.md).
- **Metadatos y SEO sin inventar dominio:** `robots.txt` siempre; `canonical`, `og:url` y `sitemap.xml` solo con la variable `SITE_URL` (plugin `siteMetadata` en `vite.config.ts`). Sin JSON-LD ni `og:image`.
- **Cabecera `fixed` y opaca + espaciador** (antes `sticky` semitransparente): evita saltos de desplazamiento al activar el menú con teclado y permite a axe calcular el contraste. `useFocusNotObscured` cubre el foco oculto en Firefox; ignora `<main>` (contenedor enfocable) y el foco dado por puntero, para no mover la página ni perder clics.
- **Fuentes precargadas** por un plugin de Vite (`fontPreload`): evita el reajuste de diseño del `font-display: swap`. `useHashScroll` realinea durante 5 s con `ResizeObserver` si el usuario no interactúa.
- **Playwright en `e2e/`** (excluido de Vitest); navegadores instalados dentro del proyecto (`PLAYWRIGHT_BROWSERS_PATH=0`, `scripts/install-browsers.mjs`). Monitor automático de errores de consola, JS, CSP, red externa y HTTP ≥ 400.
- **CI** (`.github/workflows/ci.yml`) con acciones fijadas por SHA y sin despliegue; Dependabot con exclusiones por compatibilidad. Se ejecuta en GitHub desde la publicación.
- **Cobertura** con v8 y umbrales mínimos; **Lighthouse** queda fuera del repositorio (ver docs/RENDIMIENTO.md).
- **Denominaciones genéricas** de sistemas en experiencia, proyectos y documentación; los nombres específicos viven solo en `private/`.

## Pruebas: reproducibilidad

| Verificación                                                                                                    | Reproducible desde el repo                                                                            | Herramienta    |
| --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------- |
| Formato, tipos, lint (incluye jsx-a11y), pruebas unitarias/integración, contraste de tokens, build, `npm audit` | Sí (`npm run …`)                                                                                      | Node           |
| Verificación en navegador (overflow, anclas, scroll-spy, teclado, foco, axe-core, capturas, red)                | **No**: se ejecutó con scripts temporales (Edge headless por CDP + axe-core instalado fuera del repo) | Edge, axe-core |
| Lectores de pantalla, Firefox/Safari, dispositivos reales                                                       | No realizado                                                                                          | Manual         |

Recomendación (Fase 5): incorporar `vitest-axe` y/o Playwright como dependencia de desarrollo aprobada para que la verificación en navegador sea reproducible.

## Pendiente de diseño (fases siguientes)

Tokens y tema (F2), esquema de datos y componentes de sección (F3), persistencia de idioma/tema y selectores (F4), cabeceras de seguridad y `vercel.json` (F5/F7).

## Decisiones de la Fase B

- **Orden del Hero según la pantalla:** `useMediaQuery` (`useSyncExternalStore` sobre `matchMedia`) y
  `COMPACT_HERO_QUERY` (menos de 768 px, o altura de hasta 500 px por debajo de 1024 px). En pantallas compactas las
  acciones van tras la presentación; el resto conserva el orden anterior. Se descartó `order` de CSS porque separa el
  orden visual del orden de lectura.
- **Dos listas de navegación sin duplicar datos:** `navItems` (barra horizontal) y `extendedNavItems` (añade
  Currículum; menú móvil y pie). Cada navegación calcula la sección activa sobre sus propios destinos.

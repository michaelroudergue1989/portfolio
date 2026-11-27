# Sistema de diseño

Estado: Fase 3. Los tokens viven en [src/styles/tokens.css](../src/styles/tokens.css) y se exponen a Tailwind CSS 4 mediante `@theme inline`. El tema activo se define con `data-theme="light|dark"` en `<html>`.

## Principios

- Sobrio, tecnológico y legible: sin neón, sin animaciones decorativas, sin fotografía ficticia (monograma + composición abstracta; el componente admite una foto real futura).
- Colores **semánticos** (`bg-surface`, `text-muted`, `text-area-security`), nunca valores fijos en componentes.
- Secciones alternan fondo (`default` / `alt`) para diferenciarlas sin añadir decoración.
- Movimiento mínimo y siempre desactivable (`prefers-reduced-motion`).

## Paleta

| Token                                   | Claro                 | Oscuro                |
| --------------------------------------- | --------------------- | --------------------- |
| `--background`                          | `#F8FAFC`             | `#0F172A`             |
| `--background-alt` (secciones alternas) | `#EEF2F7`             | `#131D33`             |
| `--surface`                             | `#FFFFFF`             | `#1E293B`             |
| `--surface-subtle` (hover, insignias)   | `#F1F5F9`             | `#263449`             |
| `--foreground`                          | `#0F172A`             | `#F8FAFC`             |
| `--muted` (texto secundario)            | `#475569`             | `#A3B1C6`             |
| `--border` (decorativo)                 | `#CBD5E1`             | `#334155`             |
| `--border-strong` (límite de controles) | `#64748B`             | `#8393AB`             |
| `--primary` / `--primary-hover`         | `#1D4ED8` / `#1E40AF` | `#60A5FA` / `#93C5FD` |
| `--on-primary`                          | `#FFFFFF`             | `#0F172A`             |
| `--primary-soft`                        | `#DBEAFE`             | `#172A47`             |
| `--accent` / `--accent-soft`            | `#0B6B63` / `#D5F5EF` | `#2DD4BF` / `#103F3C` |
| `--ring` (foco)                         | `#1D4ED8`             | `#60A5FA`             |

### Identidad cromática de las áreas

| Área                             | Color         | Claro (texto / fondo suave) | Oscuro (texto / fondo suave) |
| -------------------------------- | ------------- | --------------------------- | ---------------------------- |
| Ingeniería de Software           | Azul          | `#1D4ED8` / `#DBEAFE`       | `#60A5FA` / `#172A47`        |
| Liderazgo Técnico y Proyectos TI | Verde azulado | `#0B6B63` / `#D5F5EF`       | `#2DD4BF` / `#103F3C`        |
| Ciberseguridad                   | Violeta       | `#6D28D9` / `#EDE9FE`       | `#A78BFA` / `#2A1F55`        |

Tokens `--area-software`, `--area-leadership`, `--area-security` (+ `-soft`), usados vía `areaTone` ([areaStyles.ts](../src/components/ui/areaStyles.ts)). El color nunca es el único portador de significado: cada área lleva icono y título.

### Ajustes respecto a la propuesta inicial

- Se mantuvieron fondo, superficie, primario y texto. **Acento claro** pasó de `#0F766E` a `#0B6B63` (y su fondo suave a `#D5F5EF`) para subir el margen de contraste de insignias a ≥ 5,5:1.
- **`--primary-soft` oscuro** pasó de `#1E3A5F` a `#172A47`: el par primario/insignia subió de 4,52:1 a 5,66:1.
- `--muted` oscuro `#A3B1C6`, `--surface-subtle` oscuro `#263449` y `--border-strong` oscuro `#8393AB` (Fase 2) para cumplir contraste.
- Nuevo `--background-alt` y los seis tokens de área.

### Contraste medido (tokens)

Valores calculados por el mismo algoritmo de `src/styles/contrast.test.ts`, que falla si un par cae bajo el mínimo (4,5 texto; 3 componentes/foco; 5 en insignias).

| Par                                     | Claro       | Oscuro      |
| --------------------------------------- | ----------- | ----------- |
| foreground / background                 | 17,06       | 17,06       |
| foreground / surface                    | 17,85       | 13,98       |
| muted / background                      | 7,24        | 8,21        |
| muted / surface                         | 7,58        | 6,73        |
| muted / surface-subtle                  | 6,92        | 5,79        |
| muted / background-alt                  | 6,74        | 7,72        |
| primary / background                    | 6,41        | 7,02        |
| primary / surface                       | 6,70        | 5,75        |
| primary / primary-soft                  | 5,49        | 5,66        |
| primary / background-alt                | 5,96        | 6,60        |
| accent / background                     | 6,09        | 9,59        |
| accent / surface                        | 6,37        | 7,86        |
| accent / accent-soft                    | 5,50        | 6,27        |
| accent / background-alt                 | 5,66        | 9,02        |
| on-primary / primary                    | 6,70        | 7,02        |
| border-strong / background              | 4,55        | 5,72        |
| border-strong / surface                 | 4,76        | 4,69        |
| ring / background, surface              | 6,41 / 6,70 | 7,02 / 5,75 |
| area-software / fondo suave             | 5,49        | 5,66        |
| area-leadership / fondo suave           | 5,50        | 6,27        |
| area-security / fondo suave             | 5,98        | 5,41        |
| área (todas) / background, alt, surface | 5,38 – 9,59 | 5,38 – 9,59 |

Margen mínimo de texto: 5,38:1 (`area-security` sobre `surface` en oscuro). Cualquier cambio de paleta debe pasar `npm test`.

## Tipografía

- **Inter** (variable) para texto; **JetBrains Mono** (variable) para elementos técnicos (etiquetas, tecnologías, cifras, fechas).
- Autoalojadas en [src/assets/fonts/](../src/assets/fonts/), subconjunto latino WOFF2 (48 kB + 40 kB), `font-display: swap`. Sin CDN ni peticiones externas.
- Licencia SIL OFL 1.1: `Inter-LICENSE.txt` y `JetBrainsMono-LICENSE.txt` en el mismo directorio.
- Jerarquía: H1 `4xl→6xl`; lead del Hero `xl→2xl`; H2 `3xl→4xl`; H3 `lg–xl`; H4 etiquetas `xs` en mayúsculas.

## Tokens

| Categoría            | Token / valor                                                                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Color                | Tablas anteriores (`--color-*` en Tailwind)                                                                                                                                                    |
| Tipografía           | `--font-sans`, `--font-mono`                                                                                                                                                                   |
| Espaciado            | Escala de Tailwind (4 px) + `--spacing-section: clamp(4rem, 8vw, 7rem)` (`py-section`)                                                                                                         |
| Bordes               | 1 px; `--border` decorativo, `--border-strong` para controles                                                                                                                                  |
| Radios               | `sm 6px`, `md 8px`, `lg 12px`, `xl 16px`, `2xl 24px`                                                                                                                                           |
| Sombras              | `--shadow-card`, `--shadow-raised` (por tema)                                                                                                                                                  |
| Estados interactivos | hover: `primary-hover` / `surface-subtle`; activo en navegación: `primary-soft` + `aria-current`                                                                                               |
| Breakpoints          | `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536` px                                                                                                                                        |
| Transiciones         | `--duration-fast 150ms`, `--duration-base 250ms`, `--ease-standard`; utilidad `transition-interactive`                                                                                         |
| Foco                 | `--focus-ring-width 3px`, `--focus-ring-offset 2px`, color `--ring`; `:focus-visible` global                                                                                                   |
| Desplazamiento       | `html { scroll-padding-top: header + 1rem }`; cabecera `position: fixed` y opaca + espaciador; `useFocusNotObscured` para Firefox (anclas, `scrollIntoView` y foco no quedan bajo la cabecera) |
| Layout               | `--header-height 4rem`, contenedor `max-w-6xl`, gutter 16/24/32 px                                                                                                                             |

## Componentes

| Componente                                                                                                                           | Notas                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Button` (+ `buttonStyles`)                                                                                                          | primary/secondary/ghost, md/lg; objetivo ≥ 44 px; deshabilitado con opacidad 60 %                                                                                                         |
| `Card`, `Badge` (variantes neutral/primary/accent + 3 áreas; `tech` realza tecnologías al pasar el puntero), `Container`, `Monogram` | Primitivas                                                                                                                                                                                |
| `Section` (`tone="default\|alt"`), `SectionHeading`                                                                                  | `<section aria-labelledby>`; h2 + eyebrow + descripción                                                                                                                                   |
| `ExternalLink`                                                                                                                       | Solo `https:` sin credenciales; `rel="noopener noreferrer"`; aviso de pestaña nueva para lectores de pantalla                                                                             |
| `ThemeToggle`, `LanguageSelector`, `MobileMenu`, `DesktopNav`, `NavLinks`                                                            | Navegación con `aria-current="location"` en la sección activa                                                                                                                             |
| `Header`, `Footer`, `Layout`                                                                                                         | Skip link; pie con resumen de áreas, navegación rápida y perfiles                                                                                                                         |
| `BottomNav`                                                                                                                          | Barra flotante móvil: cinco accesos con icono y etiqueta, borde redondeado, activo con `primary-soft`; 58 px de alto                                                                      |
| `HeroVisual`                                                                                                                         | Trama de puntos + tres arcos (azul/verde azulado/violeta); muestra `profile.photo` si existe, si no el monograma. Solo desde `lg`: en pantallas menores queda el monograma de la cabecera |

### Secciones

| Sección         | Id               | Presentación                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero            | `home`           | Lead (grande) → descripción (media) → formación (con filete) → ubicación → CTAs. En pantallas compactas (< 768 px o móvil en horizontal): lead → CTAs → perfiles → descripción → formación → ubicación (sin gráfico central), con menos margen superior y lead `lg`. CTA principal: "Ver experiencia" mientras no haya CV autorizado; con CV disponible: "Descargar CV" (principal) + "Ver experiencia" (secundario). LinkedIn y GitHub siempre, en una segunda fila de botones menores |
| Indicadores     | `stats`          | 4 cifras derivadas de los datos (9+, 4, 366, 3); sin contadores animados                                                                                                                                                                                                                                                                                                                                                                                                                |
| Sobre mí        | `about`          | Texto en primera persona + ficha de datos (`dl`)                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Áreas           | `areas`          | 3 tarjetas con franja y color de área; experiencia vs. formación separadas                                                                                                                                                                                                                                                                                                                                                                                                              |
| Experiencia     | `experience`     | Línea de tiempo vertical, orden cronológico inverso, responsive                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Proyectos       | `projects`       | 7 ámbitos de trabajo genéricos (franja de color por área), nota de confidencialidad, sin botones de código/demo                                                                                                                                                                                                                                                                                                                                                                         |
| Habilidades     | `skills`         | Principales por nivel (sin barras) + 5 categorías; icono de birrete = respaldo en formación                                                                                                                                                                                                                                                                                                                                                                                             |
| Formación       | `education`      | 3 tarjetas (año, institución, horas, estado)                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Certificaciones | `certifications` | Certificación profesional separada de cursos                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Currículum      | `resumes`        | **Una sola tarjeta** destacada (borde primario, icono grande): nombre, título, cuatro áreas como insignias, y "PDF · idioma · páginas · actualización". Acciones "Descargar CV" y "Visualizar CV". Habilitadas: dos enlaces al mismo PDF. Si el manifiesto no es válido: ambos botones deshabilitados + nota «No disponible», sin enlaces                                                                                                                                               |
| Contacto        | `contact`        | Dos tarjetas: "Áreas de interés" (5, con icono) y "Contacto directo" (LinkedIn como botón primario, GitHub secundario, ubicación, enlace a Currículum). Sin correo/teléfono/formulario                                                                                                                                                                                                                                                                                                  |

## Navegación

- Ocho entradas (Inicio … Contacto), todas funcionales mediante anclas estables (`src/data/sections.ts`).
- **Sección activa:** `useActiveSection` (scroll + `getBoundingClientRect`) → `aria-current="location"` y estilo. Áreas y Indicadores pertenecen visualmente a Inicio/Sobre mí.
- **Acceso directo** (`/#experience`): `useHashScroll` desplaza tras montar la página.
- **Menú móvil:** nueve entradas (las ocho más Currículum, que lleva a `#resumes` sin descargar); se cierra al elegir sección, con Escape, clic fuera o al salir el foco.
- Barra horizontal desde `xl` (1280 px). **Currículum** no está en la barra (no cabría); se enlaza desde el menú móvil y el pie.
- **Barra inferior (móvil):** Inicio, Experiencia, Proyectos, CV (`#resumes`, sin descargar) y Contacto. Complementa al menú; en secciones sin acceso no marca ninguno. Visibilidad en ARQUITECTURA.md (Fase C).
- Desplazamiento entre secciones inmediato (sin animación). `prefers-reduced-motion`: sin transiciones.

## Criterios de accesibilidad (objetivo WCAG 2.2 AA)

- HTML semántico; un `h1`; jerarquía sin saltos (verificada por prueba automática); listas reales; `dl` para fichas; `<time>` con ISO en la experiencia.
- Skip link; foco visible 3 px; foco no oculto bajo la cabecera (`scroll-padding-top` + `useFocusNotObscured`; ver docs/ACCESIBILIDAD.md).
- Objetivos táctiles ≥ 40–44 px (2.5.8); nombre accesible contiene el texto visible (2.5.3).
- Contraste verificado en cada ejecución de pruebas.
- Iconos decorativos con `aria-hidden`; significado no transmitido solo por color.

## Restricciones y pendientes

- Verificado automáticamente (axe-core, pruebas) y en Edge; **no** se declara cumplimiento WCAG 2.2 AA (faltan lectores de pantalla, Safari real, dispositivos reales y zoom real).
- Foto profesional: `profile.photo` está comentado; añadir solo una foto real y autorizada.
- No se usan logos institucionales (pendiente de revisar condiciones de uso).

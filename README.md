# Portafolio profesional — Michael Roudergue Inostroza

Sitio personal de Ingeniería de Software, Liderazgo Técnico y Ciberseguridad.
**Estado:** publicado en https://michaelroudergue.vercel.app/. Fases A y B publicadas; Fase C (barra de accesos directos en móvil, realce de etiquetas de tecnologías, correo solo dentro del CV y desplazamiento inmediato) aprobada para publicación el 2026-11-27 (ver [docs/PLAN_IMPLEMENTACION.md](docs/PLAN_IMPLEMENTACION.md)).

> **Publicación:** el historial del repositorio de desarrollo contiene información que no debe publicarse; este repositorio de desarrollo **no tiene remotos** y el público se actualiza solo con instantáneas saneadas. Seguir [docs/PUBLICACION.md](docs/PUBLICACION.md). Antes de cada instantánea es obligatorio `npm run verify:publication:strict` (el éxito de CI no lo sustituye).

## Stack

React 19 · TypeScript (estricto) · Vite 8 · Tailwind CSS 4 · Lucide React · i18next · Vitest + Testing Library · Playwright + axe-core · ESLint · Prettier.

## Requisitos

Node.js >= 22.12 (probado con 24.22.1) y npm.

## Scripts

| Comando                                  | Descripción                                                                              |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `npm ci` / `npm install`                 | Instala dependencias (reproducible / con actualización)                                  |
| `npm run dev`                            | Servidor de desarrollo                                                                   |
| `npm run build`                          | Typecheck + build en `dist/` + guardia de publicación (`postbuild`)                      |
| `npm run preview`                        | Sirve el build con las cabeceras de `vercel.json`                                        |
| `npm run check`                          | Formato + tipos + lint + pruebas + build                                                 |
| `npm run lint` · `typecheck`             | ESLint (accesibilidad y seguridad) · tipos                                               |
| `npm test` · `npm run test:coverage`     | Pruebas unitarias · con cobertura y umbrales                                             |
| `npm run e2e:install`                    | Descarga Chromium, Firefox y WebKit dentro del proyecto (una vez)                        |
| `npm run test:e2e`                       | Compila y ejecuta E2E + accesibilidad (Playwright, tres motores)                         |
| `npm run verify:publication`             | Guardia de publicación sobre `dist/` (`:strict` exige la lista privada local)            |
| `npm run verify:public-branch -- <rama>` | Verifica que la futura rama pública no comparte historial con otras referencias          |
| `npm run verify:cv -- <ruta.pdf>`        | Verifica un PDF de CV antes de publicarlo (texto extraíble, datos personales, metadatos) |
| `npm run format:check` · `audit:deps`    | Prettier · `npm audit` de producción                                                     |

## Documentación

- [docs/REQUERIMIENTOS.md](docs/REQUERIMIENTOS.md) · [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) · [docs/PLAN_IMPLEMENTACION.md](docs/PLAN_IMPLEMENTACION.md) · [docs/SISTEMA_DISENO.md](docs/SISTEMA_DISENO.md)
- [docs/PUBLICACION.md](docs/PUBLICACION.md) — qué se puede publicar, procedimiento de publicación saneada (`git archive` + repositorio nuevo), incorporación del CV y checklists
- [docs/SEGURIDAD.md](docs/SEGURIDAD.md) — cabeceras, CSP, revisión del código, cadena de suministro
- [docs/PRUEBAS.md](docs/PRUEBAS.md) — pruebas unitarias, E2E, cobertura y límites
- [docs/ACCESIBILIDAD.md](docs/ACCESIBILIDAD.md) — evidencia por criterio WCAG 2.2 (sin declarar cumplimiento)
- [docs/RENDIMIENTO.md](docs/RENDIMIENTO.md) — Lighthouse y tamaños de build
- [AGENTS.md](AGENTS.md) — guía para agentes de IA

## Privacidad

El repositorio es público. No contiene credenciales, documentos privados ni información pendiente de autorización (ver PUBLICACION.md).

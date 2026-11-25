# AGENTS.md

Guía para agentes de IA que trabajen en este repositorio.

## Proyecto

Portafolio profesional estático (SPA) de Michael Roudergue Inostroza. Sin backend. Despliegue en Vercel (Hobby). Repositorio **público**.

## Comandos

- `npm run dev` · `npm run build` · `npm run lint` · `npm run typecheck` · `npm test` · `npm run format:check`
- Antes de dar una tarea por terminada, ejecutar lint, typecheck, test y build, e informar resultados reales.

## Reglas

- TypeScript estricto; sin `any`. Alias `@/` apunta a `src/`.
- Datos profesionales en `src/data/`; textos traducibles en `src/i18n/locales/{es,en}.json`. Los componentes no contienen datos ni textos fijos.
- Estilos: usar solo tokens semánticos (`bg-surface`, `text-muted`…); no colores fijos. Ver `docs/SISTEMA_DISENO.md`. Cambios de paleta deben pasar `src/styles/contrast.test.ts`.
- Fuentes autoalojadas; no usar CDN ni recursos externos.
- Prohibido `dangerouslySetInnerHTML` (lo bloquea ESLint).
- Todo enlace externo debe pasar por un componente validado (`https:` únicamente, `rel="noopener noreferrer"`).
- Sin analítica, rastreadores, CDN de terceros ni dependencias nuevas sin aprobación.
- **No inventar** cargos, logros, cifras, certificaciones, fechas, proyectos ni enlaces. Usar solo lo documentado en `docs/REQUERIMIENTOS.md`.
- **Un solo CV público** (el CV Maestro). Los otros tres currículums son privados: no versionarlos. El CV autorizado está habilitado: `src/data/resume.json` (`available`, `language`, `updatedAt`, `pages`) y `public/cv/michael-roudergue-cv.pdf` (único PDF versionable). Cualquier PDF nuevo requiere autorización expresa y pasar `npm run verify:cv` (solo permite el enlace a perfiles autorizados). No publicar correo ni teléfono. Candidato y herramientas viven en `private/cv-candidato/`.
- **Confidencialidad:** el repositorio es público. No añadir proyectos con nombre ni datos de terceros al código, locales, tests ni docs: ocultar con una condición de React no protege nada. Los borradores viven en `private/` (ignorado). `npm run build` ejecuta `scripts/check-publication.mjs` y falla si algo no autorizado llegaría a `dist/`. Ver `docs/PUBLICACION.md`.
- **Denominaciones genéricas:** hasta autorización expresa, no escribir nombres específicos de sistemas ni proyectos (código, locales, pruebas, docs, commits). Usar denominaciones profesionales genéricas. No copiar la lista privada (private/denylist.txt) a ningún archivo versionado.
- **No hacer push.** El historial local contiene commits anteriores con información pendiente de autorización: ver docs/PUBLICACION.md (instantánea saneada con `git archive`; no basta `git switch --orphan`) y `npm run verify:public-branch`. `push.default` local es `nothing` y este repositorio de desarrollo **no tiene remotos** (no añadir `origin` aquí; el remoto se configura solo en el repositorio de publicación `C:\Proyectos\portfolio-public`). Prohibido git push --all/--mirror/--tags/--force. Antes de generar la instantánea es obligatorio `npm run verify:publication:strict`; el éxito de CI no lo sustituye.
- **CSP y cabeceras** en `vercel.json` (única fuente). Sin scripts ni estilos en línea, sin unsafe-*, sin recursos de terceros. Cambios de cabeceras: ejecutar `npm run test:e2e`.
- **Accesibilidad:** no afirmar cumplimiento de WCAG 2.2 AA; ver docs/ACCESIBILIDAD.md (el hallazgo 3.1.2 está corregido y probado; siguen pendientes lectores de pantalla, zoom real y dispositivos reales).
- **Archivos versionables:** la guardia aplica una lista de permitidos (formatos y rutas); un binario nuevo requiere revisión expresa del propietario y alta en `REVIEWED_BINARIES`. La detección de datos personales es heurística: no garantiza detectar todo.
- **E2E:** `npm run test:e2e` (navegadores en `node_modules`). No añadir una segunda herramienta de accesibilidad.
- Ids de sección estables en `src/data/sections.ts`; la navegación se basa en anclas (sin router). Al añadir una sección, añadir su id, enlace, textos ES/EN y pruebas.
- Títulos y nombres oficiales (programas, instituciones, certificaciones) no se traducen: en inglés se conserva el original con glosa entre paréntesis. Esos fragmentos en español se marcan con <es>…</es> en en.json y se muestran con LocalizedText (lang="es", WCAG 3.1.2).
- Nunca incluir credenciales, `.env`, datos de terceros ni código/capturas institucionales.
- Accesibilidad objetivo WCAG 2.2 AA; no afirmar cumplimiento sin pruebas.
- No hacer commit, push ni despliegue sin instrucción explícita.
- Trabajar por fases (ver `docs/PLAN_IMPLEMENTACION.md`); no avanzar de fase sin autorización.

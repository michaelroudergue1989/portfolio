# Plan de implementación

| Fase | Contenido                                                                                                                                                      | Estado                                                         |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 1    | Análisis, arquitectura e inicialización                                                                                                                        | Completada y confirmada (commit `d332092`)                     |
| 2    | Sistema de diseño: tokens, tipografía, temas, layout base, componentes UI                                                                                      | Completada y confirmada (commit `a70a183`)                     |
| 3    | Secciones: Hero, Sobre mí, Áreas, Experiencia, Proyectos, Skills, Formación, Certificaciones, CV, Contacto                                                     | Completada y confirmada (commit `f886680`)                     |
| 4    | Funcionalidades profesionales: CV principal y CTA, contacto para reclutadores, protección de contenido no autorizado, docs de publicación                      | Completada y confirmada (commit `647a292`)                     |
| 5    | Calidad, seguridad, accesibilidad, rendimiento y preparación para publicación (E2E, axe, CSP, Lighthouse, CI, procedimiento de publicación saneada)            | Completada y confirmada (commit `6b69601`)                     |
| 5.1  | Un solo CV público (CV Maestro), PDF autorizado habilitado, `verify:cv`, corrección WCAG 3.1.2, pruebas con el PDF real                                        | Completada y confirmada (commit `ae85c7f`)                     |
| 6    | Auditoría independiente (2026-11-25) y correcciones finales: `origin` eliminado, guardia (datos personales, PDF, política de formatos), favicon, documentación | Completada y confirmada (commit `ba1b5d3`)                     |
| 7    | Publicación en GitHub, despliegue en Vercel y auditoría de producción (commit público `db9c2ed`)                                                               | Completada                                                     |
| A    | Corrección del salto de scroll al hacer clic y de los clics perdidos en WebKit; pruebas de regresión                                                           | Implementada localmente; **pendiente de commit y publicación** |

Cada fase requiere autorización explícita antes de iniciarse. Commits, push y despliegue solo bajo instrucción del propietario.

## Adelantado en la Fase 3 respecto al plan original

- i18n ES/EN completo de todo el contenido, tema claro/oscuro y persistencia (planificados para Fase 4) ya existen desde la Fase 2 y se ampliaron en la 3. La Fase 4 se redefinió (ver abajo).
- Primera pasada de accesibilidad automatizada (axe-core) y verificación en Edge; la Fase 5 sigue pendiente (lectores de pantalla, otros navegadores, dispositivos reales).

## Fase 4 (resumen)

Currículum principal (CV Maestro; en la Fase 5.1 se simplificó a un **único** CV público: los demás son privados y no están en la interfaz), manifiesto de CV, CTA condicionado del Hero, contacto orientado a oportunidades, presentación genérica de proyectos, guardia de publicación en el build y `docs/PUBLICACION.md`. **Bloqueante antes de cualquier push:** el historial local contiene datos de proyectos con nombre (ver PUBLICACION.md).

## Pendientes que dependen del propietario

Ver [REQUERIMIENTOS.md](REQUERIMIENTOS.md#contenido-pendiente-de-autorización): proyectos (publicación), CV, fotografía, correo/teléfono, logos, enlaces de credenciales.

## Criterios de salida por fase

- `npm run lint`, `typecheck`, `test` y `build` sin errores.
- Documentación actualizada.
- Informe con resultados reales.

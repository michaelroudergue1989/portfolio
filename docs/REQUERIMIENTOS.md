# Requerimientos

## Objetivo

Portafolio profesional moderno, rápido, accesible, seguro y responsive para reclutadores y empresas tecnológicas. Representa tres líneas: (1) Ingeniería de Software y Full Stack, (2) Liderazgo Técnico y Gestión de Proyectos TI, (3) Ciberseguridad y Seguridad de la Información.

## Requerimientos funcionales

| ID    | Requerimiento                                                      |
| ----- | ------------------------------------------------------------------ |
| RF-01 | Inicio / presentación profesional                                  |
| RF-02 | Sección Sobre mí                                                   |
| RF-03 | Tres áreas de especialización (tarjetas)                           |
| RF-04 | Experiencia laboral en línea de tiempo                             |
| RF-05 | Proyectos profesionales (sin datos institucionales sensibles)      |
| RF-06 | Competencias y tecnologías (sin porcentajes; niveles cualitativos) |
| RF-07 | Formación académica                                                |
| RF-08 | Certificaciones y cursos                                           |
| RF-09 | Descarga y visualización del CV público (habilitadas, 2026-11-25)  |
| RF-10 | Contacto, GitHub y LinkedIn                                        |
| RF-11 | Selector de idioma ES/EN                                           |
| RF-12 | Selector de tema claro/oscuro                                      |
| RF-13 | Navegación responsive                                              |
| RF-14 | Persistencia de idioma y tema                                      |

## Requerimientos no funcionales

- **Accesibilidad:** objetivo WCAG 2.2 AA (HTML semántico, teclado, foco visible, contraste, `prefers-reduced-motion`, `lang` correcto). No se declarará cumplimiento sin pruebas.
- **SEO:** metadatos, Open Graph, favicon; robots.txt y sitemap cuando se conozca la URL definitiva.
- **Rendimiento:** sin dependencias innecesarias, animaciones discretas.
- **Seguridad/privacidad:** ver [SEGURIDAD.md](SEGURIDAD.md).
- **Mantenibilidad:** TypeScript estricto, datos separados de componentes, pruebas automatizadas.

## Datos profesionales base (fuente única de verdad)

**Titular:** Michael Rodrigo Roudergue Inostroza — Ingeniero en Informática, Región de La Araucanía, Chile. Más de 9 años de experiencia en desarrollo de software, análisis de requerimientos, mantenimiento de sistemas institucionales, coordinación técnica, aseguramiento de calidad y seguridad de software.

### Experiencia

| Organización                                 | Cargo                                      | Periodo               | Tecnologías / foco                                                                                                                                                                                                                                   |
| -------------------------------------------- | ------------------------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Universidad Católica de Temuco               | Analista / Desarrollador de Software       | May 2025 – Actualidad | Coordinación técnica, sistema institucional de gestión de consentimientos; React, NestJS, Prisma, PostgreSQL, Docker, MinIO, PHP, ExtJS, SQL Server, n8n, SonarQube                                                                                  |
| Universidad de La Frontera                   | Desarrollador de Software y Coord. Técnica | Ago 2021 – Dic 2024   | Sistemas institucionales, plataforma institucional de vinculación con el medio, educación continua, vinculación con el medio, desarrollo estudiantil, internacionalización; PHP, Yii2, JavaScript, jQuery, Bootstrap, Sybase, MySQL, Carbone.io, Git |
| Lazos S.A. – Servicio de Salud Araucanía Sur | Ingeniero de Desarrollo de Software        | Ago 2017 – Jul 2021   | Abastecimiento, inventario, mantención vehicular, contratos; PHP, CodeIgniter 3, Laravel, JavaScript, MySQL, SQL Server, PostgreSQL, Oracle, GitLab, Moodle                                                                                          |
| C-Ram Ingeniería                             | Webmaster / Desarrollador Web              | Jun 2016 – Jul 2017   | Plataforma PrestaShop, integración Webpay Plus                                                                                                                                                                                                       |

### Formación

- Diploma de Postítulo en Ciberseguridad — Universidad de Chile, 216 h, 2026.
- Diplomado en Gestión y Dirección de Proyectos TI — Duoc UC, 150 h, 2022.
- Ingeniería en Informática — INACAP, 2009–2016.

### Certificaciones y cursos

- ISO/IEC 27001 Lead Implementer (curso Udemy), 11 h, 2026.
- Aplicación Norma ISO 9001:2015 — UCT, 22 h, 2025.
- Gestión de Proyectos con Metodologías Ágiles — SENCE / Fundación Telefónica, 40 h, 2024.
- Liderazgo — Santander Open Academy, 8 h, 2024.
- Scrum Foundation Professional Certification — CertiProf, 2023.
- Introducción a la Inteligencia Artificial — BiblioRedes, 2023.
- Ley de Protección de Datos 21.719 — OTEC WorkForce.
- Normas y Procedimientos de Protección de Datos Personales — OTEC WorkForce.

### Habilidades (autoevaluación profesional)

Avanzado: Full-stack, PHP, JavaScript, Tech Lead. Intermedio: React, NestJS, Project Management, Scrum, Cybersecurity, Information Security.

## Contenido de la Fase 3 (fuente: instrucciones del propietario)

- **Indicadores:** 9+ años, 4 experiencias laborales, 366 horas de formación (216 del Postítulo + 150 del Diplomado), 3 áreas. Se calculan desde los datos; no se añaden otros indicadores.
- **Experiencia:** responsabilidades y tecnologías por cargo tal como las entregó el propietario (UCT incluye TypeScript y GitLab; UFRO, Dirección de Vinculación con el Medio; Lazos incluye Git; C-Ram: PrestaShop y Webpay Plus). Sin métricas de impacto.
- **Proyectos:** presentación genérica de 7 ámbitos de trabajo, por competencia, sin nombres de proyectos ni de organizaciones (ver [PUBLICACION.md](PUBLICACION.md)). Tecnologías solo cuando están confirmadas.
- **Habilidades:** niveles de autoevaluación (Get on Board) solo para las diez principales; el resto, sin nivel. Competencias de ciberseguridad respaldadas por formación están marcadas.
- **Certificaciones:** SFPC (CertiProf) es la única certificación profesional; las demás son cursos. El curso Udemy de ISO/IEC 27001 no es una certificación acreditada.
- **Currículum profesional:** un único documento público (el CV Maestro), presentado en una tarjeta con nombre, título, áreas, formato PDF, idioma, número de páginas y fecha de actualización, con las acciones "Descargar CV" y "Visualizar CV" (pestaña nueva segura). Los otros currículums (jefatura de proyectos, desarrollo, ciberseguridad) son privados y no se publican. El PDF fue autorizado el 2026-11-25 y las acciones están habilitadas; si el manifiesto deja de estar disponible o es inválido, se muestran deshabilitadas y el CTA "Descargar CV" del Hero desaparece.
- **Contacto:** orientado a oportunidades laborales (desarrollo de software, liderazgo técnico, gestión de proyectos TI, ciberseguridad, seguridad de la información). LinkedIn `https://www.linkedin.com/in/michael-roudergue-a69035150` y GitHub `https://github.com/michaelroudergue1989`; ubicación Región de La Araucanía, Chile. Sin correo, teléfono ni formularios.
- **Títulos y nombres oficiales** se conservan en español; en inglés se añade una glosa entre paréntesis cuando corresponde.

## Contenido pendiente de autorización

| Elemento                                         | Estado                                                                                                                                        |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Proyectos con nombre (trabajo para terceros)     | Fuera del repositorio (`private/`); ver PUBLICACION.md                                                                                        |
| Archivos de los 4 CV                             | No disponibles; no se publican hasta autorización                                                                                             |
| Fotografía profesional                           | No existe; `profile.photo` comentado                                                                                                          |
| Correo electrónico y teléfono                    | No se publican en la web. El propietario autorizó (2026-11-26) un único correo profesional, solo como texto dentro del CV público descargable |
| Logos institucionales                            | No se usan (revisar condiciones)                                                                                                              |
| Enlaces públicos verificables de certificaciones | No existen; `credentialUrl` previsto en el modelo                                                                                             |
| Capturas, repositorios y demos de proyectos      | No existen ni están autorizados                                                                                                               |

## Restricciones de contenido

No inventar cargos, logros cuantitativos, certificaciones, fechas, proyectos ni enlaces. Los proyectos mostrados deben ser autorizados y sin datos de terceros ni código institucional.

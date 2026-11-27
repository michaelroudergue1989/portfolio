# Accesibilidad

**Objetivo:** WCAG 2.2 nivel AA. **No se declara cumplimiento.** Cero violaciones de axe no demuestra
cumplimiento: las herramientas automáticas cubren solo una parte de los criterios. Este documento
distingue lo **aprobado con evidencia**, lo **incompleto**, lo **fallido** y lo **no verificado**.

Evidencia medida el 2026-11-24 y revalidada el 2026-11-25 (Playwright 1.65.1 + axe-core 4.14.1, Chromium; Windows 11).
Reproducible con `npm run test:e2e` (archivo `e2e/a11y.spec.ts`, 24 pruebas, todas pasan).

## 1. Resultados automatizados

### axe-core (reglas WCAG 2.0/2.1/2.2 A y AA + buenas prácticas)

| Matriz                                                    | Estados | Violaciones | Incompletos |
| --------------------------------------------------------- | ------- | ----------- | ----------- |
| Tema claro/oscuro × escritorio (1440)/móvil (375) × ES/EN | 8       | **0**       | **0**       |
| Menú móvil abierto × claro/oscuro × ES/EN                 | 4       | **0**       | **0**       |
| Reflujo equivalente a 200 % (720 px) y 400 % (320 px)     | 2       | **0**       | no exigido  |

Historial de hallazgos de axe y su resolución: en la Fase 2 axe detectó un fallo real de WCAG 2.5.3
(etiqueta accesible sin el texto visible; corregido). Las auditorías de contraste "incompletas" con el
menú abierto se debían a la cabecera semitransparente; se resolvió con fondo opaco y ahora la prueba
**exige** cero incompletos.

### Comprobaciones propias (E2E)

| Comprobación                                                                                                                                                                                                            | Resultado                                                                    |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Jerarquía de encabezados: un `h1`, sin saltos de nivel (ES y EN)                                                                                                                                                        | Aprobada                                                                     |
| Landmarks: un `main`; los `nav` tienen nombres únicos; sin IDs duplicados; botones con nombre                                                                                                                           | Aprobada                                                                     |
| Tamaño de objetivo ≥ 24 × 24 px en todos los controles visibles (WCAG 2.5.8)                                                                                                                                            | Aprobada                                                                     |
| Controles de la cabecera en móvil ≥ 36 px de alto                                                                                                                                                                       | Aprobada                                                                     |
| Reflujo a 320 px y 720 px: sin desplazamiento horizontal (1.4.10)                                                                                                                                                       | Aprobada                                                                     |
| Espaciado de texto (1.4.12: interlineado 1,5; letras 0,12 em; palabras 0,16 em; párrafos 2 em): sin desbordamiento ni recortes                                                                                          | Aprobada                                                                     |
| Teclado: enlace de salto primero; Enter lo activa y enfoca `<main>`; recorrido completo con Tab sin trampas; orden cabecera → contenido → pie                                                                           | Aprobada (Chromium, Firefox)                                                 |
| Foco visible (contorno de 3 px) en todos los elementos enfocables                                                                                                                                                       | Aprobada (Chromium, Firefox)                                                 |
| Foco no oculto por la cabecera fija, hacia delante y hacia atrás (Shift+Tab) (2.4.11)                                                                                                                                   | Aprobada (Chromium, Firefox)                                                 |
| Menú móvil: `aria-expanded`/`aria-controls`, Escape + retorno del foco, cierre al elegir/clic fuera/salir del foco                                                                                                      | Aprobada (3 motores; Tab solo Chromium/Firefox)                              |
| `prefers-reduced-motion`: sin transiciones; desplazamiento inmediato (para todos)                                                                                                                                       | Aprobada                                                                     |
| Modo de colores forzados (`forced-colors: active`): controles operables                                                                                                                                                 | Aprobada (operabilidad; sin revisión visual)                                 |
| Contraste de tokens (texto ≥ 4,5:1; componentes y foco ≥ 3:1; insignias ≥ 5:1) en ambos temas                                                                                                                           | Aprobada (prueba unitaria `contrast.test.ts`; margen mínimo de texto 5,38:1) |
| Contraste de los enlaces del menú móvil (colores computados)                                                                                                                                                            | Aprobada (≥ 4,5:1)                                                           |
| **Idioma de las partes (3.1.2):** en inglés, cada nombre oficial en español está dentro de un elemento con `lang="es"`; en español no hay marcas; sin etiquetas literales; reglas `valid-lang` y `html-has-lang` de axe | Aprobada (4 pruebas E2E + 10 unitarias)                                      |

## 2. Estado por criterio de WCAG 2.2 AA (resumen honesto)

Leyenda: **A** = aprobado con evidencia automatizada · **P** = aprobado parcialmente / depende de
revisión humana · **I** = incompleto (hallazgo abierto) · **N** = no verificado.

| Criterio                                       | Estado | Notas                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1.1 Contenido no textual                     | A      | Iconos decorativos `aria-hidden`; monograma con nombre accesible. Sin imágenes informativas                                                                                                                                                                                                                                                                                                                                                                |
| 1.3.1 Información y relaciones                 | A      | HTML semántico, listas, `dl`, encabezados, landmarks (pruebas + axe)                                                                                                                                                                                                                                                                                                                                                                                       |
| 1.3.2 Secuencia con significado                | P      | Orden del DOM = orden visual en las pruebas de foco; sin revisión con lector de pantalla                                                                                                                                                                                                                                                                                                                                                                   |
| 1.3.4 Orientación / 1.3.5 Propósito de entrada | A      | Sin bloqueo de orientación; sin campos                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.4.1 Uso del color                            | P      | La sección activa del menú usa color y fondo además de `aria-current`; las áreas profesionales llevan icono y título. Revisión visual humana pendiente                                                                                                                                                                                                                                                                                                     |
| 1.4.3 Contraste mínimo                         | A      | Tokens + axe (12 estados, 0 violaciones/incompletos)                                                                                                                                                                                                                                                                                                                                                                                                       |
| 1.4.4 Cambio de tamaño del texto               | P      | Equivalente por ventana (720 px); **no** zoom real del navegador                                                                                                                                                                                                                                                                                                                                                                                           |
| 1.4.5 Imágenes de texto                        | A      | No hay                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| 1.4.10 Reflujo                                 | A      | 320 y 360 px sin scroll horizontal (equivalente a 400 %)                                                                                                                                                                                                                                                                                                                                                                                                   |
| 1.4.11 Contraste no textual                    | A      | Bordes de controles y foco ≥ 3:1 (prueba de tokens)                                                                                                                                                                                                                                                                                                                                                                                                        |
| 1.4.12 Espaciado del texto                     | A      | Prueba con la hoja de estilos de la especificación                                                                                                                                                                                                                                                                                                                                                                                                         |
| 1.4.13 Contenido con hover o foco              | A      | Sin popovers; solo el `title` nativo del logotipo                                                                                                                                                                                                                                                                                                                                                                                                          |
| 2.1.1 Teclado / 2.1.2 Sin trampas              | A      | Chromium y Firefox; WebKit no enfoca enlaces con Tab por defecto (comportamiento del motor)                                                                                                                                                                                                                                                                                                                                                                |
| 2.2.x Tiempo / 2.3.1 Destellos                 | A      | No hay contenido temporizado ni destellos                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2.4.1 Evitar bloques                           | A      | Enlace de salto + landmarks                                                                                                                                                                                                                                                                                                                                                                                                                                |
| 2.4.2 Título de página                         | A      | `<title>` verificado por la guardia                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 2.4.3 Orden del foco                           | A      | Prueba de orden de zonas                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2.4.4 Propósito de los enlaces                 | A      | Nombres accesibles; aviso "se abre en una pestaña nueva"                                                                                                                                                                                                                                                                                                                                                                                                   |
| 2.4.6 Encabezados y etiquetas                  | A      | Jerarquía verificada                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| 2.4.7 Foco visible                             | A      | Contorno 3 px                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 2.4.11 Foco no oculto (2.2)                    | A      | `scroll-padding` + `useFocusNotObscured`; Chromium y Firefox. **WebKit no verificado** (Tab no enfoca enlaces)                                                                                                                                                                                                                                                                                                                                             |
| 2.5.1–2.5.4 Gestos, cancelación, nombre        | A      | Sin gestos complejos; nombre accesible contiene el texto visible (2.5.3, corregido en Fase 2)                                                                                                                                                                                                                                                                                                                                                              |
| 2.5.7 Arrastre (2.2)                           | A      | No aplica                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 2.5.8 Tamaño del objetivo (2.2)                | A      | ≥ 24 × 24 px                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| 3.1.1 Idioma de la página                      | A      | `lang` dinámico (es/en)                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 3.1.2 Idioma de las partes                     | A      | **Corregido (2026-11-25).** Los títulos oficiales que se conservan en español dentro de la interfaz en inglés (formación, certificaciones y cursos, unidad de la experiencia, cierre del Hero y formación por área) se marcan con `lang="es"` mediante `LocalizedText`; el idioma del PDF se muestra en el idioma de la interfaz. Los nombres propios de instituciones y empleadores quedan exentos del criterio. Los botones de idioma ya llevaban `lang` |
| 3.2.1–3.2.4 Predecible                         | A      | El cambio de idioma/tema es explícito y no mueve el foco                                                                                                                                                                                                                                                                                                                                                                                                   |
| 3.2.6 Ayuda consistente (2.2)                  | A      | No aplica                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| 3.3.x Entrada de datos                         | A      | No hay formularios                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| 3.3.7 / 3.3.8 (2.2)                            | A      | No aplican                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 4.1.2 Nombre, función, valor                   | A      | axe + pruebas (`aria-pressed`, `aria-expanded`, `aria-current`)                                                                                                                                                                                                                                                                                                                                                                                            |
| 4.1.3 Mensajes de estado                       | N      | No hay mensajes de estado; no se evaluó el anuncio de cambios de tema/idioma con lectores de pantalla                                                                                                                                                                                                                                                                                                                                                      |

### Incidente en Firefox (2.4.11), causa sin determinar

Una ejecución de la suite midió «Contactar por LinkedIn» bajo la cabecera al recorrer hacia atrás con Shift+Tab. No se
reprodujo de forma sistemática, no se determinó la causa ni está demostrado que sea independiente de la corrección de la
Fase A. Las comprobaciones posteriores pasaron y el riesgo residual fue aceptado (detalle en `docs/PRUEBAS.md`).

### Fase B: Hero móvil y menú

- En pantallas compactas las acciones van tras la presentación. El orden se decide en el DOM (no con `order` de CSS):
  lectura, tabulación y vista coinciden. Los enlaces no se duplican.
- Enlaces del Hero y del menú móvil: al menos 44 px de alto en las pruebas. Los botones de idioma de la cabecera no
  cambiaron.
- El gráfico central sigue oculto por debajo de 1024 px (`display: none`, también para lectores de pantalla); queda el
  monograma de la cabecera.
- Al cruzar el punto de cambio (giro o redimensionado) los bloques se reordenan sin recrear los enlaces; el
  comportamiento del foco enfocado en ese instante **no se probó en navegadores reales**.

### Fase C: barra de accesos directos en móvil

- `<nav>` propio («Accesos directos» / «Shortcuts») con cinco enlaces; el nombre accesible es el texto visible y los
  iconos son decorativos. Sin `tablist` ni `tab`. `aria-current="location"` solo si la sección detectada tiene acceso.
- Va al final del orden de tabulación. Cuando no corresponde mostrarla no se monta; con el menú abierto queda
  `visibility: hidden` (fuera del foco y del árbol de accesibilidad) para no tapar ni duplicar controles.
- Áreas de al menos 48 px de alto y 52 px de ancho en las medidas; fondo opaco con los tokens ya validados.
- **Foco no oculto (2.4.11):** `scroll-padding-bottom` más `useFocusNotObscured`, que ahora también destapa el foco
  cubierto por la barra (solo teclado o programa, nunca puntero ni `<main>`).
- **Foco por programa tras usar un puntero:** sigue sin ajustarse hasta la siguiente tecla. La aplicación no tiene
  ningún camino que lo provoque (el único foco por programa es Escape en el menú, que es de teclado). No se cambió.
- **Cambio de tamaño con un elemento enfocado:** no se reajusta solo, para no mover la página sin acción del usuario.
- **Fuente base grande del navegador:** las consultas usan `em`, así que la barra se retira cuando no cabe.
- **Hallazgo anterior a esta fase:** con fuente base de 32 px hay desbordamiento horizontal de 33 a 138 px en anchos
  de 360 a 450 px (igual antes y después de la barra). Pendiente de tratar.
- axe sin violaciones en la matriz existente, que a 375 px incluye la barra. **No se probó con lectores de pantalla.**

### Etiquetas de tecnologías (2026-11-26)

- Las etiquetas siguen siendo texto: sin foco, sin rol y sin cursor de acción. El realce no aporta información.
- axe sin violaciones en la matriz existente. **No se probó con lectores de pantalla.**
- El CV conserva texto seleccionable y estructura etiquetada; su accesibilidad no se ha auditado.

### Comprobación manual del propietario (emulador responsive de Chrome)

La barra aparece, desaparece al abrir el menú, el pie se ve completo, a 752 × 320 queda oculta y a 752 × 726 vuelve a
aparecer. Es emulación, no un dispositivo físico.

### Pendientes conocidos (sin corregir)

- Fallo esporádico de Firefox de la Fase A, sin causa determinada.
- Desbordamiento horizontal con fuente base de 32 px (anterior a la Fase C).
- Foco por programa después de usar un puntero.
- Comportamiento del foco al cambiar de tamaño u orientación.
- Un toque en la barra abrió el destino en una pestaña nueva (WebKit automatizado, una vez; PRUEBAS.md).
- Sin pruebas en dispositivos físicos, en Safari real ni con lectores de pantalla.

## 3. No verificado (pendiente)

- **Lectores de pantalla:** NVDA, JAWS, VoiceOver (macOS/iOS), TalkBack. No se probó ninguno.
- **Zoom real del navegador** al 200 % y 400 % (solo equivalentes por tamaño de ventana).
- **Dispositivos reales** y táctil; teclados virtuales; control por voz.
- **Safari real** (el WebKit de Playwright no equivale a Safari); navegación por teclado en WebKit/Safari.
- **Modos de alto contraste de Windows** con revisión visual (solo se verificó operabilidad).
- Revisión humana de 1.3.2, 1.4.1, claridad del lenguaje y calidad de las traducciones.
- Pronunciación real de los fragmentos `lang="es"` con lector de pantalla (la marca está verificada en el DOM, no el audio).
- Los **PDF** (CV) no se evalúan para accesibilidad (etiquetado, orden de lectura): el CV publicado conserva la estructura etiquetada del original (con una anotación de enlace a LinkedIn **sin estructura asociada** en el árbol de etiquetas: no cuenta con una auditoría PDF/UA completa y su accesibilidad formal permanece **pendiente**; el PDF no se modificará solo por este motivo), pero no se auditó con PAC/Acrobat ni lector de pantalla.
- Criterios AAA (no son objetivo).

## 4. Decisiones de diseño relevantes

- **Cabecera `fixed` y opaca** + espaciador + `scroll-padding-top` (anclas y foco) + `useFocusNotObscured`
  (Firefox). El ajuste actúa con foco por teclado (o por programa), nunca con puntero ni sobre `<main>`
  (antes devolvía la página al inicio al pulsar el contenido). **Caso límite no probado:** después de usar un
  puntero, un foco movido sin pulsar teclas (por programa o por alguna tecnología de apoyo) no se ajusta hasta
  que haya una pulsación de tecla. Razones de la cabecera `fixed`: una cabecera _sticky_ con `scroll-padding`
  desplazaba la página al activar sus controles con teclado, y con fondo semitransparente axe no podía calcular
  el contraste.
- **Menú móvil como disclosure** (no modal): sin atrapar el foco; se cierra con Escape, clic fuera o al salir.
- **Sin animaciones decorativas**; con `prefers-reduced-motion` se anulan las transiciones. El desplazamiento entre
  secciones es inmediato para todos (se retiró el suave por un defecto del historial: PRUEBAS.md).
- **Colores:** tokens validados por prueba; el color nunca es el único portador de significado en las áreas.

## 5. Cómo reproducir y ampliar

```powershell
npm run e2e:install        # una vez: descarga los navegadores dentro del proyecto
npm run test:e2e           # compila y ejecuta E2E + accesibilidad
npx playwright test e2e/a11y.spec.ts --project=chromium
```

Antes de cualquier declaración pública de conformidad: lectores de pantalla, zoom real, dispositivos
reales y revisión humana de los criterios marcados **P**, **I** y **N**.

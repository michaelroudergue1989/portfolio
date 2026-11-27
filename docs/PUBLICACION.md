# Guía de publicación y confidencialidad

El repositorio será **público** y el sitio se desplegará en Vercel. Todo lo que esté en el código
versionado, en el historial de Git o en `dist/` debe considerarse publicado para siempre: una vez
subido, puede ser clonado, copiado o indexado aunque se borre después.

> **Regla central.** Ocultar un contenido con una condición de React **no** lo protege: los datos
> viajan en el repositorio, en el historial, en los recursos de i18n y en el JavaScript compilado.
> Lo no autorizado debe estar **fuera del repositorio** (carpeta `private/`, ignorada).

> **Este documento es publicable.** No contiene nombres internos de sistemas, términos
> confidenciales ni el detalle del historial: ese material vive solo en `private/` (local).

## 1. Estado actual

| Aspecto                                 | Estado                                                                                                                                       |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Push / despliegue                       | Fases A y B publicadas en GitHub y Vercel (público `a80cd2a`, 2026-11-26); Fase C autorizada para publicación el 2026-11-27                  |
| Estrategia de publicación del historial | Instantánea saneada (sección 5); las actualizaciones se transfieren con `git archive` sobre el repositorio público, con árbol idéntico       |
| Remotos del repositorio de desarrollo   | **Ninguno** (`origin` eliminado el 2026-11-25)                                                                                               |
| Repositorio de publicación              | `C:\Proyectos\portfolio-public`: creado; es el único con remoto                                                                              |
| `push.default` local                    | `nothing` (un `git push` sin argumentos falla)                                                                                               |
| Árbol de trabajo                        | Sin información pendiente de autorización (verificado con la guardia y la lista privada)                                                     |
| Historial local                         | **Los commits anteriores contienen información pendiente de autorización.** No publicar el historial de desarrollo                           |
| CV                                      | **Un solo CV público**, habilitado (`public/cv/michael-roudergue-cv.pdf`, autorizado 2026-11-25; versión con correo, aprobada el 2026-11-27) |
| Fotografía                              | No existe (monograma)                                                                                                                        |

## 2. Inventario de información publicable (en el código)

| Información                                                                                                              | Dónde                                        |
| ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| Nombre completo, título, región                                                                                          | `src/data/profile.ts`, locales               |
| Experiencia (empleadores, cargos, periodos, responsabilidades, tecnologías) con **denominaciones genéricas** de sistemas | `src/data/experience.ts`, locales            |
| Proyectos con **denominaciones profesionales genéricas**                                                                 | `src/data/projects.ts`, locales              |
| Formación, certificaciones y cursos (sin enlaces ni identificadores)                                                     | `src/data/education.ts`, `certifications.ts` |
| Habilidades y niveles de autoevaluación                                                                                  | `src/data/skills.ts`                         |
| LinkedIn y GitHub (perfiles públicos confirmados)                                                                        | `src/data/contact.ts`                        |
| Fuentes Inter y JetBrains Mono (licencia OFL incluida)                                                                   | `src/assets/fonts/`                          |

### Política de denominaciones

Mientras no exista autorización expresa para publicar nombres específicos de sistemas, **se usan
denominaciones profesionales genéricas** en experiencia, proyectos, traducciones y documentación
(p. ej. "sistema institucional de gestión de consentimientos", "plataforma institucional de
vinculación con el medio"). Se conservan empleadores, cargos, periodos, tecnologías y
responsabilidades confirmadas, siempre que no revelen información confidencial.

## 3. Inventario de información pendiente de autorización

| Elemento                                             | Estado                     | Dónde vive                                  |
| ---------------------------------------------------- | -------------------------- | ------------------------------------------- |
| Nombres específicos de sistemas y proyectos internos | No publicados              | `private/` (ignorado por Git y Vercel)      |
| PDF del CV público (versión autorizada)              | Incluido en el repositorio | `public/cv/` (único PDF versionable)        |
| Candidato y herramientas de preparación del CV       | No publicados              | `private/cv-candidato/` (ignorado)          |
| Otros tres CV (jefatura, desarrollo, ciberseguridad) | Privados; no forman parte  | Fuera del repositorio                       |
| Fotografía profesional                               | No existe                  | `profile.photo` comentado                   |
| Correo profesional (único autorizado, 2026-11-26)    | Texto del CV público (PDF) | Excepción de la guardia (4.2); no en la web |
| Teléfono y otros correos                             | No se publican             | —                                           |

## 4. Controles reproducibles

| Comando                                                                                | Qué hace                                                                                      | Disponible en CI/Vercel  |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------ |
| `npm run build`                                                                        | Compila y ejecuta la guardia (`postbuild`)                                                    | Sí                       |
| `npm run verify:publication`                                                           | Solo la guardia, sobre `dist/` ya compilado                                                   | Sí                       |
| `npm run verify:publication:strict`                                                    | Igual, pero **falla** si falta la lista privada                                               | No (requiere `private/`) |
| `node scripts/check-publication.mjs --strict-private --root=<ruta> --denylist=<lista>` | Revisión privada estricta de **otro árbol** (la instantánea) con la lista local, sin copiarla | Solo local               |
| `npm run verify:public-branch -- <rama>`                                               | Verifica que una rama no comparte historial con otras referencias                             | Solo local               |
| `npm run verify:cv -- <ruta.pdf>`                                                      | Verifica un PDF de CV (texto, datos personales, metadatos)                                    | Solo local               |

### 4.1 Niveles de la guardia (`scripts/check-publication.mjs`)

| Nivel                    | Qué comprueba                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Depende de datos privados |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| `[estructural]`          | `private/`, `.env`, claves y tipos de archivo prohibidos versionados; **política explícita de formatos y rutas versionables** (lista de permitidos, ver 4.3); correos (también ofuscados), teléfonos chilenos e internacionales, RUT y rutas locales en el código y en `dist/` (heurística, ver 4.2); invariantes del CV                                                                                                                                                                     | No                        |
| `[PDF]`                  | Solo el PDF del CV habilitado y existente; cabecera `%PDF`; ≤ 5 MB; **fallo seguro**: sin cifrado, sin estructuras que el inspector no pueda analizar (objetos comprimidos, formularios XObject, filtros no admitidos, fuentes sin mapa Unicode, actualizaciones incrementales), sin contenido activo ni adjuntos; páginas = `resume.json`; **texto extraíble en cada página** (≥ 100 caracteres); sin datos personales; enlaces solo a los perfiles permitidos; metadatos (autor, software) | No                        |
| `[dist]`                 | Solo tipos de archivo permitidos; sin mapas ni `sourceMappingURL`; sin scripts, estilos ni manejadores en línea (compatibles con la CSP); hosts externos solo de una lista cerrada                                                                                                                                                                                                                                                                                                           | No                        |
| `[metadatos]`            | `lang`, `title`, `description`, Open Graph, favicon, `robots.txt` indexable, `canonical`/`og:url`/`sitemap.xml` solo si hay `SITE_URL` (no se inventa dominio)                                                                                                                                                                                                                                                                                                                               | No                        |
| `[contenido autorizado]` | Paridad ES/EN, sin textos vacíos ni marcadores de posición, solo los dos perfiles públicos confirmados, sin URLs externas no previstas en el código                                                                                                                                                                                                                                                                                                                                          | No                        |
| `[privada]`              | Frases de `private/denylist.txt` en `dist/` y en el código versionado                                                                                                                                                                                                                                                                                                                                                                                                                        | **Sí** (solo local)       |

### 4.2 Limitaciones declaradas

- La revisión **privada** no existe en GitHub Actions ni en Vercel (la lista no se versiona). Cuando falta,
  la guardia imprime `LIMITACIÓN` y `Revisión de privacidad INCOMPLETA`. **Los controles estructurales
  no demuestran la ausencia de información confidencial específica**: antes de publicar, ejecutar
  `npm run verify:publication:strict` en el equipo local.
- El inspector de PDF (`scripts/pdf-text.mjs`) **no es un lector PDF completo**: admite fuentes con mapa
  `/ToUnicode` (LibreOffice, Word) y flujos Flate. Ante cualquier estructura que no puede analizar de forma
  fiable (objetos comprimidos, formularios XObject, filtros distintos de Flate, fuentes sin mapa Unicode,
  actualizaciones incrementales, cifrado) **informa una limitación y falla** (el PDF se trata como no
  verificado). Tampoco analiza imágenes, y no sustituye la lectura humana ni una auditoría PDF/UA.
  Se contrastó el PDF publicado con un motor independiente (pdf.js de Firefox): mismo número de páginas, texto
  y enlaces.
- **La detección de datos personales es heurística** y no garantiza identificar todos los datos posibles:
  cubre correos (incluidos formatos ofuscados habituales), teléfonos móviles y fijos chilenos con o sin
  prefijo internacional, teléfonos internacionales con «+», RUT con y sin puntos y rutas locales. Se
  diseñó para no marcar hashes, fechas, versiones ni números técnicos, pero puede dejar pasar formatos
  inusuales, datos partidos o codificados y texto dentro de imágenes. No sustituye la lectura humana.
- Una búsqueda textual **no** detecta información privada dentro de imágenes ni de otros binarios: por eso
  los binarios nuevos requieren revisión expresa (4.3).
- `private/denylist.txt` debe contener frases **exclusivas** de lo no autorizado; no puede incluir
  nombres que ya aparezcan en contenido aprobado.
- La guardia estructural se ejecuta también en GitHub Actions y en el build de Vercel; la revisión privada no.

**Excepción para el correo profesional.** La guardia admite una sola dirección y solo como **texto visible** del CV
público. Exige a la vez (`AUTHORIZED_CV` en `scripts/check-publication.mjs`): la ruta `cv/michael-roudergue-cv.pdf`,
el SHA-256 exacto del archivo y la huella SHA-256 de la dirección (que así no se escribe en el repositorio). En HTML,
JavaScript, CSS, traducciones, documentación, metadatos, anotaciones, bytes sin comprimir y cualquier otro PDF se sigue
rechazando, igual que cualquier otro correo. `verify:cv` aplica la misma condición. Pruebas en
`src/test/publication.test.ts` y `e2e/cv-privacy.spec.ts`. La huella no es una protección: la dirección es legible y
extraíble desde el PDF publicado.

### 4.3 Política explícita de archivos versionables (lista de permitidos)

La guardia no solo prohíbe extensiones peligrosas: **solo admite** lo declarado en
`scripts/check-publication.mjs`. Todo lo demás (CSV, RTF, ODT, EML/MSG, XLS/XLSX, DOC/DOCX, comprimidos,
imágenes, fuentes u otros binarios no revisados, archivos sin extensión desconocidos) falla.

- **Texto y código:** `.ts .tsx .mts .mjs .cjs .js .json .md .css .html .svg .yml .yaml .txt .sample` y los
  archivos de configuración `.gitattributes .gitignore .prettierignore .vercelignore .gitkeep .env.example`.
- **Binarios revisados (por ruta exacta y firma de archivo):** `public/favicon.ico`, las dos fuentes
  `.woff2` de `src/assets/fonts/` y el PDF del CV (solo si `resume.json` lo habilita).
- Un binario nuevo requiere **revisión expresa del propietario** y su alta en `REVIEWED_BINARIES`.

### 4.4 Validación estructural pública frente a validación privada estricta local

| Validación                 | Dónde corre                                   | Qué demuestra                                                                                                   |
| -------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Estructural pública**    | Equipo local, CI (GitHub Actions) y Vercel    | No hay archivos, formatos, datos personales genéricos ni estructuras prohibidas. **No** conoce la lista privada |
| **Privada estricta local** | Solo el equipo local (`private/denylist.txt`) | No hay frases de lo no autorizado en `dist/`, el código versionado ni el texto del PDF. Falla si falta la lista |

La lista privada **nunca** se versiona ni se sube a GitHub o Vercel. **El éxito de CI no sustituye
`npm run verify:publication:strict`**, que es requisito obligatorio antes de generar la instantánea (5.2).

## 5. Procedimiento futuro: publicación de una instantánea saneada (opción A)

> **No ejecutar sin autorización expresa.** No reescribe `main` ni toca el historial: toma **una
> instantánea ya revisada** de los archivos versionados, la lleva a un directorio **separado**
> (`C:\Proyectos\portfolio-public`) y publica un repositorio nuevo de **un solo commit**. El historial
> local (`main`) no se sube nunca.

### 5.0 Por qué NO basta `git switch --orphan` + `git add -A`

`git switch --orphan <rama>` **elimina del árbol de trabajo y del índice todos los archivos
versionados** de la rama anterior. Después de ejecutarlo, el directorio queda casi vacío (solo
sobreviven los archivos ignorados o sin versionar, p. ej. `private/`, `node_modules/` y `dist/`).
Por lo tanto:

- `git add -A` **no recupera** el árbol saneado: añadiría solo lo que haya sobrevivido (archivos
  ignorados no, pero sí cualquier archivo sin versionar que estuviera suelto) y perdería el código.
- Se trabajaría sobre el mismo `.git` que contiene los objetos del historial antiguo: cualquier
  error de refspec podría publicarlos.
- No hay forma sencilla de demostrar que lo publicado es **exactamente** lo revisado.

Por eso el procedimiento parte de una **instantánea fijada por su hash** (`git archive`), la copia
a un directorio vacío y crea allí un repositorio **sin** el historial antiguo en su base de objetos.

### 5.1 Dos repositorios independientes

| Repositorio                          | Ruta                            | Contenido y remoto                                                                                                                                                                                 |
| ------------------------------------ | ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Desarrollo** (privado, solo local) | `C:\Proyectos\portfolio`        | Historial completo (contiene información pendiente de autorización) y `private/`. **Sin remotos** (`origin` eliminado el 2026-11-25). `push.default = nothing`. No se publica nunca                |
| **Publicación** (futuro)             | `C:\Proyectos\portfolio-public` | Instantánea de un commit revisado, un único commit raíz, sin historial. **Es el único repositorio que tendrá remoto** (`https://github.com/michaelroudergue1989/portfolio.git`). Aún **no creado** |

El repositorio remoto de GitHub existe y estaba **vacío** al 2026-11-25 (`git ls-remote` sin referencias).

### 5.2 Precondiciones (obligatorias)

1. Autorización expresa del propietario para crear la instantánea y, aparte, para el primer push.
2. Los cambios que deben publicarse están **confirmados en un commit local** de `main`, revisado por el
   propietario. Anotar su hash completo: `git rev-parse HEAD` → `<COMMIT_REVISADO>`. Lo que no esté en
   ese commit (archivos sin versionar o ignorados, como `private/`) **no** se publicará: `git archive` solo
   exporta archivos versionados.
3. **Validación privada estricta local (requisito obligatorio antes de generar la instantánea).** En el
   repositorio de desarrollo, sobre ese commit y con `private/denylist.txt` presente:
   `npm run check`, `npm run test:coverage`, `npm run test:e2e`, `npm run verify:publication:strict`,
   `npm run verify:cv -- public/cv/michael-roudergue-cv.pdf`, `npm run audit:deps` y `npm audit`.
   **El éxito de CI no sustituye `npm run verify:publication:strict`:** CI solo ejecuta la validación
   _estructural pública_ (no tiene la lista privada, que nunca se sube a GitHub ni a Vercel).
4. Si se publica el CV: el PDF autorizado ya forma parte de ese commit (sección 6) y pasó `npm run verify:cv`.
5. Revisar el inventario privado (`private/inventario-historial.md`) y confirmar que el **árbol de ese
   commit** no contiene lo pendiente de autorización (la instantánea no incluye el historial).
6. Copia de seguridad **fuera** de las carpetas de ambos repositorios:
   `git bundle create <ruta-privada>\portfolio-respaldo.bundle --all`.
7. `git remote` en el repositorio de desarrollo debe estar **vacío** y `git config push.default` debe ser `nothing`.

### 5.3 Exportar la instantánea al directorio independiente (sin tocar el desarrollo)

```powershell
$dev     = "C:\Proyectos\portfolio"
$pub     = "C:\Proyectos\portfolio-public"                       # DEBE NO existir (y estar fuera de $dev)
$commit  = "<COMMIT_REVISADO>"                                   # hash completo del commit revisado
if (Test-Path $pub) { throw "El directorio ya existe: elige otro o revísalo antes de borrarlo." }
New-Item -ItemType Directory $pub | Out-Null
$tar = Join-Path $env:TEMP "portfolio-instantanea.tar"
git -C $dev archive --format=tar -o $tar $commit                 # solo archivos versionados de ese commit
tar -x -f $tar -C $pub
Remove-Item $tar
Get-ChildItem $pub -Force -Name                                  # sin private/, dist/, node_modules/, .env, .git
```

> **No usar** `git archive ... | tar -x`: en PowerShell 5.1 la tubería convierte el flujo binario a texto y
> corrompe el archivo (comprobado en un ensayo: `tar: Unrecognized archive format`). Se usa `-o` para escribir
> el `.tar` en un archivo temporal.

El directorio `.git` del desarrollo **no** se copia (`git archive` no lo incluye). No se modifica la
rama ni el árbol de trabajo del desarrollo.

### 5.4 Repositorio nuevo: identidad, revisión de archivos y commit raíz único

```powershell
Push-Location $pub
git init -b publicar
git config --local core.autocrlf false
git config --local push.default nothing
git config --local user.name  "<nombre>"
git config --local user.email "<correo noreply de GitHub>"         # NUNCA el correo institucional global
git config --local --get user.email                                 # confirmar la identidad local
git add -A
git status --short                                                  # revisar TODO lo que se versionará
git status --short | Select-String -Pattern 'private|\.env|node_modules|dist/'   # no debe mostrar nada
git commit -m "feat: initial public release"
git log -1 --format="%H %an <%ae>"                                  # autor = identidad noreply
Pop-Location
```

La identidad **global** del equipo puede ser institucional: por eso la identidad local se configura **antes**
del commit y se verifica después. Este repositorio nuevo **no contiene** los objetos del historial antiguo,
etiquetas, stash ni referencias auxiliares: no hay forma de publicarlos desde él.

### 5.5 Integridad: el árbol publicado es el árbol revisado

```powershell
git -C $pub rev-parse "publicar^{tree}"                              # hash del árbol de la instantánea
git -C $dev rev-parse "$commit^{tree}"                               # hash del árbol revisado
```

Si ambos hashes **coinciden**, lo publicado es byte a byte lo revisado. Si difieren (modos de archivo o
saltos de línea en Windows), comparar con `git diff --no-index` entre una exportación nueva y `$pub` y
documentar la diferencia **antes** de continuar.

### 5.6 Verificaciones desde la instantánea (después de `git init` y del commit)

```powershell
Push-Location $pub
npm ci
npm run check                      # formato, tipos, lint, pruebas y build (la guardia ya ve el repositorio Git nuevo)
npm run verify:publication         # validación ESTRUCTURAL pública, ahora con los archivos versionados reales
npm run test:coverage
npm run test:e2e:built             # E2E sobre el dist/ recién compilado
Pop-Location

# Revisión PRIVADA estricta de la instantánea, con los scripts del desarrollo y la lista local.
# La lista NO se copia a $pub ni entra en Git (la opción --denylist la lee desde el desarrollo).
node "$dev\scripts\check-publication.mjs" --strict-private --root=$pub --denylist="$dev\private\denylist.txt"

npm --prefix $dev run verify:cv -- "$pub\public\cv\michael-roudergue-cv.pdf"
```

Verificar que no procede nada del desarrollo:

```powershell
git -C $pub rev-list --count publicar                                # debe ser 1
git -C $pub rev-list --max-parents=0 publicar | Measure-Object       # exactamente 1 raíz
git -C $pub for-each-ref                                             # solo refs/heads/publicar
git -C $pub tag ; git -C $pub stash list ; git -C $pub remote        # vacíos
git -C $pub ls-files | Select-String -Pattern '^private/|\.env|\.map$'   # sin coincidencias
git -C $pub fsck --no-dangling
# Ningún commit del historial de desarrollo existe en el repositorio nuevo:
git -C $dev rev-list --all | ForEach-Object { git -C $pub cat-file -e $_ 2>$null; if ($LASTEXITCODE -eq 0) { "PRESENTE EN PUBLICACIÓN: $_" } }
node "$dev\scripts\check-public-branch.mjs" publicar --repo=$pub
```

**Ensayo de la mecánica (2026-11-25, en un directorio temporal, sin remoto ni ramas en el desarrollo):**
exportación con `git archive -o`, repositorio de un commit y comparación de hashes de árbol → 141 archivos,
1 commit, 1 raíz, solo `refs/heads/publicar` y **hash de árbol idéntico**. Se eliminó al terminar. El
procedimiento real (`C:\Proyectos\portfolio-public`) **no** se ha ejecutado.

### 5.7 Controles contra publicación accidental

| Riesgo                                | Control                                                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Publicar el repositorio de desarrollo | **No tiene remotos configurados**: no hay destino al que subir. El remoto se añade solo en `$pub`                                                 |
| `git push` sin argumentos             | `push.default = nothing` en ambos repositorios                                                                                                    |
| `git push --all` / `--mirror`         | Prohibidos. En `$pub` solo existe `publicar`, pero no se usan nunca                                                                               |
| Etiquetas, stash, notas, refs ajenas  | No existen en `$pub` (verificado con `for-each-ref`)                                                                                              |
| Rama equivocada                       | Hook `scripts/pre-push.sample` copiado a `$pub\.git\hooks\pre-push` (recomendado); solo permite `publicar` → `main` y exige `check-public-branch` |
| Reescritura remota                    | Nunca `--force`; el remoto debe estar vacío antes del primer push                                                                                 |
| Identidad institucional               | Identidad local `noreply` configurada y verificada antes del commit (5.4)                                                                         |
| Confiar solo en CI                    | CI no tiene la lista privada: `verify:publication:strict` local es requisito previo (5.2)                                                         |
| Cambios posteriores sin revisión      | Cada publicación nueva repite 5.2–5.6 desde un commit revisado (directorio de exportación nuevo)                                                  |

### 5.8 Primer push (solo con autorización expresa)

```powershell
Push-Location $pub
git remote add origin https://github.com/michaelroudergue1989/portfolio.git
git ls-remote origin                               # debe estar vacío
git push origin publicar:main                      # ÚNICO comando permitido: refspec explícito
Pop-Location
```

Verificación posterior: `git ls-remote origin` muestra solo `refs/heads/main` con el mismo hash que
`publicar`; clonar en un directorio temporal y comprobar `git rev-list --count HEAD` = 1.

Después de publicar:

- Continuar el trabajo a partir de un clon del repositorio público y conservar `C:\Proyectos\portfolio` como
  archivo **privado** (sin remotos; nunca se sube). Así el historial antiguo y `private/` quedan separados.
- En GitHub: activar Secret scanning y Push protection, Dependabot (alertas y actualizaciones),
  protección de la rama principal y permisos mínimos de Actions. **Ejecutar el workflow en Linux** y
  revisar su resultado en cada publicación.

### 5.9 Alternativa descartada: `git worktree`

`git worktree add --orphan -b publicar <directorio-separado>` (Git ≥ 2.42) crea una rama huérfana
en **otro directorio** sin alterar el árbol de trabajo actual. Se evitaría el problema de 5.0, pero el
`.git` conserva los objetos antiguos y los controles dependen del refspec explícito. Se documenta como
alternativa descartada; el procedimiento definitivo es 5.1–5.8.

## 6. Procedimiento para incorporar el currículum público

Existe **un solo** documento público (el CV Maestro). Los demás currículums (jefatura de proyectos,
desarrollo, ciberseguridad) son privados, se usan para postulaciones específicas y **no** forman
parte del repositorio, de `dist/` ni de la interfaz.

**Estado (2026-11-26):** el CV está **habilitado**. El PDF autorizado (2 páginas, español, sin teléfono, con el correo
profesional autorizado en el encabezado, denominaciones genéricas y un único enlace a LinkedIn) es
`public/cv/michael-roudergue-cv.pdf`, SHA-256 `789cc891d108382fd7d7373cae6b21f727218b27807100175eb77ca08680cd7c`.

| Versión                               | SHA-256                                                            |
| ------------------------------------- | ------------------------------------------------------------------ |
| Vigente: añade el correo (2026-11-26) | `789cc891d108382fd7d7373cae6b21f727218b27807100175eb77ca08680cd7c` |
| Anterior, publicada: sin correo       | `9c62fd959bbab01a75859850968e96273ddfbe0a92caddacab44e34c21e772b0` |

El único cambio es la línea de región de la primera página (objetos 2 y 3 del PDF). La versión anterior, la previa sin
anotación de enlace (`bb6cf764…54b08`) y las herramientas de generación quedan en `private/cv-candidato/` (ignorado
por Git y Vercel); la anterior sigue además en el historial público. `npm run verify:cv` exige que **todo destino de
enlace del PDF sea un perfil permitido** (`ALLOWED_PROFILE_URLS`) y rechaza `mailto:`/`tel:`.

Para sustituir el documento por una versión nueva (o publicar uno por primera vez):

1. **Autorización expresa** del propietario, después de revisar el PDF candidato completo (ambas páginas).
2. Ejecutar la verificación automática sobre el candidato (solo lectura):
   `npm run verify:cv -- private/cv-candidato/michael-roudergue-cv.pdf`. Comprueba cabecera y tamaño,
   número de páginas (contra `src/data/resume.json`), **texto extraíble** (ATS), ausencia de correo (salvo la excepción de 4.2),
   teléfono, RUT y rutas locales **en el texto y en los metadatos**, frases de la lista privada,
   texto suficiente en **cada página**, estructuras no analizables y contenido activo (fallo seguro), enlaces
   solo a perfiles permitidos y sin `mailto:`/`tel:`, autor/software y fechas de plantilla en los metadatos, e idioma del
   documento. Los avisos deben revisarse; los errores bloquean.
3. Revisión humana: abrir el PDF, confirmar que la información eliminada o generalizada es la
   esperada (ver el informe de la preparación) y que no hay datos personales no autorizados.
4. Copiar el archivo a `public/cv/michael-roudergue-cv.pdf` (ese nombre exacto).
5. En `src/data/resume.json`: `"available": true` y comprobar `language`, `updatedAt` (fecha real de
   esta versión del PDF) y `pages` (número de páginas verificado).
6. `npm run check && npm run test:e2e`. El build falla si falta el archivo, la cabecera no es PDF,
   el número de páginas no coincide, no se puede extraer texto, hay datos personales en el texto o los
   metadatos, o existe cualquier otro PDF.
7. Efecto automático: "Descargar CV" en el Hero y los botones "Descargar CV" y "Visualizar CV" de la sección
   (la visualización abre el PDF en una pestaña nueva con `rel="noopener noreferrer"`).
8. Abrir el PDF descargado y revisar ES/EN y claro/oscuro. El PDF queda en el historial: no subir versiones
   preliminares.

Para retirar el CV: `"available": false` y **borrar** el PDF de `public/cv/`.

## 7. Procedimiento para incorporar una fotografía

1. Solo una fotografía real, propia o con derechos, y autorizada. Nunca imágenes generadas por IA.
2. Recortar a 1:1 (≈ 640 × 640 px), exportar a **WebP o AVIF** (≤ 150 kB) y **eliminar EXIF** (puede
   incluir ubicación GPS y dispositivo).
3. Guardar en `public/profile.webp`; en `src/data/profile.ts` descomentar `photo`
   (`src`, `altKey`, `width`, `height`).
4. Añadir `hero.photoAlt` en `es.json` y `en.json` (descripción objetiva) manteniendo la paridad.
5. `HeroVisual` ya fija dimensiones y `decoding="async"`; verificar contraste y CLS (`npm run test:e2e`).

## 8. Revisión de datos personales

- Publicados: nombre completo, título, región y perfiles de LinkedIn y GitHub.
- No publicados: teléfono, domicilio, RUT, fecha de nacimiento, fotografía; ningún correo en la web (uno, autorizado, dentro del CV).
- Identidad de Git: `git log --format="%an <%ae>" | Sort-Object -Unique` solo debe mostrar el correo
  `noreply` de GitHub.
- `index.html` y metadatos: sin datos personales adicionales; sin JSON-LD (decisión deliberada).
- `git ls-files` y `git status --ignored`: sin `private/`, `.env*`, claves ni PDF no habilitados.

## 9. Revisión de proyectos institucionales

1. El propietario confirma, por proyecto, si la institución autoriza mencionarlo con nombre.
2. Si se autoriza un nombre específico: añadirlo en `src/data/projects.ts` y los locales; ampliar la
   lista aprobada en `src/sections/Projects.test.tsx`; actualizar `private/denylist.txt`. Sin capturas,
   repositorios ni documentación interna salvo autorización expresa.
3. Si no se autoriza: se mantiene la denominación genérica.

## 10. Revisión del historial de Git

```powershell
git log --oneline --stat                                  # qué archivos tocó cada commit
git for-each-ref                                          # todas las referencias (ramas, etiquetas, refs auxiliares)
git stash list ; git tag ; git notes list                 # deben estar vacíos
git reflog                                                # historial local de movimientos
git log -S"<frase>" --all --oneline                       # commits que añadieron/quitaron una frase
git rev-list --objects --all | git cat-file --batch-check # objetos inesperados (PDF, binarios)
```

El inventario detallado de commits y archivos afectados está en `private/inventario-historial.md`
(local; no publicar). Si aparece información no autorizada en una rama que se pretende publicar:
**no hacer push** de esa rama.

## 11. Checklist previo al primer `git push`

- [ ] Autorización expresa del propietario para crear la instantánea y, por separado, para publicar.
- [ ] Commit local revisado (`<COMMIT_REVISADO>`) con `npm run check`, `npm run test:coverage`, `npm run test:e2e`, `npm audit` y **`npm run verify:publication:strict`** en verde (el éxito de CI no lo sustituye).
- [ ] `npm run verify:cv -- public/cv/michael-roudergue-cv.pdf` superado y SHA-256 del PDF igual al autorizado.
- [ ] El repositorio de desarrollo no tiene remotos (`git remote` vacío) y `push.default = nothing`.
- [ ] Instantánea exportada con `git archive -o` a `C:\Proyectos\portfolio-public` (5.3).
- [ ] Repositorio nuevo: identidad local `noreply` verificada, archivos revisados, **un solo commit raíz** (5.4).
- [ ] Hash del árbol del repositorio nuevo **igual** al del commit revisado (o diferencia explicada) (5.5).
- [ ] Desde la instantánea: `npm ci`, `npm run check`, `npm run verify:publication` (tras `git init`), `npm run test:coverage` y `npm run test:e2e:built` en verde (5.6).
- [ ] Revisión privada estricta de la instantánea con `--root` y `--denylist` (lista local, sin copiarla) sin coincidencias (5.6).
- [ ] Sin referencias, etiquetas, stash, objetos ni commits del historial de desarrollo, ni `private/` ni artefactos no autorizados en el repositorio nuevo (5.6).
- [ ] Hook `pre-push` instalado en el repositorio nuevo (recomendado).
- [ ] Remoto configurado **solo** en el repositorio nuevo; `git ls-remote origin` vacío.
- [ ] Primer push **desde `C:\Proyectos\portfolio-public`**: `git push origin publicar:main` (sin `--all`, `--mirror`, `--tags`, `--force`).

## 12. Checklist previo al despliegue en Vercel

- [ ] Autorización expresa del propietario para desplegar.
- [ ] El remoto contiene solo la rama saneada (verificado con `git ls-remote`).
- [ ] GitHub Actions: ejecución del commit publicado revisada.
- [ ] Proyecto de Vercel: framework Vite, `npm ci`, `npm run build` (ejecuta la guardia), salida `dist`.
- [ ] Variable `SITE_URL` definida **solo** cuando se conozca el dominio definitivo (https, sin ruta).
- [ ] Sin otras variables de entorno ni secretos.
- [ ] Revisar la protección de despliegues y la visibilidad de las URL de vista previa.
- [ ] Cabeceras: comprobar en la respuesta real (ver `docs/SEGURIDAD.md`, "Verificaciones pendientes en producción").
- [ ] Probar el sitio desplegado: enlaces externos, ES/EN, claro/oscuro, móvil; no deben existir
      `/private/`, mapas `.map` ni PDF no previstos.
- [ ] Si se habilitó el CV: fue autorizado y revisado (sección 6); comprobar en producción que
      "Descargar CV" y "Visualizar CV" abren `/cv/michael-roudergue-cv.pdf` con `Content-Type: application/pdf`.

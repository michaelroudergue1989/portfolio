#!/usr/bin/env node
/**
 * Guardia de publicación. Se ejecuta tras cada `npm run build` (script `postbuild`, también en
 * Vercel y en CI) y con `npm run verify:publication`. Falla (exit 1) si algo no autorizado
 * llegaría a los artefactos publicables o al repositorio. Ver docs/PUBLICACION.md.
 *
 * Niveles de control (cada error indica el suyo):
 *  [estructural]         Siempre, sin datos privados: archivos prohibidos, datos personales
 *                        genéricos (correo, teléfono, RUT, rutas locales), invariantes de CV.
 *  [PDF]                 Solo CV habilitados; cabecera %PDF; revisión de metadatos.
 *  [dist]                Tipos de archivo permitidos, sin mapas, sin scripts/estilos en línea,
 *                        sin URLs externas fuera de la lista permitida.
 *  [metadatos]           title, description, idioma, canonical/robots/sitemap coherentes.
 *  [contenido autorizado] Paridad ES/EN, sin marcadores de posición, perfiles públicos exactos.
 *  [privada]             Opcional y LOCAL: frases de `private/denylist.txt`. No está disponible en
 *                        CI ni en Vercel; cuando falta se informa como LIMITACIÓN (la revisión de
 *                        privacidad queda incompleta). Con `--strict-private` su ausencia es error.
 *
 * Esta guardia no contiene ni debe contener términos confidenciales reales.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { inspectPdf, MIN_PAGE_TEXT_CHARS } from './pdf-text.mjs';

export const TIERS = {
  structural: 'estructural',
  pdf: 'PDF',
  dist: 'dist',
  meta: 'metadatos',
  content: 'contenido autorizado',
  private: 'privada',
};

const TEXT_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.json',
  '.txt',
  '.svg',
  '.md',
  '.ts',
  '.tsx',
  '.mts',
  '.xml',
  '.webmanifest',
  '.yml',
  '.yaml',
]);

/** Extensiones que pueden existir en dist/. */
const DIST_ALLOWED_EXTENSIONS = new Set([
  '.html',
  '.js',
  '.css',
  '.woff2',
  '.svg',
  '.txt',
  '.xml',
  '.webmanifest',
  '.png',
  '.webp',
  '.avif',
  '.jpg',
  '.jpeg',
  '.ico',
  '.pdf',
  '.gitkeep',
]);

/** Extensiones que no deben estar versionadas. */
const TRACKED_FORBIDDEN_EXTENSIONS = new Set([
  '.map',
  '.zip',
  '.7z',
  '.rar',
  '.docx',
  '.doc',
  '.xlsx',
  '.xls',
  '.pptx',
  '.ppt',
  '.pem',
  '.key',
  '.p12',
  '.pfx',
  '.sqlite',
  '.db',
  '.bak',
]);

/**
 * POLÍTICA EXPLÍCITA de archivos versionables (lista de permitidos). Todo lo que no esté aquí falla.
 * - Texto y código: solo estas extensiones.
 * - Binarios: solo las rutas revisadas de REVIEWED_BINARIES (con su firma de archivo). Un binario
 *   nuevo (imagen, fuente, documento…) requiere revisión expresa del propietario y alta aquí.
 * Una búsqueda textual NO inspecciona imágenes ni otros binarios: no detecta información privada
 * dentro de ellos; por eso su revisión es manual.
 */
const ALLOWED_TRACKED_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.mts',
  '.mjs',
  '.cjs',
  '.js',
  '.json',
  '.md',
  '.css',
  '.html',
  '.svg',
  '.yml',
  '.yaml',
  '.txt',
  '.sample',
]);
const ALLOWED_TRACKED_BASENAMES = new Set([
  '.gitattributes',
  '.gitignore',
  '.prettierignore',
  '.vercelignore',
  '.gitkeep',
  '.env.example',
]);
/** Binarios revisados: ruta → firma esperada (primeros bytes). El PDF del CV se autoriza por resume.json. */
export const REVIEWED_BINARIES = new Map([
  ['public/favicon.ico', '\u0000\u0000\u0001\u0000'],
  ['src/assets/fonts/inter-latin-wght-normal.woff2', 'wOF2'],
  ['src/assets/fonts/jetbrains-mono-latin-wght-normal.woff2', 'wOF2'],
]);

/** Perfiles públicos confirmados por el propietario (únicos enlaces a perfiles permitidos). */
export const ALLOWED_PROFILE_URLS = [
  'https://www.linkedin.com/in/michael-roudergue-a69035150',
  'https://github.com/michaelroudergue1989',
];

/** Hosts que pueden aparecer como texto en dist/ (espacios de nombres, mensajes de librerías, perfiles). */
export const ALLOWED_DIST_HOSTS = new Set([
  'www.w3.org',
  'www.sitemaps.org',
  'react.dev',
  'react.i18next.com',
  'tailwindcss.com',
  'github.com',
  'www.linkedin.com',
]);

const ALLOWED_EMAIL_DOMAINS = new Set([
  'example.com',
  'example.org',
  'example.net',
  'users.noreply.github.com',
  'localhost',
]);

/**
 * Patrones HEURÍSTICOS de datos personales. Reducen el riesgo pero NO garantizan detectar todos los
 * datos personales posibles (formatos inusuales, texto en imágenes, datos partidos o codificados).
 * Se diseñaron para limitar los falsos positivos en hashes, fechas, versiones y números técnicos:
 * los números sin prefijo ni etiqueta solo se marcan si siguen el formato exacto de un móvil o RUT.
 */
export const PATTERNS = {
  email: /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g,
  /** Teléfono internacional con «+» (cualquier país). */
  phone: /(?<![\w.])\+\d{1,3}[\s().-]?\d(?:[\s().-]?\d){6,}/g,
  /** Móvil chileno: 9 XXXX XXXX, con o sin +56, con espacios, puntos o guiones. */
  chileMobile: /(?<![\w.+-])(?:\+?56[\s.-]?)?9[\s.-]?\d{4}[\s.-]?\d{4}(?![\w-]|\.\d)/g,
  /** Fijo chileno: con +56, con código de área entre paréntesis o precedido de una etiqueta. */
  landline: new RegExp(
    [
      String.raw`(?<![\w.+-])\+?56[\s.-]?\(?\d{1,2}\)?[\s.-]?\d(?:[\s.-]?\d){6,7}(?!\d)`,
      String.raw`\(\d{1,2}\)[\s.-]?\d(?:[\s.-]?\d){6,7}(?!\d)`,
      String.raw`\b(?:tel|tel[eé]fono|fono|cel|celular|m[oó]vil|phone|mobile|whatsapp)\b\.?:?\s*[+(]?\d[\d\s().-]{6,}\d`,
    ].join('|'),
    'gi',
  ),
  /** RUT con puntos y guion (formato NN.NNN.NNN-D). */
  rut: /\b\d{1,2}\.\d{3}\.\d{3}-[\dkK]\b/g,
  /** RUT sin puntos (NNNNNNNN-D), con espacios o precedido de la etiqueta «RUT». */
  rutLoose: new RegExp(
    [
      String.raw`(?<![\w.-])\d{7,8}\s?-\s?[\dkK](?![\w-])`,
      String.raw`\b\d{1,2}[\s.]\d{3}[\s.]\d{3}\s?-\s?[\dkK]\b`,
      String.raw`\brut\b\W{0,3}\d[\d.\s-]{6,}[\dkK]\b`,
    ].join('|'),
    'gi',
  ),
  /** Correo ofuscado: «arroba»/«at» entre corchetes o paréntesis, «punto»/«dot», %40 y entidades HTML. */
  obfuscatedEmail: new RegExp(
    [
      String.raw`[\w.+-]+\s*[\[(<{]\s*(?:at|arroba)\s*[\])>}]\s*[\w-]+(?:\s*\.\s*[\w-]+|\s*[\[(<{]?\s*(?:dot|punto)\s*[\])>}]?\s*[\w-]+)+`,
      String.raw`[\w.+-]+\s+arroba\s+[\w-]+(?:\s*\.\s*[\w-]+|\s+(?:punto|dot)\s+[\w-]+)+`,
      String.raw`[\w.+-]+\s+at\s+[\w-]+(?:\s+dot\s+[\w-]+)+`,
      String.raw`[\w.+-]+(?:%40|&#0*64;|&commat;)[\w-]+(?:\.[\w-]+)+`,
    ].join('|'),
    'gi',
  ),
  localPath: /[A-Za-z]:\\(?:Users|Usuarios)\\[^\\\s"'`]+|\/(?:home|Users)\/[A-Za-z0-9._-]+\//g,
  placeholder: /\b(?:lorem ipsum|todo:|tbd\b|xxx+\b|your[-_ ]name|changeme)/gi,
};

export const isTextPath = (path) => TEXT_EXTENSIONS.has(extensionOf(path));

function extensionOf(path) {
  const base = path.slice(path.lastIndexOf('/') + 1);
  if (base === '.gitkeep') return '.gitkeep';
  const index = base.lastIndexOf('.');
  return index <= 0 ? '' : base.slice(index).toLowerCase();
}

const stripLeadingSlash = (path) => path.replace(/^\//, '');
const hostOf = (url) => {
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
};

/** Reconstruye «usuario@dominio» a partir de un correo ofuscado y devuelve el dominio en minúsculas. */
function deobfuscatedDomain(match) {
  const rebuilt = match
    .toLowerCase()
    .replace(/%40|&#0*64;|&commat;/g, '@')
    .replace(/\s*[[({<]\s*(?:at|arroba)\s*[\])}>]\s*|\s+(?:arroba|at)\s+/g, '@')
    .replace(/\s*[[({<]?\s*(?:dot|punto)\s*[\])}>]?\s*/g, '.')
    .replace(/\s+/g, '');
  return rebuilt.split('@')[1] ?? '';
}

const hasMatch = (pattern, text) => text.search(pattern) !== -1;

/**
 * Datos personales / sensibles presentes en un texto (heurística: ver PATTERNS).
 * @param {string} text
 * @returns {string[]} tipos distintos encontrados
 */
export function findPersonalData(text) {
  const found = [];
  for (const match of text.matchAll(PATTERNS.email)) {
    const domain = match[0].split('@')[1]?.toLowerCase() ?? '';
    if (!ALLOWED_EMAIL_DOMAINS.has(domain)) found.push('dirección de correo');
  }
  for (const match of text.matchAll(PATTERNS.obfuscatedEmail)) {
    if (!ALLOWED_EMAIL_DOMAINS.has(deobfuscatedDomain(match[0]))) {
      found.push('dirección de correo ofuscada');
    }
  }
  if (
    hasMatch(PATTERNS.phone, text) ||
    hasMatch(PATTERNS.chileMobile, text) ||
    hasMatch(PATTERNS.landline, text)
  ) {
    found.push('número de teléfono');
  }
  if (hasMatch(PATTERNS.rut, text) || hasMatch(PATTERNS.rutLoose, text)) found.push('RUT');
  if (hasMatch(PATTERNS.localPath, text)) found.push('ruta local del equipo');
  return [...new Set(found)];
}

function checkResume(resume, add) {
  const t = TIERS.structural;
  if (!/^\/cv\/[a-z0-9][a-z0-9-]*\.pdf$/.test(resume.path ?? '')) {
    add(t, `Ruta de currículum inválida: ${String(resume.path)}`);
  }
  if (resume.language !== 'es' && resume.language !== 'en') {
    add(t, 'El currículum requiere language "es" o "en".');
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(resume.updatedAt ?? '')) {
    add(t, 'El currículum requiere updatedAt (AAAA-MM-DD).');
  }
  if (!Number.isInteger(resume.pages) || resume.pages < 1) {
    add(t, 'El currículum requiere pages (entero ≥ 1, número de páginas verificado).');
  }
}

function checkTracked(trackedFiles, allowedPdfs, add) {
  const t = TIERS.structural;
  for (const file of trackedFiles) {
    const path = file.path.replace(/\\/g, '/');
    const lower = path.toLowerCase();
    const ext = extensionOf(path);
    if (lower.startsWith('private/')) add(t, `Archivo privado versionado: ${path}`);
    if (/(^|\/)\.env(\.|$)/.test(lower) && !lower.endsWith('.env.example')) {
      add(t, `Archivo de entorno versionado: ${path}`);
    }
    const basename = path.slice(path.lastIndexOf('/') + 1);
    if (TRACKED_FORBIDDEN_EXTENSIONS.has(ext)) {
      add(t, `Tipo de archivo prohibido versionado: ${path}`);
    } else if (ext === '.pdf') {
      const ok = [...allowedPdfs.keys()].some((allowed) => `public/${allowed}` === path);
      if (!ok)
        add(TIERS.pdf, `PDF versionado sin autorización (quedaría en el historial): ${path}`);
    } else if (REVIEWED_BINARIES.has(path)) {
      const signature = REVIEWED_BINARIES.get(path) ?? '';
      if (file.head !== undefined && !file.head.startsWith(signature)) {
        add(t, `El binario revisado ${path} no tiene la firma de archivo esperada.`);
      }
    } else if (!ALLOWED_TRACKED_EXTENSIONS.has(ext) && !ALLOWED_TRACKED_BASENAMES.has(basename)) {
      add(
        t,
        `Archivo versionado fuera de la política de formatos autorizados: ${path} ` +
          '(los binarios y formatos nuevos requieren revisión expresa y alta en la guardia).',
      );
    }
    if (file.content !== undefined && !/(^|\/)package-lock\.json$/.test(path)) {
      for (const kind of findPersonalData(file.content)) {
        add(t, `Posible dato personal (${kind}) en archivo versionado: ${path}`);
      }
    }
    if (/^\.github\/workflows\/[^/]+\.ya?ml$/.test(path) && file.content !== undefined) {
      checkWorkflow(path, file.content, add);
    }
  }
}

/** Reglas mínimas de seguridad de los workflows de GitHub Actions (no despliegan, sin secretos). */
function checkWorkflow(path, content, add) {
  const t = TIERS.structural;
  for (const match of content.matchAll(/^\s*-?\s*uses:\s*(\S+)/gm)) {
    const reference = match[1] ?? '';
    if (reference.startsWith('./')) continue;
    if (!/@[0-9a-f]{40}$/.test(reference)) {
      add(t, `Acción sin fijar por SHA de commit en ${path}: ${reference}`);
    }
  }
  if (!/^permissions:/m.test(content))
    add(t, `${path} debe declarar "permissions:" (mínimo privilegio).`);
  if (/pull_request_target/.test(content))
    add(t, `${path} usa pull_request_target (no permitido).`);
  if (/\$\{\{\s*secrets\./.test(content))
    add(t, `${path} referencia secretos (no permitido: sin despliegues).`);
  if (/:\s*write\b/.test(content)) add(t, `${path} concede permisos de escritura (no permitido).`);
  // Se ignoran comentarios y nombres de pasos (pueden mencionar vercel.json); se inspeccionan
  // los comandos y las acciones.
  const executable = content.replace(/^\s*#.*$/gm, '').replace(/^\s*(-\s*)?name:.*$/gm, '');
  if (/\b(vercel(?!\.json)|deploy)\b|--prod\b/i.test(executable)) {
    add(t, `${path} parece desplegar (no permitido: el CI no despliega).`);
  }
}

function checkDist(distFiles, allowedPdfs, add, extraHosts) {
  const distPaths = new Set(distFiles.map((f) => f.path));
  for (const file of distFiles) {
    const lower = file.path.toLowerCase();
    const ext = extensionOf(file.path);
    if (lower.endsWith('.map'))
      add(TIERS.dist, `Mapa de código fuente publicado: dist/${file.path}`);
    else if (!DIST_ALLOWED_EXTENSIONS.has(ext)) {
      add(TIERS.dist, `Tipo de archivo no permitido en dist/: ${file.path}`);
    }
    if (lower.startsWith('private/'))
      add(TIERS.structural, `Carpeta privada publicada: dist/${file.path}`);
    if (ext === '.pdf' && !allowedPdfs.has(file.path)) {
      add(
        TIERS.pdf,
        `PDF no autorizado en dist/: ${file.path} (el CV no está habilitado en resume.json)`,
      );
    }
    if (lower.startsWith('cv/') && ext !== '.pdf' && ext !== '.gitkeep') {
      add(TIERS.pdf, `Archivo inesperado en dist/cv/: ${file.path}`);
    }
    const content = file.content;
    if (content === undefined) continue;
    if (/\/[*/][#@] sourceMappingURL=/.test(content)) {
      add(TIERS.dist, `Referencia a source map en dist/${file.path}`);
    }
    for (const kind of findPersonalData(content)) {
      add(TIERS.structural, `Posible dato personal (${kind}) en dist/${file.path}`);
    }
    // URLs externas no previstas. En un PDF las URL son identificadores de espacios de nombres
    // XMP (p. ej. purl.org, ns.adobe.com), no solicitudes de red: se revisan aparte.
    if (ext === '.pdf') {
      if (/mailto:|tel:/i.test(content)) {
        add(TIERS.pdf, `El PDF ${file.path} contiene enlaces mailto: o tel:.`);
      }
      continue;
    }
    for (const match of content.matchAll(/https?:\/\/[A-Za-z0-9.-]+(?::\d+)?/g)) {
      const host = hostOf(match[0]);
      if (host && !ALLOWED_DIST_HOSTS.has(host) && !extraHosts.has(host)) {
        add(TIERS.dist, `Host externo no permitido en dist/${file.path}: ${host}`);
      }
    }
    if (file.path === 'index.html') {
      if (/(mailto:|tel:)/i.test(content))
        add(TIERS.dist, 'dist/index.html contiene mailto: o tel:.');
      if (
        /<script(?![^>]*\bsrc=)[^>]*>/i.test(content) &&
        !/type=["']application\/(ld\+)?json["']/i.test(content)
      ) {
        add(TIERS.dist, 'dist/index.html contiene un <script> en línea (incompatible con la CSP).');
      }
      if (/<style[\s>]/i.test(content))
        add(TIERS.dist, 'dist/index.html contiene <style> en línea (incompatible con la CSP).');
      if (/\son[a-z]+\s*=/i.test(content))
        add(TIERS.dist, 'dist/index.html contiene manejadores de eventos en línea.');
      if (/\sstyle\s*=/i.test(content))
        add(TIERS.dist, 'dist/index.html contiene atributos style en línea.');
    }
  }
  for (const [path] of allowedPdfs) {
    const entry = distFiles.find((f) => f.path === path);
    if (!entry) {
      add(TIERS.pdf, `CV habilitado sin archivo: falta public/${path}`);
      continue;
    }
    if (entry.head !== undefined && !entry.head.startsWith('%PDF-')) {
      add(TIERS.pdf, `El archivo ${path} no tiene cabecera PDF válida.`);
    }
    if (entry.size !== undefined && entry.size > 5_000_000) {
      add(TIERS.pdf, `El archivo ${path} supera 5 MB.`);
    }
  }
  return distPaths;
}

/** Autor permitido en los metadatos del PDF: el nombre público ya incluido en el portafolio. */
export const PUBLIC_PDF_AUTHOR = 'Michael Roudergue';

function checkPdfMetadata(distFiles, allowedPdfs, add, warn) {
  for (const [path] of allowedPdfs) {
    const entry = distFiles.find((f) => f.path === path);
    if (entry?.content === undefined) continue;
    const pdf = inspectPdf(Buffer.from(entry.content, 'latin1'));
    const present = [];
    if (pdf.info.author !== undefined && pdf.info.author !== PUBLIC_PDF_AUTHOR)
      present.push('/Author');
    for (const [key, field] of [
      ['creator', '/Creator'],
      ['producer', '/Producer'],
      ['subject', '/Subject'],
      ['keywords', '/Keywords'],
    ]) {
      if (pdf.info[key] !== undefined) present.push(field);
    }
    if (pdf.xmpSoftware) present.push('XMP (software)');
    if (present.length > 0) {
      warn(
        `Revisar metadatos del PDF ${path}: ${present.join(', ')} (eliminar autor/software/rutas antes de publicar).`,
      );
    }
    for (const kind of findPersonalData(pdf.metadataText)) {
      add(TIERS.pdf, `Posible dato personal (${kind}) en los metadatos del PDF ${path}`);
    }
  }
}

/**
 * Texto extraíble del PDF habilitado (requisito ATS): debe existir, no contener datos personales
 * y coincidir con el número de páginas declarado. Si no se puede extraer, se informa como
 * limitación (no se asume que el PDF esté limpio).
 */
/**
 * Problemas de fiabilidad e integridad de un PDF inspeccionado (fallo seguro): estructuras no
 * analizables, contenido activo o adjuntos, páginas con texto insuficiente y enlaces no autorizados.
 * @param {import('./pdf-text.mjs').PdfInspection} pdf
 * @returns {string[]}
 */
export function pdfIntegrityIssues(pdf) {
  const issues = [];
  for (const limitation of pdf.limitations) {
    issues.push(`Verificación no fiable (el PDF se trata como no verificado): ${limitation}`);
  }
  if (pdf.activeContent.length > 0) {
    issues.push(`Contenido activo o adjuntos en el PDF: ${pdf.activeContent.join(', ')}.`);
  }
  pdf.pageTexts.forEach((pageText, index) => {
    const length = pageText.replace(/\s/g, '').length;
    if (length < MIN_PAGE_TEXT_CHARS) {
      issues.push(
        `Página ${String(index + 1)} con texto insuficiente (${String(length)} caracteres; mínimo ${String(MIN_PAGE_TEXT_CHARS)}).`,
      );
    }
  });
  for (const uri of pdf.uris) {
    if (!ALLOWED_PROFILE_URLS.includes(uri)) issues.push(`Enlace del PDF no permitido: ${uri}`);
  }
  return issues;
}

function checkPdfContent(distFiles, allowedPdfs, add) {
  for (const [path, resume] of allowedPdfs) {
    const entry = distFiles.find((f) => f.path === path);
    if (entry?.content === undefined) continue;
    const pdf = inspectPdf(Buffer.from(entry.content, 'latin1'));
    if (pdf.encrypted)
      add(TIERS.pdf, `El PDF ${path} está cifrado: no se puede verificar su contenido.`);
    for (const issue of pdfIntegrityIssues(pdf)) add(TIERS.pdf, `${path}: ${issue}`);
    if (pdf.pages > 0 && pdf.pages !== resume.pages) {
      add(
        TIERS.pdf,
        `El PDF ${path} tiene ${String(pdf.pages)} páginas y resume.json declara ${String(resume.pages)}.`,
      );
    }
    if (pdf.text.replace(/\s/g, '').length < 200) {
      add(
        TIERS.pdf,
        `No se pudo extraer texto suficiente de ${path} (¿PDF de imágenes o fuentes sin mapa Unicode?): debe ser texto seleccionable y compatible con ATS.`,
      );
      continue;
    }
    for (const kind of findPersonalData(pdf.text)) {
      add(TIERS.pdf, `Posible dato personal (${kind}) en el texto del PDF ${path}`);
    }
  }
}

function checkMetadata(distFiles, siteUrl, add) {
  const t = TIERS.meta;
  const get = (path) => distFiles.find((f) => f.path === path)?.content;
  const html = get('index.html');
  if (html === undefined) {
    add(t, 'Falta dist/index.html.');
    return;
  }
  if (!/<html[^>]*\blang=["'](es|en)["']/i.test(html))
    add(t, 'El elemento <html> debe declarar lang="es" o "en".');
  const title = /<title>([^<]*)<\/title>/i.exec(html)?.[1]?.trim() ?? '';
  if (title.length < 10 || title.length > 70)
    add(t, `El <title> debe tener entre 10 y 70 caracteres (tiene ${String(title.length)}).`);
  const description =
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i.exec(html)?.[1] ?? '';
  if (description.length < 50 || description.length > 170) {
    add(
      t,
      `La meta description debe tener entre 50 y 170 caracteres (tiene ${String(description.length)}).`,
    );
  }
  if (!/<meta[^>]*name=["']viewport["']/i.test(html)) add(t, 'Falta meta viewport.');
  if (!/<meta[^>]*charset=/i.test(html)) add(t, 'Falta meta charset.');
  if (/<meta[^>]*name=["']robots["'][^>]*noindex/i.test(html))
    add(t, 'index.html contiene noindex (el sitio debe ser indexable).');
  for (const property of ['og:title', 'og:description', 'og:type', 'og:site_name']) {
    if (!new RegExp(`<meta[^>]*property=["']${property}["']`, 'i').test(html))
      add(t, `Falta la metaetiqueta ${property}.`);
  }
  if (!/<meta[^>]*name=["']twitter:card["']/i.test(html)) add(t, 'Falta twitter:card.');
  if (!/<link[^>]*rel=["']icon["']/i.test(html)) add(t, 'Falta el favicon (<link rel="icon">).');

  // Rutas locales referenciadas por index.html
  const paths = new Set(distFiles.map((f) => f.path));
  for (const match of html.matchAll(/(?:href|src)=["']\/([^"'#?]+)["']/g)) {
    const ref = match[1];
    if (ref && !paths.has(ref)) add(t, `index.html referencia un archivo inexistente: /${ref}`);
  }

  // canonical / robots / sitemap coherentes con SITE_URL (no se inventa dominio)
  const canonical = /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i.exec(html)?.[1];
  const ogUrl = /<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']*)["']/i.exec(html)?.[1];
  const robots = get('robots.txt');
  const sitemap = get('sitemap.xml');
  if (robots === undefined) add(t, 'Falta dist/robots.txt.');
  else {
    if (!/^User-agent:/im.test(robots)) add(t, 'robots.txt sin User-agent.');
    if (/^Disallow:\s*\/\s*$/im.test(robots))
      add(t, 'robots.txt bloquea todo el sitio (Disallow: /).');
  }
  if (siteUrl) {
    if (!/^https:\/\/[^/?#]+\/?$/.test(siteUrl))
      add(t, `SITE_URL debe ser un origen https sin ruta (recibido: ${siteUrl}).`);
    const origin = siteUrl.replace(/\/$/, '');
    if (canonical !== `${origin}/`)
      add(t, 'Con SITE_URL, index.html debe incluir canonical igual a la URL del sitio.');
    if (ogUrl !== `${origin}/`)
      add(t, 'Con SITE_URL, index.html debe incluir og:url igual a la URL del sitio.');
    if (sitemap === undefined || !sitemap.includes(`<loc>${origin}/</loc>`))
      add(t, 'Con SITE_URL debe existir sitemap.xml con la URL del sitio.');
    if (robots !== undefined && !robots.includes(`Sitemap: ${origin}/sitemap.xml`))
      add(t, 'Con SITE_URL, robots.txt debe indicar el sitemap.');
  } else {
    if (canonical !== undefined || ogUrl !== undefined)
      add(t, 'canonical/og:url presentes sin SITE_URL (no se debe inventar el dominio).');
    if (sitemap !== undefined)
      add(t, 'sitemap.xml presente sin SITE_URL (no se debe inventar el dominio).');
    if (robots !== undefined && /^Sitemap:/im.test(robots))
      add(t, 'robots.txt indica un sitemap sin SITE_URL.');
  }
}

function flattenKeys(value, prefix = '') {
  if (typeof value !== 'object' || value === null) return [[prefix, value]];
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

function checkAuthorizedContent({ locales, profileUrls, trackedFiles }, add) {
  const t = TIERS.content;
  if (locales) {
    const es = new Map(flattenKeys(locales.es));
    const en = new Map(flattenKeys(locales.en));
    for (const key of es.keys())
      if (!en.has(key)) add(t, `Clave de i18n sin traducción al inglés: ${key}`);
    for (const key of en.keys())
      if (!es.has(key)) add(t, `Clave de i18n sin traducción al español: ${key}`);
    for (const [lang, map] of [
      ['es', es],
      ['en', en],
    ]) {
      for (const [key, value] of map) {
        if (typeof value !== 'string' || value.trim() === '')
          add(t, `Texto vacío o no textual (${lang}): ${key}`);
        else if (new RegExp(PATTERNS.placeholder.source, 'i').test(value))
          add(t, `Marcador de posición en ${lang}: ${key}`);
        else
          for (const kind of findPersonalData(value))
            add(t, `Posible dato personal (${kind}) en ${lang}: ${key}`);
      }
    }
  }
  if (profileUrls) {
    for (const url of profileUrls) {
      if (!ALLOWED_PROFILE_URLS.includes(url))
        add(t, `Enlace externo no autorizado en los datos de contacto: ${url}`);
    }
    for (const allowed of ALLOWED_PROFILE_URLS) {
      if (!profileUrls.includes(allowed)) add(t, `Falta un perfil público confirmado: ${allowed}`);
    }
  }
  // URLs externas en código fuente (excluye pruebas y bloqueos de dependencias)
  for (const file of trackedFiles ?? []) {
    const path = file.path.replace(/\\/g, '/');
    // Solo código y recursos propios: se excluyen pruebas y textos de licencias de terceros (.txt/.md).
    if (!/^(src|public)\/.+\.(?:[cm]?[jt]sx?|json|css|html|svg)$/.test(path)) continue;
    if (/\.test\.[tj]sx?$/.test(path) || file.content === undefined) continue;
    for (const match of file.content.matchAll(/https?:\/\/[A-Za-z0-9.-]+[^\s"'`)]*/g)) {
      const url = match[0];
      const host = hostOf(url);
      if (host === 'www.w3.org' || host === null) continue;
      if (!ALLOWED_PROFILE_URLS.some((allowed) => url.startsWith(allowed))) {
        add(t, `URL externa no prevista en ${path}: ${host}`);
      }
    }
  }
}

/**
 * Evaluación pura (sin E/S) para poder probarla.
 * @param {{
 *   resume: { path: string, available: boolean, language?: string, updatedAt?: string, pages?: number },
 *   distFiles: { path: string, content?: string, size?: number, head?: string }[],
 *   trackedFiles: { path: string, content?: string }[] | null,
 *   denylist?: string[] | null,
 *   locales?: { es: object, en: object },
 *   profileUrls?: string[],
 *   siteUrl?: string,
 *   strictPrivate?: boolean,
 * }} input  Rutas de `distFiles` relativas a dist/ con "/".
 * @returns {{ errors: string[], warnings: string[], limitations: string[], privateReviewComplete: boolean }}
 */
export function evaluatePublication({
  resume,
  distFiles,
  trackedFiles,
  denylist = null,
  locales,
  profileUrls,
  siteUrl,
  strictPrivate = false,
}) {
  const errors = [];
  const warnings = [];
  const limitations = [];
  const add = (tier, message) => errors.push(`[${tier}] ${message}`);
  const allowedPdfs = new Map(resume.available ? [[stripLeadingSlash(resume.path), resume]] : []);

  checkResume(resume, add);
  if (trackedFiles === null) {
    limitations.push(
      'No se pudo leer la lista de archivos versionados (¿sin git?): se omitieron las comprobaciones del repositorio.',
    );
  } else {
    checkTracked(trackedFiles, allowedPdfs, add);
  }
  checkDist(distFiles, allowedPdfs, add, new Set(siteUrl ? [hostOf(siteUrl)] : []));
  checkPdfMetadata(distFiles, allowedPdfs, add, (message) =>
    warnings.push(`[${TIERS.pdf}] ${message}`),
  );
  checkPdfContent(distFiles, allowedPdfs, add);
  checkMetadata(distFiles, siteUrl, add);
  checkAuthorizedContent({ locales, profileUrls, trackedFiles }, add);

  // Revisión privada (solo local)
  const terms = (denylist ?? [])
    .map((term) => term.trim())
    .filter((term) => term !== '' && !term.startsWith('#'));
  let privateReviewComplete = false;
  if (terms.length === 0) {
    const message =
      'La revisión PRIVADA no se ejecutó (falta private/denylist.txt): la revisión de privacidad está INCOMPLETA. ' +
      'Solo se aplicaron los controles estructurales y de contenido autorizado.';
    if (strictPrivate) add(TIERS.private, message);
    else limitations.push(message);
  } else {
    privateReviewComplete = trackedFiles !== null;
    const scan = (label, files) => {
      for (const file of files) {
        if (file.content === undefined) continue;
        const haystack = file.content.toLowerCase();
        if (terms.some((term) => haystack.includes(term.toLowerCase()))) {
          add(
            TIERS.private,
            `Frase no autorizada en ${label}: ${file.path} (coincide con la lista privada)`,
          );
        }
      }
    };
    scan('dist/', distFiles);
    // El texto de un PDF está codificado por glifos: se compara el texto extraído, no los bytes.
    scan(
      'el texto del PDF',
      [...allowedPdfs.keys()].flatMap((path) => {
        const entry = distFiles.find((f) => f.path === path);
        return entry?.content === undefined
          ? []
          : [{ path, content: inspectPdf(Buffer.from(entry.content, 'latin1')).text }];
      }),
    );
    scan('el código versionado', trackedFiles ?? []);
    if (trackedFiles === null)
      limitations.push('La revisión privada no pudo recorrer el código versionado (sin git).');
  }

  return { errors, warnings, limitations, privateReviewComplete };
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = join(directory, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function readIfText(path) {
  return isTextPath(path) ? readFileSync(path, 'utf8') : undefined;
}

function readDistEntry(full, distRoot) {
  const path = relative(distRoot, full).split(sep).join('/');
  const size = statSync(full).size;
  if (path.toLowerCase().endsWith('.pdf')) {
    const buffer = readFileSync(full);
    return {
      path,
      size,
      head: buffer.subarray(0, 8).toString('latin1'),
      content: size < 8_000_000 ? buffer.toString('latin1') : undefined,
    };
  }
  return { path, size, content: readIfText(full) };
}

function listTrackedFiles(root) {
  try {
    const output = execFileSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' });
    return output
      .split('\0')
      .filter(Boolean)
      .map((path) => {
        const full = join(root, path);
        const ok = existsSync(full) && statSync(full).isFile() && statSync(full).size < 2_000_000;
        const head =
          ok && !isTextPath(path)
            ? readFileSync(full).subarray(0, 8).toString('latin1')
            : undefined;
        return { path, content: ok ? readIfText(full) : undefined, head };
      });
  } catch {
    return null;
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function runCheck({
  root = process.cwd(),
  distDir = 'dist',
  strictPrivate = false,
  siteUrl,
  denylistPath: explicitDenylist,
} = {}) {
  const dist = resolve(root, distDir);
  if (!existsSync(dist)) {
    return {
      errors: [`[${TIERS.dist}] No existe ${distDir}/: ejecuta primero "npm run build".`],
      warnings: [],
      limitations: [],
      privateReviewComplete: false,
    };
  }
  const resume = readJson(join(root, 'src', 'data', 'resume.json'));
  const locales = {
    es: readJson(join(root, 'src', 'i18n', 'locales', 'es.json')),
    en: readJson(join(root, 'src', 'i18n', 'locales', 'en.json')),
  };
  const contactSource = readFileSync(join(root, 'src', 'data', 'contact.ts'), 'utf8');
  const profileUrls = [...contactSource.matchAll(/url:\s*'(https:\/\/[^']+)'/g)].map((m) => m[1]);
  const denylistPath = explicitDenylist ?? join(root, 'private', 'denylist.txt');
  return evaluatePublication({
    resume,
    distFiles: walk(dist).map((full) => readDistEntry(full, dist)),
    trackedFiles: listTrackedFiles(root),
    denylist: existsSync(denylistPath) ? readFileSync(denylistPath, 'utf8').split(/\r?\n/) : null,
    locales,
    profileUrls,
    siteUrl: siteUrl ?? process.env.SITE_URL,
    strictPrivate,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  // --root=<ruta>: revisa otro árbol (p. ej. la instantánea de publicación) con ESTOS scripts.
  // --denylist=<ruta>: lista privada fuera de ese árbol (no hace falta copiarla a la instantánea).
  const option = (name) =>
    process.argv.map((a) => new RegExp(`^--${name}=(.+)$`).exec(a)?.[1]).find(Boolean);
  const root = resolve(option('root') ?? fileURLToPath(new URL('..', import.meta.url)));
  const denylistPath = option('denylist');
  const strictPrivate = process.argv.includes('--strict-private');
  const { errors, warnings, limitations, privateReviewComplete } = runCheck({
    root,
    strictPrivate,
    ...(denylistPath === undefined ? {} : { denylistPath: resolve(denylistPath) }),
  });
  for (const warning of warnings) console.warn(`⚠  ${warning}`);
  for (const limitation of limitations) console.warn(`ℹ  LIMITACIÓN: ${limitation}`);
  if (errors.length > 0) {
    console.error('\n✖ Verificación de publicación FALLIDA:');
    for (const error of errors) console.error(`  - ${error}`);
    console.error('\nVer docs/PUBLICACION.md.');
    process.exit(1);
  }
  console.log(
    '✔ Controles estructurales, de PDF, de dist/, de metadatos y de contenido autorizado: correctos.',
  );
  console.log(
    privateReviewComplete
      ? '✔ Revisión privada local ejecutada sin coincidencias.'
      : '⚠ Revisión de privacidad INCOMPLETA: no se ejecutó la revisión privada (ver LIMITACIÓN).',
  );
}

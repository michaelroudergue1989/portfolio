/**
 * Verifica un PDF de currículum ANTES de publicarlo (solo lectura; no modifica nada).
 *
 *   npm run verify:cv -- private/cv-candidato/michael-roudergue-cv.pdf
 *
 * Comprueba: cabecera PDF y tamaño, sin cifrado, páginas (contra src/data/resume.json), texto
 * extraíble (ATS), ausencia de datos personales (correo, teléfono, RUT, rutas locales) y de las
 * frases de la lista privada local, metadatos mínimos e idioma declarado del documento.
 * Sale con código 1 si hay errores. Los avisos no fallan, pero deben revisarse.
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { findPersonalData, pdfIntegrityIssues, PUBLIC_PDF_AUTHOR } from './check-publication.mjs';
import { inspectPdf } from './pdf-text.mjs';

/**
 * @param {Uint8Array} input
 * @param {{ pages?: number, language?: string, denylist?: string[] | null }} [options]
 * @returns {{ errors: string[], warnings: string[], facts: Record<string, string | number | boolean> }}
 */
export function verifyCv(input, { pages, language, denylist = null } = {}) {
  const buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  const errors = [];
  const warnings = [];
  const pdf = inspectPdf(buffer);
  const raw = buffer.toString('latin1');
  const facts = { bytes: buffer.length, pages: pdf.pages, textCharacters: pdf.text.length };

  if (!pdf.isPdf) errors.push('El archivo no tiene cabecera %PDF-.');
  if (buffer.length > 5_000_000) errors.push('El PDF supera 5 MB.');
  if (pdf.encrypted) errors.push('El PDF está cifrado: no se puede verificar su contenido.');
  if (pages !== undefined && pdf.pages !== pages) {
    errors.push(
      `El PDF tiene ${String(pdf.pages)} páginas y resume.json declara ${String(pages)}.`,
    );
  }

  if (pdf.text.replace(/\s/g, '').length < 200) {
    errors.push(
      'No se pudo extraer texto suficiente: debe ser texto seleccionable (compatible con ATS).',
    );
  }
  for (const kind of findPersonalData(pdf.text)) {
    errors.push(`Posible dato personal (${kind}) en el texto extraído.`);
  }
  for (const kind of findPersonalData(raw)) {
    errors.push(
      `Posible dato personal (${kind}) en los bytes del archivo (metadatos o anotaciones).`,
    );
  }
  for (const kind of findPersonalData(pdf.metadataText)) {
    errors.push(`Posible dato personal (${kind}) en los metadatos.`);
  }
  // Fallo seguro: estructuras no analizables, contenido activo, páginas con poco texto y enlaces
  // que no sean exactamente los perfiles públicos permitidos (https únicamente).
  errors.push(...pdfIntegrityIssues(pdf));
  if (/mailto:|tel:/i.test(raw)) {
    errors.push('El PDF contiene un enlace mailto: o tel:.');
  }
  facts.linkAnnotations = pdf.uris.length;
  if (/\/Subtype\s*\/Image\b/.test(raw)) {
    warnings.push('El PDF contiene imágenes: comprobar que no incluyan texto ni datos personales.');
  }

  if (denylist !== null) {
    const terms = denylist.map((l) => l.trim()).filter((l) => l !== '' && !l.startsWith('#'));
    const haystack = `${pdf.text}\n${pdf.metadataText}`.toLowerCase();
    const hits = terms.filter((term) => haystack.includes(term.toLowerCase())).length;
    if (hits > 0) errors.push(`${String(hits)} frase(s) de la lista privada presentes en el PDF.`);
    facts.privateTermsChecked = terms.length;
  } else {
    warnings.push('Sin private/denylist.txt: no se pudo ejecutar la revisión de frases privadas.');
  }

  const { author, creator, producer, subject, keywords } = pdf.info;
  if (author !== undefined && author !== PUBLIC_PDF_AUTHOR)
    warnings.push(`Autor en metadatos: "${author}".`);
  for (const [name, value] of Object.entries({ creator, producer, subject, keywords })) {
    if (value !== undefined) warnings.push(`Metadato ${name} presente: "${value}".`);
  }
  if (pdf.xmpSoftware) warnings.push('El XMP declara software de creación (CreatorTool/Producer).');
  if (/\b(2013|1970|2000)-\d{2}-\d{2}T/.test(pdf.metadataText)) {
    warnings.push('Fechas de plantilla (p. ej. 2013) en el XMP: revisar CreateDate/ModifyDate.');
  }

  const lang = /\/Lang\s*\(([^)]*)\)/.exec(raw)?.[1];
  facts.declaredLanguage = lang ?? '(ninguno)';
  if (language !== undefined && (lang === undefined || !lang.toLowerCase().startsWith(language))) {
    warnings.push(
      `El idioma del documento (/Lang ${lang ?? 'ausente'}) no coincide con "${language}".`,
    );
  }
  return { errors, warnings, facts };
}

function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Uso: npm run verify:cv -- <ruta-al-pdf>');
    process.exit(2);
  }
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
  const file = resolve(process.cwd(), target);
  if (!existsSync(file) || !statSync(file).isFile()) {
    console.error(`No existe el archivo: ${target}`);
    process.exit(2);
  }
  const manifest = JSON.parse(readFileSync(join(root, 'src', 'data', 'resume.json'), 'utf8'));
  const denylistPath = join(root, 'private', 'denylist.txt');
  const result = verifyCv(readFileSync(file), {
    pages: manifest.pages,
    language: manifest.language,
    denylist: existsSync(denylistPath) ? readFileSync(denylistPath, 'utf8').split(/\r?\n/) : null,
  });
  console.log('Hechos:', JSON.stringify(result.facts));
  for (const warning of result.warnings) console.warn(`AVISO: ${warning}`);
  for (const error of result.errors) console.error(`ERROR: ${error}`);
  if (result.errors.length > 0) process.exit(1);
  console.log('✔ El PDF supera las comprobaciones automáticas (no sustituye la revisión humana).');
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();

/**
 * Genera un PDF mínimo de prueba (sin compresión) con texto extraíble mediante /ToUnicode,
 * para probar la inspección de PDF y la guardia sin depender de archivos reales.
 * Devuelve el contenido como cadena latin1 (como lo lee la guardia).
 */
export interface FixtureOptions {
  /** Texto de cada página (por defecto, dos páginas de texto genérico). */
  pages?: string[];
  /** Entradas del diccionario Info, p. ej. `{ Author: 'Alguien' }`. */
  info?: Record<string, string>;
  /** Contenido XMP completo (opcional). */
  xmp?: string;
  /** Omite el mapa /ToUnicode (el texto no será extraíble). */
  withoutToUnicode?: boolean;
  /** Destinos de anotaciones de enlace (URI) añadidas a la primera página. */
  links?: string[];
}

const FILLER =
  'Ingeniero en Informática con experiencia en análisis, desarrollo y mantenimiento de sistemas institucionales. ' +
  'Coordinación técnica, pruebas, documentación y capacitación de usuarios en proyectos de software.';

export const DEFAULT_PAGES = [FILLER, FILLER];

export function buildPdf({
  pages = DEFAULT_PAGES,
  info,
  xmp,
  withoutToUnicode = false,
  links = [],
}: FixtureOptions = {}): string {
  const chars = Array.from(new Set(pages.join('')));
  const code = new Map(chars.map((ch, i) => [ch, i + 1]));
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  const cmap = [
    '/CIDInit /ProcSet findresource begin 12 dict begin begincmap',
    `${String(chars.length)} beginbfchar`,
    ...chars.map(
      (ch) =>
        `<${hex(code.get(ch) ?? 0)}> <${(ch.codePointAt(0) ?? 0).toString(16).padStart(4, '0')}>`,
    ),
    'endbfchar endcmap end end',
  ].join('\n');

  const objects: (string | undefined)[] = [];
  const stream = (dict: string, body: string) =>
    `<<${dict}/Length ${String(body.length)}>>\nstream\n${body}\nendstream`;
  // 1: catálogo, 2: páginas, 3: fuente, 4: ToUnicode, 5: Info, 6: XMP, 7+: páginas y contenidos
  const pageIds = pages.map((_, i) => 7 + i * 2);
  objects[1] = `<</Type/Catalog/Pages 2 0 R${xmp ? ' /Metadata 6 0 R' : ''}>>`;
  objects[2] = `<</Type/Pages/Count ${String(pages.length)}/Kids[${pageIds.map((id) => `${String(id)} 0 R`).join(' ')}]>>`;
  objects[3] = `<</Type/Font/Subtype/TrueType/BaseFont/Prueba${withoutToUnicode ? '' : ' /ToUnicode 4 0 R'}>>`;
  objects[4] = stream('', cmap);
  objects[5] = `<<${Object.entries(info ?? {})
    .map(([key, value]) => (value.startsWith('<') ? `/${key}${value}` : `/${key}(${value})`))
    .join('')}>>`;
  objects[6] = stream('/Type/Metadata/Subtype/XML', xmp ?? '');
  pages.forEach((text, i) => {
    const id = 7 + i * 2;
    const shown = Array.from(text)
      .map((ch) => hex(code.get(ch) ?? 0))
      .join('');
    const annots =
      i === 0 && links.length > 0
        ? `/Annots[${links.map((_, k) => `${String(100 + k)} 0 R`).join(' ')}]`
        : '';
    objects[id] =
      `<</Type/Page/Parent 2 0 R/Resources<</Font<</F1 3 0 R>>>>/Contents ${String(id + 1)} 0 R${annots}>>`;
    objects[id + 1] = stream('', `BT\n10 700 Td /F1 9 Tf [<${shown}>] TJ\nET`);
  });
  links.forEach((uri, k) => {
    objects[100 + k] = `<</Type/Annot/Subtype/Link/Rect[0 0 10 10]/A<</S/URI/URI(${uri})>>>>`;
  });
  const body = Array.from(objects, (object, id) => ({ object, id }))
    .filter(({ object, id }) => object !== undefined && id > 0 && (id !== 6 || xmp !== undefined))
    .map(({ object, id }) => `${String(id)} 0 obj\n${object ?? ''}\nendobj`)
    .join('\n');
  return `%PDF-1.7\n${body}\ntrailer\n<</Root 1 0 R${info ? ' /Info 5 0 R' : ''}>>\n%%EOF\n`;
}

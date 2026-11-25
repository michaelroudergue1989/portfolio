import { decodePdfString, inspectPdf } from '../../scripts/pdf-text.mjs';
import { buildPdf, DEFAULT_PAGES } from './pdfFixture';

/** Bytes latin1 de una cadena (un byte por carácter). */
const latin1 = (text: string) => Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
const inspect = (pdf: string) => inspectPdf(latin1(pdf));

/** Flujo zlib válido con un único bloque "stored" (sin compresión), sin depender de Node. */
function zlibStored(text: string): string {
  const data = latin1(text);
  let a = 1;
  let b = 0;
  for (const byte of data) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  const length = data.length;
  const header = [
    0x78,
    0x01,
    0x01,
    length & 0xff,
    length >> 8,
    ~length & 0xff,
    (~length >> 8) & 0xff,
  ];
  const adler = [(b >> 8) & 0xff, b & 0xff, (a >> 8) & 0xff, a & 0xff];
  return String.fromCharCode(...header) + text + String.fromCharCode(...adler);
}

describe('inspectPdf (extracción de texto y metadatos)', () => {
  it('extrae el texto de cada página con acentos y cuenta las páginas', () => {
    const result = inspect(buildPdf({ pages: ['Primera página: ñandú', 'Segunda página'] }));
    expect(result.isPdf).toBe(true);
    expect(result.pages).toBe(2);
    expect(result.text).toContain('Primera página: ñandú');
    expect(result.text).toContain('Segunda página');
  });

  it('no extrae texto cuando las fuentes no tienen mapa Unicode', () => {
    expect(inspect(buildPdf({ withoutToUnicode: true })).text.replace(/\s/g, '')).toBe('');
  });

  it('lee el diccionario Info del trailer, con cadenas literales y UTF-16', () => {
    const result = inspect(buildPdf({ info: { Author: 'Ana', Title: '<FEFF00480069>' } }));
    expect(result.info.author).toBe('Ana');
    expect(result.info.title).toBe('Hi');
    expect(inspect(buildPdf()).info).toEqual({});
  });

  it('detecta XMP y metadatos de software', () => {
    const plain = inspect(buildPdf({ xmp: '<x:xmpmeta><dc:title>CV</dc:title></x:xmpmeta>' }));
    expect(plain.hasXmp).toBe(true);
    expect(plain.xmpSoftware).toBe(false);
    const tool = inspect(
      buildPdf({ xmp: '<x:xmpmeta><xmp:CreatorTool>Writer</xmp:CreatorTool></x:xmpmeta>' }),
    );
    expect(tool.xmpSoftware).toBe(true);
    expect(tool.metadataText).toContain('Writer');
  });

  it('interpreta flujos comprimidos con Flate', () => {
    const plain = buildPdf({ pages: ['Texto comprimido de prueba'] });
    const content = /stream\n(BT[\s\S]*?ET)\nendstream/.exec(plain)?.[1] ?? '';
    const packed = zlibStored(content);
    const pdf = plain
      .replace(content, packed)
      .replace(
        `/Length ${String(content.length)}`,
        `/Filter/FlateDecode/Length ${String(packed.length)}`,
      );
    expect(inspect(pdf).text).toContain('Texto comprimido de prueba');
  });

  it('ignora lo que no es PDF y detecta cifrado', () => {
    expect(inspect('no soy un pdf').isPdf).toBe(false);
    expect(inspect('no soy un pdf').pages).toBe(0);
    expect(inspect(`${buildPdf()}\n<</Encrypt 9 0 R>>`).encrypted).toBe(true);
    expect(DEFAULT_PAGES.length).toBeGreaterThan(0);
  });

  it('devuelve el texto de cada página por separado y sin limitaciones en un PDF sencillo', () => {
    const result = inspect(buildPdf({ pages: ['Uno uno uno', 'Dos dos dos'] }));
    expect(result.pageTexts).toEqual(['Uno uno uno', 'Dos dos dos']);
    expect(result.limitations).toEqual([]);
    expect(result.activeContent).toEqual([]);
    expect(result.incremental).toBe(false);
  });

  it('informa como limitación lo que no puede inspeccionar de forma fiable', () => {
    const base = buildPdf();
    const joined = (pdf: string) => inspect(pdf).limitations.join('\n');
    expect(joined(buildPdf({ withoutToUnicode: true }))).toMatch(/no tiene mapa Unicode/);
    expect(
      joined(`${base}\n9 0 obj\n<</Type/ObjStm/Length 0>>\nstream\n\nendstream\nendobj`),
    ).toMatch(/objetos comprimidos/);
    expect(joined(`${base}startxref\n0\n%%EOF\nstartxref\n0\n%%EOF\n`)).toMatch(/incrementales/);
    expect(joined(base.replace('/Count 2', '/Count 5'))).toMatch(/declara 5 página/);
    const corrupt = base.replace(
      /<<\/Length (\d+)>>\nstream\nBT/,
      '<</Filter/FlateDecode/Length $1>>\nstream\nBT',
    );
    expect(joined(corrupt)).toMatch(/no se pudo descomprimir/);
  });

  it('lista contenido activo, destinos de enlace e imágenes', () => {
    const pdf = `${buildPdf({ links: ['https://example.com/a'] })}\n9 0 obj\n<</Subtype/Image/Length 0>>\nstream\n\nendstream\nendobj\n8 0 obj\n<</S/Launch>>\nendobj`;
    const result = inspect(pdf);
    expect(result.uris).toEqual(['https://example.com/a']);
    expect(result.images).toBe(1);
    expect(result.activeContent).toContain('/Launch');
  });

  it('decodePdfString maneja literales con escapes, hexadecimal y UTF-16BE', () => {
    expect(decodePdfString('(a\\(b\\)\\\\c\\101)')).toBe('a(b)\\cA');
    expect(decodePdfString('<48656C6C6F>')).toBe('Hello');
    expect(decodePdfString('<FEFF00480069>')).toBe('Hi');
  });
});

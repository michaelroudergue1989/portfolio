import { verifyCv } from '../../scripts/verify-cv.mjs';
import { buildPdf, DEFAULT_PAGES, type FixtureOptions } from './pdfFixture';

const bytes = (text: string) => Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
const run = (options: FixtureOptions = {}, extra = {}) =>
  verifyCv(bytes(buildPdf(options)), { pages: 2, language: 'es', denylist: [], ...extra });
// Datos ficticios construidos para no dejar valores literales en el repositorio.
const EMAIL = ['persona', 'dominio-real.test'].join('@');
const PHONE = ['+56', '9', '1111', '2222'].join(' ');
const first = DEFAULT_PAGES[0] ?? '';

describe('verifyCv (comprobación previa a publicar un CV)', () => {
  it('acepta un PDF con texto extraíble, páginas coherentes y sin datos personales', () => {
    const result = run({ info: { Title: 'CV', Author: 'Michael Roudergue' } });
    expect(result.errors).toEqual([]);
    expect(result.facts.pages).toBe(2);
  });

  it('rechaza correo y teléfono presentes en el texto', () => {
    const result = run({ pages: [`${first} ${EMAIL} ${PHONE}`, first] });
    expect(result.errors.join('\n')).toMatch(/dirección de correo\) en el texto/);
    expect(result.errors.join('\n')).toMatch(/número de teléfono\) en el texto/);
  });

  it('rechaza datos personales en los metadatos y en los bytes del archivo', () => {
    const result = run({ info: { Subject: `Contacto ${EMAIL}` } });
    expect(result.errors.join('\n')).toMatch(/en los metadatos/);
    expect(result.errors.join('\n')).toMatch(/en los bytes del archivo/);
  });

  it('rechaza páginas distintas de las declaradas y texto no extraíble', () => {
    expect(run({}, { pages: 3 }).errors.join('\n')).toMatch(/2 páginas y resume\.json declara 3/);
    expect(run({ withoutToUnicode: true }).errors.join('\n')).toMatch(/No se pudo extraer texto/);
  });

  it('rechaza frases de la lista privada y avisa si no hay lista', () => {
    const hit = run(
      { pages: [`${first} Término Reservado`, first] },
      { denylist: ['# nota', 'término reservado'] },
    );
    expect(hit.errors.join('\n')).toMatch(/1 frase\(s\) de la lista privada/);
    const none = run({}, { denylist: null });
    expect(none.warnings.join('\n')).toMatch(/Sin private\/denylist\.txt/);
  });

  it('avisa de autor distinto, software, idioma y fechas de plantilla', () => {
    const result = run({
      info: { Author: 'python-docx', Producer: 'Software' },
      xmp: '<x:xmpmeta><xmp:CreatorTool>Writer</xmp:CreatorTool><xmp:CreateDate>2013-12-23T23:15:00Z</xmp:CreateDate></x:xmpmeta>',
    });
    const warnings = result.warnings.join('\n');
    expect(result.errors).toEqual([]);
    expect(warnings).toMatch(/Autor en metadatos/);
    expect(warnings).toMatch(/producer presente/);
    expect(warnings).toMatch(/CreatorTool/);
    expect(warnings).toMatch(/Fechas de plantilla/);
    expect(warnings).toMatch(/idioma del documento/);
  });

  it('acepta solo enlaces a los perfiles públicos permitidos', () => {
    const ok = run({ links: ['https://www.linkedin.com/in/michael-roudergue-a69035150'] });
    expect(ok.errors).toEqual([]);
    expect(ok.facts.linkAnnotations).toBe(1);
    expect(run({ links: ['https://example.com/otro'] }).errors.join('\n')).toMatch(
      /Enlace del PDF no permitido: https:\/\/example\.com\/otro/,
    );
    expect(
      run({ links: ['http://www.linkedin.com/in/michael-roudergue-a69035150'] }).errors,
    ).toHaveLength(1);
    expect(run({ links: ['mailto:alguien'] }).errors.join('\n')).toMatch(/mailto: o tel:/);
  });

  it('falla de forma segura: páginas con poco texto, estructuras no analizables y contenido activo', () => {
    const long = first;
    expect(run({ pages: [long, 'poco'] }).errors.join('\n')).toMatch(
      /Página 2 con texto insuficiente/,
    );
    expect(run({ withoutToUnicode: true }).errors.join('\n')).toMatch(/Verificación no fiable/);
    const js = buildPdf().replace('/Type/Catalog', '/Type/Catalog/AA<</O<</S/JavaScript/JS(x)>>>>');
    expect(
      verifyCv(bytes(js), { pages: 2, language: 'es', denylist: [] }).errors.join('\n'),
    ).toMatch(/Contenido activo o adjuntos/);
  });

  it('rechaza lo que no es un PDF', () => {
    const result = verifyCv(bytes('texto plano'), { denylist: [] });
    expect(result.errors.join('\n')).toMatch(/cabecera %PDF/);
  });
});

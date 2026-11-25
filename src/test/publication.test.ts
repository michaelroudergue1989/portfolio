import manifest from '@/data/resume.json';
import {
  ALLOWED_PROFILE_URLS,
  evaluatePublication,
  findPersonalData,
  isTextPath,
  PUBLIC_PDF_AUTHOR,
  TIERS,
  type FileEntry,
  type PublicationInput,
} from '../../scripts/check-publication.mjs';
import { buildPdf, DEFAULT_PAGES, type FixtureOptions } from './pdfFixture';

const realResume = manifest as PublicationInput['resume'];
// Base de las pruebas: CV aún no habilitado (sin PDF en dist). El manifiesto real se prueba aparte.
const resume = { ...realResume, available: false };
const enabled = () => ({ ...resume, available: true });

const GOOD_HTML = `<!doctype html><html lang="es"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Portafolio profesional de ejemplo</title>
<meta name="description" content="Descripción de ejemplo para pruebas: suficientemente larga para cumplir el rango permitido por la guardia de publicación." />
<meta property="og:type" content="website" /><meta property="og:site_name" content="Ejemplo" />
<meta property="og:title" content="Ejemplo" /><meta property="og:description" content="Ejemplo" />
<meta name="twitter:card" content="summary" />
<link rel="icon" href="/favicon.svg" />
<script src="/theme-init.js"></script></head><body><div id="root"></div></body></html>`;

const cleanDist = (): FileEntry[] => [
  { path: 'index.html', content: GOOD_HTML },
  { path: 'robots.txt', content: 'User-agent: *\nAllow: /\n' },
  { path: 'favicon.svg', content: '<svg xmlns="http://www.w3.org/2000/svg"></svg>' },
  { path: 'theme-init.js', content: '(function(){})();' },
  { path: 'assets/index.js', content: 'console.log("ok")' },
  { path: 'cv/.gitkeep', content: '' },
];

// Correo ficticio construido para no dejar una dirección literal en el repositorio.
const EMAIL = ['persona', 'dominio-real.test'].join('@');
const locales = { es: { a: { b: 'uno' } }, en: { a: { b: 'one' } } };

function run(overrides: Partial<PublicationInput> = {}) {
  return evaluatePublication({
    resume,
    distFiles: cleanDist(),
    trackedFiles: [],
    locales,
    profileUrls: ALLOWED_PROFILE_URLS,
    ...overrides,
  });
}
const text = (result: { errors: string[] }) => result.errors.join('\n');

describe('guardia de publicación: caso base', () => {
  it('un dist limpio y el manifiesto real no producen errores', () => {
    expect(run().errors).toEqual([]);
  });

  it('el manifiesto real declara un único CV habilitado', () => {
    expect(realResume.path).toBe('/cv/michael-roudergue-cv.pdf');
    expect(realResume.available).toBe(true);
  });
});

describe(`nivel [${TIERS.structural}]`, () => {
  it('rechaza private/, .env, claves y tipos de archivo prohibidos versionados', () => {
    const { errors } = run({
      trackedFiles: [
        { path: 'private/notas.md' },
        { path: '.env.local' },
        { path: 'certs/server.pem' },
        { path: 'datos/respaldo.zip' },
        { path: 'docs/cv.docx' },
        { path: 'dist/app.js.map' },
      ],
    });
    const t = errors.join('\n');
    expect(t).toMatch(/Archivo privado versionado/);
    expect(t).toMatch(/Archivo de entorno versionado/);
    expect(t).toMatch(/Tipo de archivo prohibido versionado: certs\/server\.pem/);
    expect(t).toMatch(/Tipo de archivo prohibido versionado: datos\/respaldo\.zip/);
    expect(t).toMatch(/Tipo de archivo prohibido versionado: docs\/cv\.docx/);
    expect(t).toMatch(/Tipo de archivo prohibido versionado: dist\/app\.js\.map/);
  });

  it('permite .env.example', () => {
    expect(run({ trackedFiles: [{ path: '.env.example' }] }).errors).toEqual([]);
  });

  it('detecta datos personales genéricos en archivos versionados', () => {
    const phone = `+56${'1'.repeat(9)}`;
    const rut = ['12', '345', '678'].join('.') + '-9'; // construido: sin RUT literal
    const result = run({
      trackedFiles: [
        { path: 'src/a.ts', content: `const c = "${EMAIL}";` },
        { path: 'src/b.ts', content: `const t = "${phone}";` },
        { path: 'src/c.ts', content: `const r = "${rut}";` },
        { path: 'src/d.ts', content: `const p = "C:\\Users\\alguien\\proyecto";` },
      ],
    });
    const t = text(result);
    expect(t).toMatch(/dirección de correo\) en archivo versionado: src\/a\.ts/);
    expect(t).toMatch(/número de teléfono\) en archivo versionado: src\/b\.ts/);
    expect(t).toMatch(/RUT\) en archivo versionado: src\/c\.ts/);
    expect(t).toMatch(/ruta local del equipo\) en archivo versionado: src\/d\.ts/);
  });

  it('permite correos de ejemplo y el noreply de GitHub', () => {
    const result = run({
      trackedFiles: [
        { path: 'src/a.test.ts', content: 'a@example.com b@users.noreply.github.com' },
      ],
    });
    expect(result.errors).toEqual([]);
  });

  it('detecta datos personales en el contenido de dist/', () => {
    const files = cleanDist();
    files.push({ path: 'assets/extra.js', content: `x="${EMAIL}"` });
    expect(text(run({ distFiles: files }))).toMatch(
      /dirección de correo\) en dist\/assets\/extra\.js/,
    );
  });

  it('findPersonalData no marca texto común', () => {
    expect(findPersonalData('Ley 21.719 y versión 1.79.0 en react@19.3.1')).toEqual([]);
  });
});

describe('detección heurística de datos personales (datos sintéticos)', () => {
  // Todo se construye por partes: el repositorio no contiene teléfonos, RUT ni correos literales.
  const d = (...parts: string[]) => parts.join('');
  const USER = 'persona';
  const HOST = 'dominio-real';
  const positives: [string, string, string][] = [
    ['móvil con +56', 'número de teléfono', d('Tel ', '+56 9 ', '1111 ', '2222')],
    ['móvil compacto con +56', 'número de teléfono', d('+56', '9', '11112222')],
    ['móvil sin prefijo', 'número de teléfono', d('Cel ', '9 ', '1111 ', '2222')],
    ['móvil compacto', 'número de teléfono', d('9', '11112222')],
    ['móvil con puntos', 'número de teléfono', d('9.', '1111.', '2222')],
    ['móvil con guiones', 'número de teléfono', d('9-', '1111-', '2222')],
    ['móvil con 56 sin +', 'número de teléfono', d('56 9 ', '1111 ', '2222')],
    ['fijo con código de área entre paréntesis', 'número de teléfono', d('(45) ', '2 ', '111111')],
    ['fijo de Santiago entre paréntesis', 'número de teléfono', d('(2) ', '2111 ', '1111')],
    ['fijo con +56', 'número de teléfono', d('+56 ', '45 ', '2111111')],
    ['fijo con etiqueta «Fono»', 'número de teléfono', d('Fono: ', '45 ', '2111111')],
    ['fijo con etiqueta «Teléfono»', 'número de teléfono', d('Teléfono ', '22 ', '111 ', '1111')],
    ['RUT con puntos', 'RUT', d('11', '.111', '.111', '-1')],
    ['RUT sin puntos', 'RUT', d('11111111', '-1')],
    ['RUT con dígito K', 'RUT', d('1111111', '-K')],
    ['RUT con espacios', 'RUT', d('11 ', '111 ', '111', '-1')],
    ['RUT con etiqueta y sin guion', 'RUT', d('RUT ', '111111111')],
    [
      'correo ofuscado con [at] y [dot]',
      'dirección de correo ofuscada',
      d(USER, ' [at', '] ', HOST, ' [dot', '] test'),
    ],
    [
      'correo ofuscado con (arroba)',
      'dirección de correo ofuscada',
      d(USER, ' (arro', 'ba) ', HOST, '.test'),
    ],
    [
      'correo ofuscado con arroba y punto',
      'dirección de correo ofuscada',
      d(USER, ' arro', 'ba ', HOST, ' punto test'),
    ],
    [
      'correo ofuscado con at y dot',
      'dirección de correo ofuscada',
      d(USER, ' a', 't ', HOST, ' d', 'ot test'),
    ],
    ['correo con %40', 'dirección de correo ofuscada', d(USER, '%4', '0', HOST, '.test')],
    [
      'correo con entidad HTML',
      'dirección de correo ofuscada',
      d(USER, '&#6', '4;', HOST, '.test'),
    ],
  ];
  it.each(positives)('detecta: %s', (_name, kind, sample) => {
    expect(findPersonalData(sample)).toContain(kind);
  });

  const negatives: [string, string][] = [
    ['versiones', 'versión 1.79.0, react@19.3.1 y node 24.22.1'],
    ['leyes y normas', 'Ley 21.719, Ley 19.628, ISO/IEC 27001/27002 e ISO 9001:2015'],
    ['fechas', 'Actualizado 2026-11-25 y 2026-11-25T00:00:00Z'],
    ['hash SHA-256', 'sha256 9c62fd959bbab01a75859850968e96273ddfbe0a92caddacab44e34c21e772b0'],
    ['ETag', 'ETag W/"66126-1795614934381"'],
    ['desplazamientos de un PDF', '0000062671 00000 n'],
    ['UUID', '9f3b2c1a-8d7e-4a5b-9c1d-2e3f4a5b6c7d'],
    ['resoluciones de pantalla', 'viewport 375 × 800 y 1440 × 900'],
    ['tamaños y conteos', '66126 bytes y 4840 caracteres'],
    ['etiquetas sin número', 'Teléfono: no se publica; sin RUT ni correo'],
    ['correo ofuscado de ejemplo', 'a [at] example [dot] com'],
    ['código habitual', 'arr.at(0) y x[at]'],
  ];
  it.each(negatives)('no marca: %s', (_name, sample) => {
    expect(findPersonalData(sample)).toEqual([]);
  });

  it('la guardia informa del tipo y la ubicación del dato ofuscado', () => {
    const result = run({
      trackedFiles: [{ path: 'src/a.ts', content: d(USER, ' [at', '] ', HOST, ' [dot', '] test') }],
    });
    expect(text(result)).toMatch(
      /dirección de correo ofuscada\) en archivo versionado: src\/a\.ts/,
    );
  });
});

describe('política explícita de archivos versionados (lista de permitidos)', () => {
  const tracked = (...paths: string[]) => paths.map((path) => ({ path }));

  it('permite código, texto, fuentes y favicon revisados', () => {
    const files = [
      ...tracked(
        'src/a.ts',
        'src/b.tsx',
        'docs/a.md',
        'public/favicon.svg',
        '.gitignore',
        '.gitattributes',
        'public/cv/.gitkeep',
        'scripts/pre-push.sample',
        '.github/workflows/ci.yml',
      ),
      { path: 'public/favicon.ico', head: '\u0000\u0000\u0001\u0000' },
      { path: 'src/assets/fonts/inter-latin-wght-normal.woff2', head: 'wOF2' },
    ];
    expect(run({ trackedFiles: files }).errors).toEqual([]);
  });

  it.each([
    'datos/contactos.csv',
    'docs/nota.rtf',
    'docs/nota.odt',
    'correo/mensaje.eml',
    'correo/mensaje.msg',
    'docs/planilla.xlsx',
    'docs/planilla.xls',
    'docs/carta.docx',
    'docs/carta.doc',
    'respaldo/datos.zip',
    'respaldo/datos.tar',
    'respaldo/datos.gz',
    'respaldo/datos.7z',
    'src/assets/foto.png',
    'src/assets/foto.jpg',
    'src/assets/foto.webp',
    'src/assets/foto.avif',
    'src/assets/captura.gif',
    'src/assets/otra.woff2',
    'public/otro.ico',
    'notas',
    'LICENCIA',
  ])('rechaza un archivo fuera de la política: %s', (path) => {
    expect(text(run({ trackedFiles: tracked(path) }))).toMatch(
      new RegExp(
        `(fuera de la política de formatos autorizados|prohibido versionado): ${path.replace(/\./g, '\\.')}`,
      ),
    );
  });

  it('un binario revisado debe conservar su firma de archivo', () => {
    const result = run({ trackedFiles: [{ path: 'public/favicon.ico', head: '<html>' }] });
    expect(text(result)).toMatch(/public\/favicon\.ico no tiene la firma de archivo esperada/);
  });

  it('el aviso aclara que la búsqueda de texto no inspecciona binarios', () => {
    expect(text(run({ trackedFiles: tracked('src/assets/foto.png') }))).toMatch(/revisión expresa/);
  });
});

describe('workflows de GitHub Actions (estructural)', () => {
  const SHA = 'a'.repeat(40);
  const good = `name: CI
on: [push]
permissions: {}
jobs:
  a:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@${SHA} # v1
      - run: npm ci
`;
  const check = (content: string) =>
    text(run({ trackedFiles: [{ path: '.github/workflows/ci.yml', content }] }));

  it('acepta un workflow con acciones fijadas, permisos mínimos y sin secretos ni despliegue', () => {
    expect(check(good)).toBe('');
  });

  it('rechaza acciones sin fijar por SHA (etiquetas o ramas)', () => {
    expect(check(good.replace(`@${SHA} # v1`, '@v4'))).toMatch(
      /sin fijar por SHA.*actions\/checkout@v4/,
    );
    expect(check(good.replace(`@${SHA}`, '@main'))).toMatch(/sin fijar por SHA/);
  });

  it('rechaza workflows sin permisos, con escritura, secretos, pull_request_target o despliegue', () => {
    expect(check(good.replace('permissions: {}\n', ''))).toMatch(/debe declarar "permissions:"/);
    expect(check(good.replace('contents: read', 'contents: write'))).toMatch(
      /permisos de escritura/,
    );
    expect(check(`${good}      - run: echo \${{ secrets.TOKEN }}\n`)).toMatch(
      /referencia secretos/,
    );
    expect(check(good.replace('on: [push]', 'on: [pull_request_target]'))).toMatch(
      /pull_request_target/,
    );
    expect(check(`${good}      - run: npx vercel --prod\n`)).toMatch(/parece desplegar/);
  });

  it('los comentarios y nombres de pasos que mencionan despliegues no cuentan como despliegue', () => {
    expect(check(`# Este workflow NO despliega (deploy manual fuera de CI)\n${good}`)).toBe('');
    expect(
      check(
        `${good}      - name: Pruebas con las cabeceras de vercel.json\n        run: npm test\n`,
      ),
    ).toBe('');
  });

  it('detecta despliegues por acciones o comandos aunque el nombre del paso sea inocente', () => {
    expect(
      check(`${good}      - name: Publicar\n        uses: acciones/deploy-pages@v1\n`),
    ).toMatch(/parece desplegar/);
    expect(check(`${good}      - name: Paso inocente\n        run: npx vercel pull\n`)).toMatch(
      /parece desplegar/,
    );
  });
});

describe(`nivel [${TIERS.pdf}]`, () => {
  const pdf = (overrides: FixtureOptions = {}, head = '%PDF-1.7') => ({
    path: 'cv/michael-roudergue-cv.pdf',
    head,
    content: buildPdf(overrides),
    size: 1000,
  });
  const tracked = [{ path: 'public/cv/michael-roudergue-cv.pdf' }];

  it('rechaza un PDF en dist/ cuyo CV no está habilitado, y cualquier otro PDF', () => {
    expect(text(run({ distFiles: [...cleanDist(), pdf()] }))).toMatch(/PDF no autorizado en dist/);
    expect(text(run({ distFiles: [...cleanDist(), { path: 'docs/otro.pdf' }] }))).toMatch(
      /PDF no autorizado/,
    );
  });

  it('con el manifiesto real (CV habilitado) exige el PDF y acepta uno válido', () => {
    expect(run({ resume: realResume, trackedFiles: tracked }).errors.length).toBeGreaterThan(0);
    const ok = run({
      resume: realResume,
      distFiles: [...cleanDist(), pdf()],
      trackedFiles: tracked,
    });
    expect(ok.errors).toEqual([]);
  });

  it('rechaza un PDF distinto del declarado aunque el CV esté habilitado', () => {
    const other = { ...pdf(), path: 'cv/michael-roudergue-cv-maestro.pdf' };
    expect(text(run({ resume: enabled(), distFiles: [...cleanDist(), pdf(), other] }))).toMatch(
      /PDF no autorizado en dist\/: cv\/michael-roudergue-cv-maestro\.pdf/,
    );
  });

  it('acepta el PDF del CV habilitado (texto extraíble, páginas coherentes) y exige que exista', () => {
    const ok = run({
      resume: enabled(),
      distFiles: [...cleanDist(), pdf()],
      trackedFiles: tracked,
    });
    expect(ok.errors).toEqual([]);
    expect(ok.warnings).toEqual([]);
    expect(text(run({ resume: enabled() }))).toMatch(/CV habilitado sin archivo/);
  });

  it('rechaza un archivo habilitado sin cabecera PDF o demasiado grande', () => {
    const noHeader = run({
      resume: enabled(),
      distFiles: [...cleanDist(), pdf({}, 'NOT-PDF')],
    });
    expect(text(noHeader)).toMatch(/cabecera PDF/);
    const big = run({
      resume: enabled(),
      distFiles: [...cleanDist(), { ...pdf(), size: 6_000_000 }],
    });
    expect(text(big)).toMatch(/supera 5 MB/);
  });

  it('exige metadatos coherentes del currículum (idioma, fecha y páginas)', () => {
    expect(text(run({ resume: { ...resume, language: 'fr' } }))).toMatch(/language "es" o "en"/);
    expect(text(run({ resume: { ...resume, updatedAt: 'ayer' } }))).toMatch(/updatedAt/);
    expect(text(run({ resume: { ...resume, pages: 0 } }))).toMatch(/pages/);
    expect(text(run({ resume: { ...resume, path: '/otro/x.pdf' } }))).toMatch(
      /Ruta de currículum inválida/,
    );
  });

  it('rechaza si las páginas del PDF no coinciden con las declaradas', () => {
    const result = run({
      resume: { ...enabled(), pages: 3 },
      distFiles: [...cleanDist(), pdf()],
      trackedFiles: tracked,
    });
    expect(text(result)).toMatch(/tiene 2 páginas y resume\.json declara 3/);
  });

  it('rechaza un PDF sin texto extraíble (imágenes o fuentes sin mapa Unicode)', () => {
    const result = run({
      resume: enabled(),
      distFiles: [...cleanDist(), pdf({ withoutToUnicode: true })],
      trackedFiles: tracked,
    });
    expect(text(result)).toMatch(/No se pudo extraer texto suficiente/);
  });

  describe('fallo seguro ante PDF no verificables', () => {
    const guard = (content: string) =>
      text(
        run({
          resume: enabled(),
          distFiles: [...cleanDist(), { ...pdf(), content }],
          trackedFiles: tracked,
        }),
      );
    const base = () => buildPdf();

    it('rechaza una página con texto insuficiente aunque el documento tenga mucho texto', () => {
      const long = DEFAULT_PAGES[0] ?? '';
      expect(guard(buildPdf({ pages: [long, long, 'poco'] }))).toMatch(
        /Página 3 con texto insuficiente/,
      );
    });

    it('rechaza objetos comprimidos, formularios XObject y actualizaciones incrementales', () => {
      const objstm = `${base()}\n99 0 obj\n<</Type/ObjStm/N 1/First 5/Length 3>>\nstream\nabc\nendstream\nendobj`;
      expect(guard(objstm)).toMatch(/Verificación no fiable.*objetos comprimidos/);
      const form = `${base()}\n99 0 obj\n<</Type/XObject/Subtype/Form/Length 0>>\nstream\n\nendstream\nendobj`;
      expect(guard(form)).toMatch(/Verificación no fiable.*XObjects de formulario/);
      const incremental = `${base()}startxref\n0\n%%EOF\nstartxref\n0\n%%EOF\n`;
      expect(guard(incremental)).toMatch(/Verificación no fiable.*actualizaciones incrementales/);
    });

    it('rechaza filtros no admitidos y fuentes sin mapa Unicode', () => {
      const filtered = base().replace(
        /<<\/Length (\d+)>>\nstream\nBT/,
        '<</Filter/ASCII85Decode/Length $1>>\nstream\nBT',
      );
      expect(guard(filtered)).toMatch(/filtro no admitido/);
      expect(guard(buildPdf({ withoutToUnicode: true }))).toMatch(/no tiene mapa Unicode/);
    });

    it('rechaza contenido activo y adjuntos', () => {
      const js = base().replace(
        '/Type/Catalog',
        '/Type/Catalog/OpenAction<</S/JavaScript/JS(app.alert(1))>>',
      );
      expect(guard(js)).toMatch(/Contenido activo o adjuntos en el PDF: .*\/JavaScript/);
      const attached = `${base()}\n99 0 obj\n<</Type/Filespec/EF<</F 1 0 R>>>>\nendobj\n98 0 obj\n<</Type/EmbeddedFile/Length 0>>\nstream\n\nendstream\nendobj`;
      expect(guard(attached)).toMatch(/\/EmbeddedFile/);
    });

    it('rechaza enlaces que no sean los perfiles permitidos y acepta los permitidos', () => {
      expect(guard(buildPdf({ links: ['https://example.com/x'] }))).toMatch(
        /Enlace del PDF no permitido: https:\/\/example\.com\/x/,
      );
      expect(
        guard(buildPdf({ links: ['https://www.linkedin.com/in/michael-roudergue-a69035150'] })),
      ).toBe('');
    });

    it('rechaza un documento cifrado', () => {
      expect(guard(`${base()}\n<</Encrypt 9 0 R>>`)).toMatch(/está cifrado/);
    });
  });

  it('rechaza datos personales en el TEXTO del PDF (correo, teléfono, ruta local)', () => {
    const phone = ['+56', '9', '1111', '2222'].join(' ');
    for (const [kind, extra] of [
      ['dirección de correo', `Contacto: ${EMAIL}`],
      ['número de teléfono', `Contacto: ${phone}`],
    ] as const) {
      const result = run({
        resume: enabled(),
        distFiles: [...cleanDist(), pdf({ pages: [`${DEFAULT_PAGES[0] ?? ''} ${extra}`, 'x'] })],
        trackedFiles: tracked,
      });
      expect(text(result), kind).toMatch(
        new RegExp(`Posible dato personal \\(${kind}\\) en el texto del PDF`),
      );
    }
  });

  it('rechaza una frase de la lista privada presente en el texto del PDF', () => {
    const result = run({
      resume: enabled(),
      distFiles: [
        ...cleanDist(),
        pdf({ pages: [`${DEFAULT_PAGES[0] ?? ''} Término Reservado`, 'x'] }),
      ],
      trackedFiles: tracked,
      denylist: ['término reservado'],
    });
    expect(text(result)).toMatch(/Frase no autorizada en el texto del PDF/);
  });

  it('rechaza datos personales en los metadatos del PDF', () => {
    const result = run({
      resume: enabled(),
      distFiles: [...cleanDist(), pdf({ info: { Subject: `Contacto ${EMAIL}` } })],
      trackedFiles: tracked,
    });
    expect(text(result)).toMatch(/Posible dato personal \(dirección de correo\) en los metadatos/);
  });

  it('rechaza versionar PDF sin autorización y archivos inesperados en dist/cv', () => {
    expect(text(run({ trackedFiles: tracked }))).toMatch(/PDF versionado sin autorización/);
    expect(
      text(run({ distFiles: [...cleanDist(), { path: 'cv/notas.txt', content: 'x' }] })),
    ).toMatch(/inesperado en dist\/cv/);
  });

  it('avisa (sin fallar) de autor, software o palabras clave distintos de lo permitido', () => {
    const withMeta = pdf({
      info: { Author: 'Alguien', Producer: 'Software', Creator: 'Editor' },
      xmp: '<x:xmpmeta><xmp:CreatorTool>Writer</xmp:CreatorTool></x:xmpmeta>',
    });
    const result = run({
      resume: enabled(),
      distFiles: [...cleanDist(), withMeta],
      trackedFiles: tracked,
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings.join('\n')).toMatch(
      /Revisar metadatos.*\/Author.*\/Creator.*\/Producer.*XMP \(software\)/,
    );
  });

  it('no trata los URI de espacios de nombres XMP como hosts externos, pero sí rechaza mailto:/tel:', () => {
    const xmpNamespaces =
      '<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:pdf="http://ns.adobe.com/pdf/1.3/"/></rdf:RDF></x:xmpmeta>';
    const base = { resume: enabled(), trackedFiles: tracked };
    expect(
      run({ ...base, distFiles: [...cleanDist(), pdf({ xmp: xmpNamespaces })] }).errors,
    ).toEqual([]);
    expect(
      text(
        run({
          ...base,
          distFiles: [...cleanDist(), pdf({ xmp: `<x:xmpmeta>mailto:alguien</x:xmpmeta>` })],
        }),
      ),
    ).toMatch(/contiene enlaces mailto: o tel:/);
  });

  it('acepta metadatos mínimos: título y el nombre público como autor', () => {
    const clean = pdf({
      info: { Title: 'Currículum profesional', Author: PUBLIC_PDF_AUTHOR },
      xmp: '<x:xmpmeta><dc:title>CV</dc:title></x:xmpmeta>',
    });
    const result = run({
      resume: enabled(),
      distFiles: [...cleanDist(), clean],
      trackedFiles: tracked,
    });
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});

describe(`nivel [${TIERS.dist}]`, () => {
  it('rechaza mapas de código fuente y referencias sourceMappingURL', () => {
    const t = text(
      run({
        distFiles: [
          ...cleanDist(),
          { path: 'assets/a.js.map', content: '{}' },
          { path: 'assets/b.js', content: 'x\n//# sourceMappingURL=b.js.map' },
        ],
      }),
    );
    expect(t).toMatch(/Mapa de código fuente publicado/);
    expect(t).toMatch(/Referencia a source map/);
  });

  it('rechaza tipos de archivo no permitidos', () => {
    expect(text(run({ distFiles: [...cleanDist(), { path: 'datos.sqlite' }] }))).toMatch(
      /Tipo de archivo no permitido en dist/,
    );
  });

  it('rechaza scripts, estilos y manejadores en línea en index.html (incompatibles con la CSP)', () => {
    for (const [fragment, pattern] of [
      ['<script>alert(1)</script>', /<script> en línea/],
      ['<style>a{}</style>', /<style> en línea/],
      ['<div onclick="x()"></div>', /manejadores de eventos/],
      ['<div style="color:red"></div>', /atributos style/],
    ] as const) {
      const files = cleanDist().map((f) =>
        f.path === 'index.html'
          ? { ...f, content: GOOD_HTML.replace('</body>', `${fragment}</body>`) }
          : f,
      );
      expect(text(run({ distFiles: files }))).toMatch(pattern);
    }
  });

  it('rechaza mailto: y tel: en index.html', () => {
    const fakePhone = `+56${'0'.repeat(9)}`;
    for (const href of ['mailto:a@example.com', `tel:${fakePhone}`]) {
      const files = cleanDist().map((f) =>
        f.path === 'index.html'
          ? { ...f, content: GOOD_HTML.replace('</body>', `<a href="${href}">x</a></body>`) }
          : f,
      );
      expect(text(run({ distFiles: files }))).toMatch(/mailto: o tel:/);
    }
  });

  it('rechaza hosts externos no previstos y acepta los permitidos', () => {
    const bad = [...cleanDist(), { path: 'assets/x.js', content: 'u="https://tracker.invalid/p"' }];
    expect(text(run({ distFiles: bad }))).toMatch(/Host externo no permitido.*tracker\.invalid/);
    const ok = [...cleanDist(), { path: 'assets/y.js', content: 'u="https://react.dev/errors/1"' }];
    expect(run({ distFiles: ok }).errors).toEqual([]);
  });
});

describe(`nivel [${TIERS.meta}]`, () => {
  const withHtml = (html: string) =>
    cleanDist().map((f) => (f.path === 'index.html' ? { ...f, content: html } : f));

  it.each([
    ['sin lang', GOOD_HTML.replace(' lang="es"', ''), /lang=/],
    ['title corto', GOOD_HTML.replace(/<title>.*<\/title>/, '<title>Hi</title>'), /<title>/],
    ['sin description', GOOD_HTML.replace(/<meta\s+name="description"[^>]*>/, ''), /description/],
    [
      'noindex',
      GOOD_HTML.replace('</head>', '<meta name="robots" content="noindex"></head>'),
      /noindex/,
    ],
    ['sin og:title', GOOD_HTML.replace('property="og:title"', 'property="x:title"'), /og:title/],
    ['sin twitter:card', GOOD_HTML.replace('twitter:card', 'twitter:x'), /twitter:card/],
    ['sin favicon', GOOD_HTML.replace('rel="icon"', 'rel="x"'), /favicon/],
    [
      'referencia rota',
      GOOD_HTML.replace('/theme-init.js', '/no-existe.js'),
      /archivo inexistente/,
    ],
  ])('rechaza index.html %s', (_name, html, pattern) => {
    expect(text(run({ distFiles: withHtml(html) }))).toMatch(pattern);
  });

  it('exige robots.txt indexable', () => {
    const noRobots = cleanDist().filter((f) => f.path !== 'robots.txt');
    expect(text(run({ distFiles: noRobots }))).toMatch(/Falta dist\/robots\.txt/);
    const blocking = cleanDist().map((f) =>
      f.path === 'robots.txt' ? { ...f, content: 'User-agent: *\nDisallow: /\n' } : f,
    );
    expect(text(run({ distFiles: blocking }))).toMatch(/bloquea todo el sitio/);
  });

  it('sin SITE_URL no admite canonical, og:url, sitemap ni referencia al sitemap (no se inventa dominio)', () => {
    const html = GOOD_HTML.replace(
      '</head>',
      '<link rel="canonical" href="https://dominio.invalid/"></head>',
    );
    expect(text(run({ distFiles: withHtml(html) }))).toMatch(/sin SITE_URL/);
    const sitemap = [...cleanDist(), { path: 'sitemap.xml', content: '<urlset/>' }];
    expect(text(run({ distFiles: sitemap }))).toMatch(/sitemap\.xml presente sin SITE_URL/);
  });

  it('con SITE_URL exige canonical, og:url, sitemap y robots coherentes', () => {
    const origin = 'https://sitio.invalid';
    const html = GOOD_HTML.replace(
      '</head>',
      `<link rel="canonical" href="${origin}/"><meta property="og:url" content="${origin}/"></head>`,
    );
    const files = [
      ...withHtml(html).map((f) =>
        f.path === 'robots.txt'
          ? { ...f, content: `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n` }
          : f,
      ),
      { path: 'sitemap.xml', content: `<urlset><url><loc>${origin}/</loc></url></urlset>` },
    ];
    expect(run({ distFiles: files, siteUrl: origin }).errors).toEqual([]);
    expect(text(run({ distFiles: cleanDist(), siteUrl: origin }))).toMatch(/canonical/);
    expect(text(run({ distFiles: files, siteUrl: 'http://inseguro.invalid' }))).toMatch(
      /origen https/,
    );
  });
});

describe(`nivel [${TIERS.content}]`, () => {
  it('exige paridad de claves y textos no vacíos entre ES y EN', () => {
    const t = text(run({ locales: { es: { a: 'x', b: 'y' }, en: { a: 'x', c: '' } } }));
    expect(t).toMatch(/sin traducción al inglés: b/);
    expect(t).toMatch(/sin traducción al español: c/);
    expect(t).toMatch(/Texto vacío.*c/);
  });

  it('rechaza marcadores de posición y datos personales en los textos', () => {
    const t = text(
      run({ locales: { es: { a: 'Lorem ipsum', b: EMAIL }, en: { a: 'ok', b: 'ok' } } }),
    );
    expect(t).toMatch(/Marcador de posición en es: a/);
    expect(t).toMatch(/dirección de correo\) en es: b/);
  });

  it('solo admite los perfiles públicos confirmados', () => {
    expect(
      text(run({ profileUrls: [...ALLOWED_PROFILE_URLS, 'https://otro.invalid/perfil'] })),
    ).toMatch(/Enlace externo no autorizado/);
    expect(text(run({ profileUrls: [ALLOWED_PROFILE_URLS[0] ?? ''] }))).toMatch(
      /Falta un perfil público confirmado/,
    );
  });

  it('rechaza URLs externas no previstas en el código fuente (excepto pruebas y licencias)', () => {
    const t = text(
      run({
        trackedFiles: [
          { path: 'src/data/x.ts', content: 'const u = "https://servicio.invalid/api";' },
          { path: 'src/data/y.test.ts', content: 'const u = "https://servicio.invalid/api";' },
          { path: 'src/assets/fonts/Licencia.txt', content: 'https://licencia.invalid/' },
        ],
      }),
    );
    expect(t).toMatch(/URL externa no prevista en src\/data\/x\.ts/);
    expect(t).not.toMatch(/y\.test\.ts/);
    expect(t).not.toMatch(/Licencia\.txt/);
  });
});

describe(`nivel [${TIERS.private}] y limitaciones`, () => {
  const denylist = ['Proyecto Interno Alfa', '# comentario', ''];

  it('detecta una frase de la lista privada en dist/ y en el código versionado, sin imprimirla', () => {
    const result = run({
      denylist,
      distFiles: [...cleanDist(), { path: 'assets/app.js', content: 'x="proyecto interno ALFA"' }],
      trackedFiles: [{ path: 'src/i18n/es.json', content: '{"a":"Proyecto Interno Alfa"}' }],
    });
    const t = text(result);
    expect(t).toMatch(/Frase no autorizada en dist\/: assets\/app\.js/);
    expect(t).toMatch(/código versionado: src\/i18n\/es\.json/);
    expect(t).not.toMatch(/Alfa/i);
  });

  it('sin coincidencias, la revisión privada queda completa', () => {
    const result = run({ denylist, trackedFiles: [{ path: 'src/a.ts', content: 'const a = 1' }] });
    expect(result.errors).toEqual([]);
    expect(result.privateReviewComplete).toBe(true);
    expect(result.limitations).toEqual([]);
  });

  it('sin lista privada informa la LIMITACIÓN y la revisión queda incompleta (no es error)', () => {
    const result = run({ denylist: null });
    expect(result.errors).toEqual([]);
    expect(result.privateReviewComplete).toBe(false);
    expect(result.limitations.join('\n')).toMatch(/INCOMPLETA/);
  });

  it('con --strict-private la ausencia de la lista privada es un error', () => {
    const result = run({ denylist: null, strictPrivate: true });
    expect(text(result)).toMatch(/\[privada\].*INCOMPLETA/);
  });

  it('sin lista de archivos versionados (sin git) informa la limitación', () => {
    const result = run({ trackedFiles: null, denylist });
    const l = result.limitations.join('\n');
    expect(l).toMatch(/archivos versionados/);
    expect(result.privateReviewComplete).toBe(false);
  });
});

describe('utilidades', () => {
  it('solo trata como texto las extensiones conocidas', () => {
    expect(isTextPath('assets/index.js')).toBe(true);
    expect(isTextPath('index.html')).toBe(true);
    expect(isTextPath('fonts/inter.woff2')).toBe(false);
    expect(isTextPath('cv/cv.pdf')).toBe(false);
  });
});

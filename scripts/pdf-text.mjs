/**
 * Inspección mínima de PDF (sin dependencias; solo `node:zlib`).
 *
 * Extrae el texto de PDF con fuentes simples (o Type0 de 2 bytes) que incluyen el mapa
 * /ToUnicode, como los generados por LibreOffice o Word, y lee los metadatos (Info y XMP).
 *
 * NO es un lector PDF completo. Diseño de fallo seguro: cuando encuentra una estructura que no
 * puede inspeccionar de forma fiable (objetos comprimidos, filtros no admitidos, formularios
 * XObject, fuentes sin mapa Unicode, actualizaciones incrementales, cifrado…) NO la ignora: la
 * añade a `limitations`, y los verificadores la tratan como error. Un PDF con limitaciones no se
 * considera verificado, aunque el texto extraído parezca limpio.
 */
import { inflateSync } from 'node:zlib';

/** Texto mínimo por página (caracteres no blancos) para considerarla verificable. */
export const MIN_PAGE_TEXT_CHARS = 100;

/** Marcas de contenido activo o adjunto que un CV público no debe contener. */
const ACTIVE_CONTENT = [
  '/JavaScript',
  '/JS',
  '/Launch',
  '/EmbeddedFile',
  '/EmbeddedFiles',
  '/Filespec',
  '/RichMedia',
  '/SubmitForm',
  '/ImportData',
  '/GoToR',
  '/XFA',
  '/AcroForm',
  '/AA',
];

/** @param {string} s */
function unescapeLiteral(s) {
  return s.replace(/\\(n|r|t|b|f|\(|\)|\\|[0-7]{1,3}|\r?\n)/g, (_, c) => {
    if (c === 'n') return '\n';
    if (c === 'r') return '\r';
    if (c === 't') return '\t';
    if (c === 'b') return '\b';
    if (c === 'f') return '\f';
    if (/^[0-7]+$/.test(c)) return String.fromCharCode(parseInt(c, 8));
    if (c === '(' || c === ')' || c === '\\') return c;
    return '';
  });
}

/** Decodifica una cadena PDF (literal o hexadecimal; UTF-16BE con BOM o PDFDocEncoding). */
export function decodePdfString(token) {
  let bytes;
  if (token.startsWith('<')) {
    const hex = token.slice(1, -1).replace(/\s+/g, '');
    bytes = Buffer.from(hex.length % 2 ? `${hex}0` : hex, 'hex');
  } else {
    bytes = Buffer.from(unescapeLiteral(token.slice(1, -1)), 'latin1');
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return Buffer.from(bytes.subarray(2)).swap16().toString('utf16le');
  }
  return bytes.toString('latin1');
}

/** ¿El flujo usa solo el filtro Flate (o ninguno)? Otros filtros no se decodifican aquí. */
function filterSupported(dict) {
  const filter = /\/Filter\s*(\[[^\]]*\]|\/[A-Za-z0-9]+)/.exec(dict)?.[1];
  if (filter === undefined) return true;
  const names = filter.match(/\/[A-Za-z0-9]+/g) ?? [];
  return names.length === 1 && names[0] === '/FlateDecode';
}

function parseObjects(source) {
  const text = source.toString('latin1');
  const objects = new Map();
  for (const match of text.matchAll(/(\d+) 0 obj([\s\S]*?)endobj/g)) {
    const body = match[2];
    const streamAt = body.indexOf('stream');
    let dict = body;
    let data = null;
    let inflateFailed = false;
    if (streamAt >= 0 && /\/Length|\/Filter/.test(body.slice(0, streamAt))) {
      dict = body.slice(0, streamAt);
      let start = streamAt + 'stream'.length;
      if (body[start] === '\r') start += 1;
      if (body[start] === '\n') start += 1;
      const end = body.lastIndexOf('endstream');
      let chunk = Buffer.from(body.slice(start, end < start ? undefined : end), 'latin1');
      if (/\/FlateDecode/.test(dict)) {
        try {
          chunk = inflateSync(chunk);
        } catch {
          chunk = Buffer.alloc(0);
          inflateFailed = true;
        }
      }
      data = chunk;
    }
    objects.set(Number(match[1]), { dict, data, inflateFailed });
  }
  return objects;
}

function parseToUnicode(data) {
  const text = data.toString('latin1');
  const map = new Map();
  const chars = (hex) =>
    (hex.match(/.{4}/g) ?? []).map((h) => String.fromCharCode(parseInt(h, 16))).join('');
  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const m of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      map.set(parseInt(m[1], 16), chars(m[2]));
    }
  }
  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const m of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      const [from, to, base] = [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
      for (let code = from; code <= to; code += 1) {
        map.set(code, String.fromCharCode(base + code - from));
      }
    }
  }
  return map;
}

/** Contenido de un diccionario `<< ... >>` que empieza en `from`, respetando el anidamiento. */
function balanced(text, from) {
  let depth = 0;
  for (let i = from; i < text.length - 1; i += 1) {
    if (text[i] === '<' && text[i + 1] === '<') {
      depth += 1;
      i += 1;
    } else if (text[i] === '>' && text[i + 1] === '>') {
      depth -= 1;
      i += 1;
      if (depth === 0) return text.slice(from + 2, i - 1);
    }
  }
  return '';
}

/** Valor (referencia indirecta o diccionario en línea) de la clave dada, como texto. */
function valueOf(objects, dict, key) {
  const at = new RegExp(`/${key}\\s*`).exec(dict);
  if (!at) return '';
  const rest = at.index + at[0].length;
  const ref = /^(\d+) 0 R/.exec(dict.slice(rest));
  if (ref) return objects.get(Number(ref[1]))?.dict ?? '';
  return dict.startsWith('<<', rest) ? balanced(dict, rest) : '';
}

function fontsOf(objects, pageDict, limitations, label) {
  const fonts = new Map();
  const resources = valueOf(objects, pageDict, 'Resources');
  const fontDict = valueOf(objects, resources, 'Font');
  for (const m of fontDict.matchAll(/\/([^\s/<>[\]()]+)\s+(\d+) 0 R/g)) {
    const font = objects.get(Number(m[2]));
    if (!font) continue;
    const toUnicode = /\/ToUnicode\s+(\d+) 0 R/.exec(font.dict);
    const cmapObject = toUnicode ? objects.get(Number(toUnicode[1])) : undefined;
    if (cmapObject && (cmapObject.inflateFailed || !filterSupported(cmapObject.dict))) {
      limitations.push(
        `${label}: el mapa ToUnicode de la fuente /${m[1]} no se puede decodificar.`,
      );
    }
    fonts.set(m[1], {
      name: m[1],
      map: cmapObject?.data ? parseToUnicode(cmapObject.data) : new Map(),
      bytes: /\/Subtype\s*\/Type0/.test(font.dict) ? 2 : 1,
    });
  }
  return { fonts, hasResources: resources !== '' };
}

function showString(token, font, usage) {
  if (!font) {
    usage.unresolvedFont = true;
    return '';
  }
  usage.used.add(font);
  const raw = token.startsWith('<')
    ? Buffer.from(token.slice(1, -1).replace(/\s+/g, ''), 'hex')
    : Buffer.from(unescapeLiteral(token.slice(1, -1)), 'latin1');
  let out = '';
  for (let i = 0; i + font.bytes <= raw.length; i += font.bytes) {
    const code = font.bytes === 2 ? raw.readUInt16BE(i) : raw[i];
    out += font.map.get(code) ?? '';
  }
  return out;
}

function contentOf(objects, pageDict, limitations, label) {
  const ids = [];
  const array = /\/Contents\s*\[([^\]]*)\]/.exec(pageDict);
  if (array) for (const m of array[1].matchAll(/(\d+) 0 R/g)) ids.push(Number(m[1]));
  else {
    const single = /\/Contents\s+(\d+) 0 R/.exec(pageDict);
    if (single) ids.push(Number(single[1]));
  }
  if (ids.length === 0) limitations.push(`${label}: sin flujo de contenido legible.`);
  return ids
    .map((id) => {
      const object = objects.get(id);
      if (!object?.data) {
        limitations.push(`${label}: el contenido (objeto ${String(id)}) no es un flujo accesible.`);
        return '';
      }
      if (object.inflateFailed) {
        limitations.push(`${label}: no se pudo descomprimir el contenido (objeto ${String(id)}).`);
      } else if (!filterSupported(object.dict)) {
        limitations.push(
          `${label}: el contenido usa un filtro no admitido (objeto ${String(id)}).`,
        );
      }
      return object.data.toString('latin1');
    })
    .join('\n');
}

function extractPageText(objects, pageDict, number) {
  const label = `Página ${String(number)}`;
  const limitations = [];
  const { fonts, hasResources } = fontsOf(objects, pageDict, limitations, label);
  const content = contentOf(objects, pageDict, limitations, label);
  if (content !== '' && !hasResources) {
    limitations.push(`${label}: sin recursos propios (la herencia de recursos no está soportada).`);
  }
  const usage = { used: new Set(), unresolvedFont: false };
  const lines = [];
  let line = '';
  let font;
  const operators =
    /\/([^\s/<>[\]()]+)\s+[\d.]+\s+Tf|\[((?:[^\]\\]|\\.)*)\]\s*TJ|(<[0-9A-Fa-f\s]*>|\((?:[^()\\]|\\.)*\))\s*(?:Tj|'|")|\bET\b/g;
  for (const m of content.matchAll(operators)) {
    if (m[1] !== undefined) font = fonts.get(m[1]);
    else if (m[2] !== undefined) {
      for (const s of m[2].matchAll(/<[0-9A-Fa-f\s]*>|\((?:[^()\\]|\\.)*\)/g)) {
        line += showString(s[0], font, usage);
      }
    } else if (m[3] !== undefined) line += showString(m[3], font, usage);
    else {
      lines.push(line);
      line = '';
    }
  }
  if (line) lines.push(line);
  if (usage.unresolvedFont) limitations.push(`${label}: texto con una fuente no resuelta.`);
  for (const used of usage.used) {
    if (used.map.size === 0) {
      limitations.push(
        `${label}: la fuente /${used.name} no tiene mapa Unicode (texto no extraíble).`,
      );
    }
  }
  return { text: lines.join('\n'), limitations };
}

const empty = () => ({
  isPdf: false,
  pages: 0,
  text: '',
  pageTexts: [],
  info: {},
  metadataText: '',
  hasXmp: false,
  xmpSoftware: false,
  encrypted: false,
  limitations: [],
  activeContent: [],
  uris: [],
  images: 0,
  incremental: false,
});

/**
 * @param {Uint8Array} input
 * @returns {{
 *   isPdf: boolean, pages: number, text: string, pageTexts: string[],
 *   info: { author?: string, title?: string, creator?: string, producer?: string, subject?: string, keywords?: string },
 *   metadataText: string, hasXmp: boolean, xmpSoftware: boolean, encrypted: boolean,
 *   limitations: string[], activeContent: string[], uris: string[], images: number, incremental: boolean,
 * }}
 */
export function inspectPdf(input) {
  const buffer = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  const raw = buffer.toString('latin1');
  if (!raw.startsWith('%PDF-')) return empty();

  const objects = parseObjects(buffer);
  const pageDicts = [...objects.values()]
    .map((o) => o.dict)
    .filter((d) => /\/Type\s*\/Page\b(?!s)/.test(d));
  const limitations = [];
  const pageTexts = pageDicts.map((dict, index) => {
    const page = extractPageText(objects, dict, index + 1);
    limitations.push(...page.limitations);
    return page.text;
  });

  // Estructura sin los datos de los flujos (evita falsos positivos en bytes comprimidos).
  const trailer = raw.slice(raw.lastIndexOf('trailer'));
  const structure = [...[...objects.values()].map((o) => o.dict), trailer].join('\n');

  if (/\/Type\s*\/ObjStm\b|\/Type\s*\/XRef\b/.test(structure)) {
    limitations.push(
      'El PDF usa objetos comprimidos (/ObjStm o referencias cruzadas en flujo): el inspector no los analiza.',
    );
  }
  if (/\/Subtype\s*\/Form\b/.test(structure)) {
    limitations.push('El PDF contiene XObjects de formulario: su texto no se inspecciona.');
  }
  const incremental =
    (raw.match(/startxref/g) ?? []).length > 1 || /\/Prev\s+\d+\s*(?:\/|>>)/.test(trailer);
  if (incremental) {
    limitations.push(
      'El PDF tiene actualizaciones incrementales: puede conservar contenido anterior eliminado.',
    );
  }
  const declaredCount = [...objects.values()]
    .map((o) => o.dict)
    .filter((d) => /\/Type\s*\/Pages\b/.test(d) && !/\/Parent\b/.test(d))
    .map((d) => Number(/\/Count\s+(\d+)/.exec(d)?.[1]))
    .find((n) => Number.isInteger(n));
  if (declaredCount !== undefined && declaredCount !== pageDicts.length) {
    limitations.push(
      `El árbol de páginas declara ${String(declaredCount)} página(s) pero se encontraron ${String(pageDicts.length)}.`,
    );
  }

  const activeContent = ACTIVE_CONTENT.filter((name) =>
    new RegExp(`${name}(?![A-Za-z0-9])`).test(structure),
  );
  const uris = Array.from(structure.matchAll(/\/URI\s*\(([^)]*)\)/g), (m) => m[1] ?? '');
  const images = [...objects.values()].filter((o) => /\/Subtype\s*\/Image\b/.test(o.dict)).length;

  const info = {};
  const fields = {
    author: 'Author',
    title: 'Title',
    creator: 'Creator',
    producer: 'Producer',
    subject: 'Subject',
    keywords: 'Keywords',
  };
  // El diccionario Info se localiza por el trailer (los marcadores también usan /Title).
  const infoRef = /\/Info\s+(\d+) 0 R/.exec(trailer);
  const infoDict = infoRef ? objects.get(Number(infoRef[1]))?.dict : undefined;
  if (infoDict) {
    for (const [key, name] of Object.entries(fields)) {
      const m = new RegExp(`/${name}\\s*(<[0-9A-Fa-f\\s]*>|\\((?:[^()\\\\]|\\\\.)*\\))`).exec(
        infoDict,
      );
      if (m) info[key] = decodePdfString(m[1]);
    }
  }
  const xmp = [...objects.values()]
    .filter((o) => o.data && /<x:xmpmeta/.test(o.data.toString('utf8')))
    .map((o) => o.data.toString('utf8'))
    .join('\n');
  const metadataText = [...Object.values(info), xmp].join('\n');
  return {
    isPdf: true,
    pages: pageDicts.length,
    text: pageTexts.join('\n'),
    pageTexts,
    info,
    metadataText,
    hasXmp: xmp !== '',
    xmpSoftware: /<xmp:CreatorTool>|<pdf:Producer>/.test(xmp),
    encrypted: /\/Encrypt\b/.test(raw),
    limitations: [...new Set(limitations)],
    activeContent,
    uris,
    images,
    incremental,
  };
}

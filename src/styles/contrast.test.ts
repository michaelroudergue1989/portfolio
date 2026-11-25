import tokensCss from './tokens.css?raw';

type Palette = Record<string, string>;

function parseBlock(selectorPattern: RegExp): Palette {
  const block = selectorPattern.exec(tokensCss)?.[1] ?? '';
  const palette: Palette = {};
  for (const match of block.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) {
    palette[match[1] ?? ''] = match[2] ?? '';
  }
  return palette;
}

const light = parseBlock(/:root\s*\{([^}]*)\}/);
const dark = { ...light, ...parseBlock(/\[data-theme=['"]dark['"]\]\s*\{([^}]*)\}/) };

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((hi ?? 0) + 0.05) / ((lo ?? 0) + 0.05);
}

/** [primer plano, fondo, mínimo, criterio WCAG] */
const pairs: [string, string, number, string][] = [
  ['foreground', 'background', 4.5, 'texto'],
  ['foreground', 'surface', 4.5, 'texto'],
  ['foreground', 'surface-subtle', 4.5, 'texto'],
  ['foreground', 'primary-soft', 4.5, 'texto (selección)'],
  ['muted', 'background', 4.5, 'texto secundario'],
  ['muted', 'surface', 4.5, 'texto secundario'],
  ['muted', 'surface-subtle', 4.5, 'texto secundario'],
  ['primary', 'background', 4.5, 'enlace/icono'],
  ['primary', 'surface', 4.5, 'enlace/icono'],
  ['primary', 'primary-soft', 5, 'insignia (margen ≥ 5)'],
  ['accent', 'background', 4.5, 'texto de acento'],
  ['accent', 'surface', 4.5, 'texto de acento'],
  ['accent', 'accent-soft', 5, 'insignia (margen ≥ 5)'],
  ['foreground', 'background-alt', 4.5, 'texto en sección alterna'],
  ['muted', 'background-alt', 4.5, 'texto secundario en sección alterna'],
  ['primary', 'background-alt', 4.5, 'enlace en sección alterna'],
  ['accent', 'background-alt', 4.5, 'acento en sección alterna'],
  ['border-strong', 'background-alt', 3, 'límite de control (1.4.11)'],
  ['ring', 'background-alt', 3, 'indicador de foco'],
  ...(['software', 'leadership', 'security'] as const).flatMap(
    (area): [string, string, number, string][] => [
      [`area-${area}`, 'background', 4.5, `área ${area}`],
      [`area-${area}`, 'background-alt', 4.5, `área ${area}`],
      [`area-${area}`, 'surface', 4.5, `área ${area}`],
      [`area-${area}`, `area-${area}-soft`, 5, `área ${area} (insignia, margen ≥ 5)`],
    ],
  ),
  ['on-primary', 'primary', 4.5, 'botón primario'],
  ['on-primary', 'primary-hover', 4.5, 'botón primario (hover)'],
  ['border-strong', 'background', 3, 'límite de control (1.4.11)'],
  ['border-strong', 'surface', 3, 'límite de control (1.4.11)'],
  ['ring', 'background', 3, 'indicador de foco'],
  ['ring', 'surface', 3, 'indicador de foco'],
];

describe.each([
  ['claro', light],
  ['oscuro', dark],
] as const)('contraste del tema %s', (_name, palette) => {
  it('define todos los tokens de color usados', () => {
    for (const [fg, bg] of pairs) {
      expect(palette[fg], `falta --${fg}`).toMatch(/^#[0-9a-f]{6}$/i);
      expect(palette[bg], `falta --${bg}`).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it.each(pairs)('%s sobre %s ≥ %s:1 (%s)', (fg, bg, minimum) => {
    const ratio = contrast(palette[fg] ?? '#000000', palette[bg] ?? '#ffffff');
    expect(ratio).toBeGreaterThanOrEqual(minimum);
  });
});

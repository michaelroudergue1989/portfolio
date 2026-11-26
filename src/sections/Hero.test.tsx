import { act, render, screen } from '@testing-library/react';
import i18n from '@/i18n';
import { mockViewport } from '@/test/matchMedia';
import { disabledResume, enabledResume } from '@/test/resumeHelpers';
import { COMPACT_HERO_QUERY, Hero } from './Hero';
import { HeroVisual } from './HeroVisual';

const enabledPrimary = enabledResume();

describe('Hero', () => {
  it('mantiene el nombre como encabezado principal y muestra el título', () => {
    render(<Hero />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Michael Roudergue' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ingeniero en Informática')).toBeInTheDocument();
    expect(screen.getByText('Región de La Araucanía, Chile')).toBeInTheDocument();
  });

  it('muestra la descripción profesional en tres bloques jerarquizados', () => {
    render(<Hero />);
    expect(
      screen.getByText(
        /^Ingeniero en Informática con más de 9 años de experiencia profesional en análisis, diseño/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/^Experiencia en desarrollo Full Stack, liderazgo técnico/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /^Diplomado en Gestión y Dirección de Proyectos TI de Duoc UC y Diploma de Postítulo en Ciberseguridad de la Universidad de Chile/,
      ),
    ).toBeInTheDocument();
  });

  it('ofrece LinkedIn y GitHub de forma segura', () => {
    render(<Hero />);
    for (const name of [/LinkedIn/, /GitHub/]) {
      const link = screen.getByRole('link', { name });
      expect(link.getAttribute('href')).toMatch(/^https:\/\//);
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('se traduce al inglés', async () => {
    await i18n.changeLanguage('en');
    render(<Hero />);
    expect(screen.getByText('Computer Engineer')).toBeInTheDocument();
    expect(
      screen.getByText(/^Computer Engineer with over 9 years of professional experience/),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View experience/ })).toBeInTheDocument();
  });
});

describe('Hero: CTA principal según disponibilidad del CV', () => {
  it('el manifiesto real habilita "Descargar CV" como acción principal', () => {
    render(<Hero />);
    expect(screen.getByRole('link', { name: /Descargar CV/ })).toHaveAttribute(
      'href',
      '/cv/michael-roudergue-cv.pdf',
    );
    expect(screen.getByRole('link', { name: /Ver experiencia/ })).toHaveAttribute(
      'href',
      '#experience',
    );
  });

  it('sin CV autorizado mantiene "Ver experiencia" y no muestra descargas', () => {
    const { container } = render(<Hero item={disabledResume()} />);
    expect(screen.getByRole('link', { name: /Ver experiencia/ })).toHaveAttribute(
      'href',
      '#experience',
    );
    expect(screen.queryByRole('link', { name: /Descargar CV/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /currículums/i })).not.toBeInTheDocument();
    expect(container.querySelectorAll('[download], a[href$=".pdf"]')).toHaveLength(0);
  });

  it('con el CV disponible muestra "Descargar CV" junto a "Ver experiencia"', () => {
    render(<Hero item={enabledPrimary} />);
    const download = screen.getByRole('link', { name: /Descargar CV/ });
    expect(download).toHaveAttribute('href', '/cv/michael-roudergue-cv.pdf');
    expect(download).toHaveAttribute('download', 'michael-roudergue-cv.pdf');
    expect(screen.getByRole('link', { name: /Ver experiencia/ })).toHaveAttribute(
      'href',
      '#experience',
    );
    expect(screen.queryByRole('link', { name: /Más currículums/ })).not.toBeInTheDocument();
    // LinkedIn y GitHub se conservan.
    expect(screen.getByRole('link', { name: /LinkedIn/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /GitHub/ })).toBeInTheDocument();
  });

  it('el CTA se traduce al inglés', async () => {
    await i18n.changeLanguage('en');
    render(<Hero item={enabledPrimary} />);
    expect(screen.getByRole('link', { name: /Download CV/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View experience/ })).toBeInTheDocument();
    expect(screen.queryByText(/More résumés/)).not.toBeInTheDocument();
  });

  it('no descarga si el CV está habilitado pero con datos incompletos', () => {
    const broken = enabledResume({ updatedAt: 'ayer' });
    render(<Hero item={broken} />);
    expect(screen.queryByRole('link', { name: /Descargar CV/ })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ver experiencia/ })).toBeInTheDocument();
  });
});

/** Orden en el DOM de los bloques del Hero, identificados por su contenido. */
function blockOrder(container: HTMLElement) {
  const blocks: [string, Element | null | undefined][] = [
    ['presentación', screen.getByText(/^Ingeniero en Informática con más de 9 años/)],
    ['descarga', screen.getByRole('link', { name: /Descargar CV/ })],
    ['experiencia', screen.getByRole('link', { name: /Ver experiencia/ })],
    ['linkedin', screen.getByRole('link', { name: /LinkedIn/ })],
    ['github', screen.getByRole('link', { name: /GitHub/ })],
    ['capacidades', screen.getByText(/^Experiencia en desarrollo Full Stack/)],
    ['formación', screen.getByText(/^Diplomado en Gestión/)],
    ['ubicación', screen.getByText('Región de La Araucanía, Chile')],
    ['gráfico', container.querySelector('svg[viewBox="0 0 360 360"]')],
  ];
  return blocks
    .sort(([, a], [, b]) =>
      a && b && a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1,
    )
    .map(([name]) => name);
}

const COMPACT_ORDER = [
  'presentación',
  'descarga',
  'experiencia',
  'linkedin',
  'github',
  'capacidades',
  'formación',
  'ubicación',
  'gráfico',
];
const WIDE_ORDER = [
  'presentación',
  'capacidades',
  'formación',
  'ubicación',
  'descarga',
  'experiencia',
  'linkedin',
  'github',
  'gráfico',
];

describe('Hero: orden según la pantalla', () => {
  it('en pantallas compactas las acciones van tras la presentación, sin duplicados', () => {
    mockViewport((query) => query === COMPACT_HERO_QUERY);
    const { container } = render(<Hero />);
    expect(blockOrder(container)).toEqual(COMPACT_ORDER);
    expect(screen.getAllByRole('link')).toHaveLength(4);
    expect(screen.getAllByRole('img', { name: 'Monograma MR' })).toHaveLength(1);
  });

  it('en escritorio conserva el orden aprobado', () => {
    const { container } = render(<Hero />);
    expect(blockOrder(container)).toEqual(WIDE_ORDER);
    expect(screen.getAllByRole('link')).toHaveLength(4);
  });

  it('se reordena al cambiar la ventana sin recrear los enlaces ni perder el foco', () => {
    const viewport = mockViewport(() => false);
    const { container, unmount } = render(<Hero />);
    const download = screen.getByRole('link', { name: /Descargar CV/ });
    download.focus();

    act(() => {
      viewport.change((query) => query === COMPACT_HERO_QUERY);
    });
    expect(blockOrder(container)).toEqual(COMPACT_ORDER);
    expect(screen.getByRole('link', { name: /Descargar CV/ })).toBe(download);

    act(() => {
      viewport.change(() => false);
    });
    expect(blockOrder(container)).toEqual(WIDE_ORDER);
    expect(screen.getByRole('link', { name: /Descargar CV/ })).toBe(download);

    unmount();
    expect(viewport.listenerCount()).toBe(0);
  });
});

describe('HeroVisual (foto profesional opcional)', () => {
  it('sin foto muestra el monograma y ninguna imagen', () => {
    const { container } = render(<HeroVisual />);
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByRole('img', { name: 'Monograma MR' })).toBeInTheDocument();
  });

  it('con foto la muestra con texto alternativo, dimensiones y decodificación asíncrona', () => {
    const { container } = render(
      <HeroVisual
        photo={{ src: '/profile.webp', altKey: 'hero.visualLabel', width: 640, height: 640 }}
      />,
    );
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).toHaveAttribute('src', '/profile.webp');
    expect(img).toHaveAttribute('alt', 'Monograma MR');
    expect(img).toHaveAttribute('width', '640');
    expect(img).toHaveAttribute('height', '640');
    expect(img).toHaveAttribute('decoding', 'async');
    expect(screen.queryByRole('img', { name: 'Monograma MR' })).toBeInTheDocument(); // la propia foto
  });
});

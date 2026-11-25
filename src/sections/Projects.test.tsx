import { render, screen, within } from '@testing-library/react';
import { projects } from '@/data/projects';
import i18n from '@/i18n';
import es from '@/i18n/locales/es.json';
import { Projects } from './Projects';

const APPROVED_PROJECT_KEYS = [
  'consentManagement',
  'communityEngagement',
  'systemsAdministration',
  'healthManagement',
  'qualitySecurity',
  'accessibility',
  'ecommerce',
];

describe('Projects (denominaciones genéricas)', () => {
  it('muestra los siete proyectos con denominaciones profesionales genéricas', () => {
    render(<Projects />);
    const region = within(screen.getByRole('region', { name: 'Proyectos profesionales' }));
    expect(region.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Sistema institucional de gestión de consentimientos',
      'Plataforma institucional de vinculación con el medio',
      'Plataforma de administración de sistemas institucionales',
      'Soluciones de gestión administrativa del sector salud',
      'Aseguramiento de calidad y seguridad de aplicaciones',
      'Soluciones de accesibilidad web',
      'Desarrollo e integración de comercio electrónico',
    ]);
  });

  it('no nombra organizaciones ni usa estados de borrador', () => {
    const { container } = render(<Projects />);
    for (const org of [
      'Universidad Católica de Temuco',
      'Universidad de La Frontera',
      'Lazos',
      'C-Ram',
      'Servicio de Salud',
    ]) {
      expect(container.textContent).not.toContain(org);
    }
    expect(container.textContent).not.toMatch(/borrador|pendiente de revisión|draft/i);
  });

  it('explica que se usan denominaciones genéricas por confidencialidad', () => {
    render(<Projects />);
    expect(
      screen.getByText(/denominaciones genéricas y sin detalles internos/),
    ).toBeInTheDocument();
  });

  it('no incluye botones ni enlaces de código o demo', () => {
    render(<Projects />);
    const region = within(screen.getByRole('region', { name: 'Proyectos profesionales' }));
    expect(region.queryAllByRole('link')).toHaveLength(0);
    expect(region.queryAllByRole('button')).toHaveLength(0);
  });

  it('solo muestra tecnologías confirmadas', () => {
    render(<Projects />);
    const shown = screen.getAllByRole('article').flatMap((card) =>
      within(card)
        .queryAllByRole('listitem')
        .map((li) => li.textContent),
    );
    expect(shown.sort()).toEqual(
      [
        'React',
        'NestJS',
        'Prisma ORM',
        'PostgreSQL',
        'Docker',
        'MinIO',
        'SonarQube',
        'PrestaShop',
        'Webpay Plus',
      ].sort(),
    );
  });

  it('las claves de i18n de proyectos están limitadas al conjunto aprobado', () => {
    // Si alguien añade un proyecto, esta prueba falla y obliga a revisar docs/PUBLICACION.md.
    const sections = [
      'eyebrow',
      'title',
      'description',
      'confidentialityNote',
      'technologiesLabel',
    ];
    expect(Object.keys(es.projects).sort()).toEqual([...sections, ...APPROVED_PROJECT_KEYS].sort());
    expect(projects.map((p) => p.titleKey.split('.')[1]).sort()).toEqual(
      [...APPROVED_PROJECT_KEYS].sort(),
    );
  });

  it('se traduce al inglés', async () => {
    await i18n.changeLanguage('en');
    render(<Projects />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Application quality and security assurance' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/generic names and without internal details/)).toBeInTheDocument();
  });
});

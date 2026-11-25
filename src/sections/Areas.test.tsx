import { render, screen, within } from '@testing-library/react';
import i18n from '@/i18n';
import { Areas } from './Areas';

describe('Areas', () => {
  it('renderiza la sección con su encabezado accesible', () => {
    render(<Areas />);
    expect(screen.getByRole('region', { name: 'Tres áreas de trabajo' })).toHaveAttribute(
      'id',
      'areas',
    );
  });

  it('muestra las tres áreas profesionales con título de nivel 3', () => {
    render(<Areas />);
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Ingeniería de Software y Desarrollo Full Stack',
      'Liderazgo Técnico y Gestión de Proyectos TI',
      'Ciberseguridad y Seguridad de la Información',
    ]);
  });

  it('separa experiencia de formación en cada tarjeta', () => {
    render(<Areas />);
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(3);
    for (const card of cards) {
      const scope = within(card);
      expect(scope.getByRole('heading', { level: 4, name: 'Experiencia' })).toBeVisible();
      expect(scope.getByRole('heading', { level: 4, name: 'Formación' })).toBeVisible();
    }
  });

  it('asigna cada formación al área correspondiente, sin duplicar el detalle', () => {
    render(<Areas />);
    const [software, leadership, security] = screen
      .getAllByRole('article')
      .map((card) => within(card));
    expect(software?.getByText(/INACAP/)).toBeInTheDocument();
    expect(leadership?.getByText(/Duoc UC/)).toBeInTheDocument();
    expect(security?.getByText(/Universidad de Chile/)).toBeInTheDocument();
    expect(security?.getByText(/ISO\/IEC 27001/)).toBeInTheDocument();
    expect(leadership?.queryByText(/Santander/)).not.toBeInTheDocument();
  });

  it('se traduce al inglés', async () => {
    await i18n.changeLanguage('en');
    render(<Areas />);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Cybersecurity and Information Security' }),
    ).toBeInTheDocument();
  });
});

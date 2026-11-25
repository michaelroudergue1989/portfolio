import { render, screen } from '@testing-library/react';
import i18n from '@/i18n';
import { disabledResume, enabledResume } from '@/test/resumeHelpers';
import { Hero } from './Hero';
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

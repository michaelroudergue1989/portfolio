import { render, screen } from '@testing-library/react';
import i18n from '@/i18n';
import { Contact } from './Contact';

describe('Contact', () => {
  it('orienta el contacto a oportunidades laborales en cinco áreas de interés', () => {
    render(<Contact />);
    expect(screen.getByRole('heading', { level: 3, name: 'Áreas de interés' })).toBeInTheDocument();
    for (const area of [
      'Desarrollo de software',
      'Liderazgo técnico',
      'Gestión de proyectos TI',
      'Ciberseguridad',
      'Seguridad de la información',
    ]) {
      expect(screen.getByText(area)).toBeInTheDocument();
    }
    expect(screen.getByText(/oportunidades laborales/)).toBeInTheDocument();
  });

  it('ofrece LinkedIn (principal) y GitHub como enlaces seguros', () => {
    render(<Contact />);
    const linkedin = screen.getByRole('link', { name: /Contactar por LinkedIn/ });
    expect(linkedin).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/michael-roudergue-a69035150',
    );
    expect(linkedin).toHaveAttribute('rel', 'noopener noreferrer');
    expect(linkedin).toHaveAttribute('target', '_blank');
    const github = screen.getByRole('link', { name: /Ver perfil de GitHub/ });
    expect(github).toHaveAttribute('href', 'https://github.com/michaelroudergue1989');
    expect(screen.getByText('Región de La Araucanía, Chile')).toBeInTheDocument();
  });

  it('enlaza a la sección Currículum', () => {
    render(<Contact />);
    expect(screen.getByRole('link', { name: 'Ver currículum' })).toHaveAttribute(
      'href',
      '#resumes',
    );
  });

  it('no publica correo ni teléfono ni incluye formularios', () => {
    const { container } = render(<Contact />);
    expect(container.textContent).not.toMatch(/@|\+56|tel:/);
    expect(
      container.querySelectorAll('form, input, textarea, a[href^="mailto:"], a[href^="tel:"]'),
    ).toHaveLength(0);
  });

  it('se traduce al inglés', async () => {
    await i18n.changeLanguage('en');
    render(<Contact />);
    expect(screen.getByRole('link', { name: /Contact me on LinkedIn/ })).toBeInTheDocument();
    expect(screen.getByText('Information security')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View résumé' })).toBeInTheDocument();
  });
});

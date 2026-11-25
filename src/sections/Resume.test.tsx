import { render, screen, within } from '@testing-library/react';
import i18n from '@/i18n';
import { disabledResume, enabledResume as available } from '@/test/resumeHelpers';
import { Resume } from './Resume';

describe('Resume (estado actual: documento autorizado)', () => {
  it('muestra un único currículum profesional con título y subtítulo', () => {
    render(<Resume />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Currículum profesional' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Conoce mi trayectoria laboral, formación académica y competencias profesionales.',
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('article')).toHaveLength(1);
    expect(
      screen.getByRole('heading', { level: 3, name: 'Michael Roudergue' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ingeniero en Informática')).toBeInTheDocument();
  });

  it('lista las áreas del perfil', () => {
    render(<Resume />);
    const list = screen.getByRole('list', { name: 'Áreas del perfil' });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([
      'Ingeniería de Software',
      'Liderazgo Técnico',
      'Gestión de Proyectos TI',
      'Ciberseguridad',
    ]);
  });

  it('muestra formato PDF, idioma, páginas verificadas y fecha de actualización', () => {
    render(<Resume />);
    expect(
      screen.getByText('PDF · Español · 2 páginas · Actualizado: noviembre de 2026'),
    ).toBeInTheDocument();
  });

  it('no menciona currículums especializados ni etiquetas obsoletas', () => {
    const { container } = render(<Resume />);
    const text = container.textContent;
    for (const obsolete of [
      'Jefatura de Proyectos TI',
      'Desarrollo de Software',
      'especializados',
      'CV Maestro',
      'Currículum principal',
      'Currículums',
    ]) {
      expect(text).not.toContain(obsolete);
    }
  });

  it('con el manifiesto real ofrece descarga y visualización sin estados deshabilitados', () => {
    render(<Resume />);
    expect(screen.getByRole('link', { name: /Descargar CV/ })).toHaveAttribute(
      'href',
      '/cv/michael-roudergue-cv.pdf',
    );
    expect(screen.getByRole('link', { name: /Visualizar CV/ })).toHaveAttribute('target', '_blank');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByText('No disponible')).not.toBeInTheDocument();
  });

  it('sin autorización prepara las dos acciones, deshabilitadas y sin enlaces ni descargas', () => {
    const { container } = render(<Resume item={disabledResume()} />);
    const download = screen.getByRole('button', { name: 'Descargar CV' });
    const view = screen.getByRole('button', { name: 'Visualizar CV' });
    expect(download).toBeDisabled();
    expect(view).toBeDisabled();
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(container.querySelectorAll('[download], a[href$=".pdf"]')).toHaveLength(0);
    expect(screen.getByText('No disponible')).toBeInTheDocument();
    expect(download).toHaveAccessibleDescription(/No disponible/);
  });
});

describe('Resume (disponibilidad condicionada)', () => {
  it('habilita descarga y visualización apuntando al mismo PDF', () => {
    render(<Resume item={available()} />);
    const download = screen.getByRole('link', { name: /Descargar CV/ });
    const view = screen.getByRole('link', { name: /Visualizar CV/ });
    expect(download).toHaveAttribute('href', '/cv/michael-roudergue-cv.pdf');
    expect(download).toHaveAttribute('download', 'michael-roudergue-cv.pdf');
    expect(view).toHaveAttribute('href', '/cv/michael-roudergue-cv.pdf');
    expect(download).toHaveAttribute('hreflang', 'es');
    expect(screen.queryAllByRole('button')).toHaveLength(0);
    expect(screen.queryByText('No disponible')).not.toBeInTheDocument();
  });

  it('la visualización abre una pestaña nueva de forma segura y la descarga no', () => {
    render(<Resume item={available()} />);
    const view = screen.getByRole('link', { name: /Visualizar CV/ });
    expect(view).toHaveAttribute('target', '_blank');
    expect(view).toHaveAttribute('rel', 'noopener noreferrer');
    expect(view).toHaveAccessibleName(/abre en una pestaña nueva/i);
    expect(screen.getByRole('link', { name: /Descargar CV/ })).not.toHaveAttribute('target');
  });

  it('usa la fecha y el número de páginas del manifiesto', () => {
    render(<Resume item={available({ updatedAt: '2027-01-15', pages: 1 })} />);
    expect(
      screen.getByText('PDF · Español · 1 página · Actualizado: enero de 2027'),
    ).toBeInTheDocument();
  });

  it('traduce las acciones y la información al inglés', async () => {
    await i18n.changeLanguage('en');
    render(<Resume item={available()} />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'Professional résumé' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download CV/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View CV/ })).toBeInTheDocument();
    expect(
      screen.getByText('PDF · Spanish · 2 pages · Updated: November 2026'),
    ).toBeInTheDocument();
  });

  it.each([
    ['ruta fuera de /cv/', { path: '/otro/cv.pdf' }],
    ['ruta con subdirectorio', { path: '/cv/../secreto.pdf' }],
    ['URL externa', { path: 'https://example.com/cv.pdf' }],
    ['fecha mal formada', { updatedAt: 'ayer' }],
    ['número de páginas inválido', { pages: 0 }],
  ])('no genera enlaces si el CV habilitado tiene %s', (_name, overrides) => {
    render(<Resume item={available(overrides)} />);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Descargar CV' })).toBeDisabled();
    expect(within(screen.getByRole('region')).getByText('No disponible')).toBeInTheDocument();
  });
});

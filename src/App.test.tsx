import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { footerNavItems, navItems } from '@/data/navigation';
import { SECTION_IDS } from '@/data/sections';
import i18n from '@/i18n';
import { initTheme } from '@/lib/theme';

describe('App (layout, navegación e integración)', () => {
  afterEach(() => {
    window.history.replaceState(null, '', window.location.pathname);
  });

  it('expone los landmarks principales y un único h1', () => {
    render(<App />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Navegación rápida' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('la jerarquía de encabezados empieza en h1 y no salta niveles', () => {
    render(<App />);
    const levels = screen.getAllByRole('heading').map((h) => Number(h.tagName.slice(1)));
    expect(levels[0]).toBe(1);
    levels.forEach((level, index) => {
      if (index > 0) expect(level).toBeLessThanOrEqual((levels[index - 1] ?? 0) + 1);
    });
  });

  it('renderiza todas las secciones con identificadores únicos y estables', () => {
    const { container } = render(<App />);
    for (const id of Object.values(SECTION_IDS)) {
      expect(container.querySelectorAll(`#${id}`), `#${id}`).toHaveLength(1);
    }
    const allIds = [...container.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(allIds).size).toBe(allIds.length);
  });

  it('cada sección con aria-labelledby apunta a un encabezado existente', () => {
    const { container } = render(<App />);
    for (const section of container.querySelectorAll('section[aria-labelledby]')) {
      const id = section.getAttribute('aria-labelledby') ?? '';
      expect(container.querySelector(`#${id}`), id).toBeInTheDocument();
    }
  });

  it('el enlace de salto es el primer elemento enfocable y apunta a <main>', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.tab();
    const skip = screen.getByRole('link', { name: 'Saltar al contenido principal' });
    expect(skip).toHaveFocus();
    expect(skip).toHaveAttribute('href', '#main');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
  });

  it('todos los enlaces de la navegación principal están habilitados y apuntan a secciones existentes', () => {
    const { container } = render(<App />);
    const nav = within(screen.getByRole('navigation', { name: 'Navegación principal' }));
    const links = nav.getAllByRole('link');
    expect(links).toHaveLength(navItems.length);
    for (const item of navItems) {
      const link = nav.getByRole('link', { name: i18n.t(item.labelKey) });
      expect(link).toHaveAttribute('href', `#${item.targetId}`);
      expect(container.querySelector(`#${item.targetId}`), item.targetId).toBeInTheDocument();
    }
    expect(screen.queryByText(/próximamente/i)).not.toBeInTheDocument();
  });

  it('todos los enlaces internos de la página (cabecera y pie) tienen destino', () => {
    const { container } = render(<App />);
    const anchors = [...container.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
    expect(anchors.length).toBeGreaterThan(navItems.length);
    for (const anchor of anchors) {
      const id = (anchor.getAttribute('href') ?? '').slice(1);
      expect(container.querySelector(`#${id}`), `destino de ${anchor.textContent}`).not.toBeNull();
    }
  });

  it('el pie incluye navegación rápida con Currículum y perfiles profesionales', () => {
    render(<App />);
    const quick = within(screen.getByRole('navigation', { name: 'Navegación rápida' }));
    expect(quick.getAllByRole('link')).toHaveLength(footerNavItems.length);
    expect(quick.getByRole('link', { name: 'Currículum' })).toHaveAttribute('href', '#resumes');
    const footer = within(screen.getByRole('contentinfo'));
    expect(footer.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/michael-roudergue-a69035150',
    );
    expect(footer.getByRole('link', { name: /GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/michaelroudergue1989',
    );
    expect(footer.getByText(/Todos los derechos reservados/)).toBeInTheDocument();
  });

  it('cambia el idioma en toda la interfaz', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'EN, English' }));
    expect(document.documentElement).toHaveAttribute('lang', 'en');
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Work experience' })).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toHaveTextContent('All rights reserved');
  });

  it('cambia el tema desde la cabecera', async () => {
    const user = userEvent.setup();
    initTheme();
    render(<App />);
    await user.click(screen.getByRole('button', { name: 'Cambiar a tema oscuro' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  });

  it('todos los enlaces externos usan https y rel seguro', () => {
    render(<App />);
    const external = screen
      .getAllByRole('link')
      .filter((link) => !link.getAttribute('href')?.startsWith('#'))
      .filter((link) => link.getAttribute('href') !== '/cv/michael-roudergue-cv.pdf');
    expect(external.length).toBeGreaterThan(0);
    for (const link of external) {
      expect(link.getAttribute('href')).toMatch(/^https:\/\//);
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('solo incluye descargas del CV público; sin correo, teléfono ni formularios', () => {
    const { container } = render(<App />);
    const downloads = container.querySelectorAll('a[download]');
    expect(downloads.length).toBeGreaterThan(0);
    for (const link of downloads) {
      expect(link.getAttribute('href')).toBe('/cv/michael-roudergue-cv.pdf');
    }
    const pdfLinks = container.querySelectorAll('a[href$=".pdf"]');
    for (const link of pdfLinks) {
      expect(link.getAttribute('href')).toBe('/cv/michael-roudergue-cv.pdf');
    }
    expect(container.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]')).toHaveLength(0);
    expect(container.querySelectorAll('form, input, textarea')).toHaveLength(0);
  });

  it('el acceso directo por fragmento desplaza a la sección indicada', () => {
    const scrolled: string[] = [];
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this.id);
    };
    window.history.replaceState(null, '', '#experience');
    render(<App />);
    expect(scrolled).toEqual(['experience']);
  });
});

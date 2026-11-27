import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { BOTTOM_NAV_QUERY, bottomNavItems, extendedNavItems } from '@/data/navigation';
import i18n from '@/i18n';
import { mockViewport } from '@/test/matchMedia';
import { BottomNav } from './BottomNav';

const SHORTCUTS = {
  es: ['Inicio', 'Experiencia', 'Proyectos', 'CV', 'Contacto'],
  en: ['Home', 'Experience', 'Projects', 'Résumé', 'Contact'],
} as const;
const HREFS = ['#home', '#experience', '#projects', '#resumes', '#contact'];

const onPhone = (query: string) => query === BOTTOM_NAV_QUERY;
const bar = (name = 'Accesos directos') => screen.queryByRole('navigation', { name });

describe('BottomNav', () => {
  it.each([
    ['es', 'Accesos directos'],
    ['en', 'Shortcuts'],
  ] as const)('(%s) cinco enlaces traducidos, con su icono decorativo', async (lang, label) => {
    await i18n.changeLanguage(lang);
    render(<BottomNav activeId={null} />);
    const links = within(screen.getByRole('navigation', { name: label })).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(SHORTCUTS[lang]);
    expect(links.map((link) => link.getAttribute('href'))).toEqual(HREFS);
    for (const link of links) {
      expect(link.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(link).not.toHaveAttribute('aria-label'); // el nombre accesible es el texto visible
      expect(link).not.toHaveAttribute('download');
    }
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('marca solo la sección activa con aria-current', () => {
    render(<BottomNav activeId="projects" />);
    expect(screen.getByRole('link', { name: 'Proyectos' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(1);
  });

  it.each(['about', 'skills', 'education', 'certifications', null])(
    'en una sección sin acceso (%s) no marca ninguno',
    (activeId) => {
      render(<BottomNav activeId={activeId} />);
      expect(document.querySelectorAll('[aria-current]')).toHaveLength(0);
    },
  );

  it('reutiliza los destinos existentes (sin un segundo sistema de anclas)', () => {
    const targets = new Set(extendedNavItems.map((item) => item.targetId));
    expect(bottomNavItems.every((item) => targets.has(item.targetId))).toBe(true);
    expect(bottomNavItems).toHaveLength(5);
  });
});

describe('barra inferior en la aplicación', () => {
  it('no existe fuera de las ventanas previstas: ni controles ni espacio reservado', () => {
    const { container } = render(<App />);
    expect(bar()).not.toBeInTheDocument();
    expect(container.querySelector('[data-bottom-nav]')).toBeNull();
    expect(container.querySelector('.h-\\(--bottom-nav-space\\)')).toBeNull();
  });

  it('aparece y desaparece al cambiar la ventana, sin dejar listeners al desmontar', () => {
    const viewport = mockViewport(() => false);
    const { unmount } = render(<App />);
    expect(bar()).not.toBeInTheDocument();
    act(() => {
      viewport.change(onPhone);
    });
    expect(bar()).toBeInTheDocument();
    act(() => {
      viewport.change(() => false);
    });
    expect(bar()).not.toBeInTheDocument();
    unmount();
    expect(viewport.listenerCount()).toBe(0);
  });

  it('va después del contenido y del pie en el orden del documento', () => {
    mockViewport(onPhone);
    render(<App />);
    const footer = screen.getByRole('contentinfo');
    const nav = screen.getByRole('navigation', { name: 'Accesos directos' });
    expect(footer.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('se oculta mientras el menú móvil está abierto y vuelve al cerrarlo', async () => {
    mockViewport(onPhone);
    const user = userEvent.setup();
    render(<App />);
    const nav = screen.getByRole('navigation', { name: 'Accesos directos' });
    expect(nav).not.toHaveClass('invisible');

    await user.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }));
    expect(nav).toHaveClass('invisible');
    const menu = screen.getByRole('navigation', { name: 'Menú de navegación' });
    expect(within(menu).getAllByRole('link')).toHaveLength(9); // el menú conserva todo

    await user.keyboard('{Escape}');
    expect(nav).not.toHaveClass('invisible');
  });
});

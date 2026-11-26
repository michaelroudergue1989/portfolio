import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { extendedNavItems } from '@/data/navigation';
import i18n from '@/i18n';
import { MobileMenu } from './MobileMenu';

const openLabel = 'Abrir menú de navegación';
const closeLabel = 'Cerrar menú de navegación';

describe('MobileMenu', () => {
  it('está cerrado inicialmente y expone aria-expanded/aria-controls', () => {
    render(<MobileMenu />);
    const button = screen.getByRole('button', { name: openLabel });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('se abre y se cierra con el botón', async () => {
    const user = userEvent.setup();
    render(<MobileMenu />);

    await user.click(screen.getByRole('button', { name: openLabel }));
    const button = screen.getByRole('button', { name: closeLabel });
    expect(button).toHaveAttribute('aria-expanded', 'true');
    const panelId = button.getAttribute('aria-controls');
    expect(panelId).toBeTruthy();
    expect(document.getElementById(panelId ?? '')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Menú de navegación' })).toBeInTheDocument();

    await user.click(button);
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('Escape cierra el menú y devuelve el foco al botón', async () => {
    const user = userEvent.setup();
    render(<MobileMenu />);
    await user.click(screen.getByRole('button', { name: openLabel }));
    await user.tab(); // foco hacia el primer enlace del panel
    expect(screen.getByRole('link', { name: 'Inicio' })).toHaveFocus();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: openLabel })).toHaveFocus();
  });

  it('se cierra al activar un enlace', async () => {
    const user = userEvent.setup();
    render(<MobileMenu />);
    await user.click(screen.getByRole('button', { name: openLabel }));
    await user.click(screen.getByRole('link', { name: 'Inicio' }));
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('se cierra al hacer clic fuera', async () => {
    const user = userEvent.setup();
    render(
      <>
        <button type="button">Fuera</button>
        <MobileMenu />
      </>,
    );
    await user.click(screen.getByRole('button', { name: openLabel }));
    await user.click(screen.getByRole('button', { name: 'Fuera' }));
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('se cierra cuando el foco sale del menú con Tab', async () => {
    const user = userEvent.setup();
    render(
      <>
        <MobileMenu />
        <button type="button">Siguiente</button>
      </>,
    );
    await user.click(screen.getByRole('button', { name: openLabel }));
    for (const link of screen.getAllByRole('link')) {
      await user.tab(); // recorre los enlaces del panel
      expect(link).toHaveFocus();
    }
    await user.tab(); // sale del menú
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveFocus();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('ofrece los nueve enlaces funcionales, sin estados "Próximamente"', async () => {
    const user = userEvent.setup();
    render(<MobileMenu />);
    await user.click(screen.getByRole('button', { name: openLabel }));
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(9);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(
      extendedNavItems.map((item) => `#${item.targetId}`),
    );
    expect(screen.queryByText(/próximamente/i)).not.toBeInTheDocument();
  });

  it.each([
    ['es', 'Currículum', openLabel],
    ['en', 'Résumé', 'Open navigation menu'],
  ])(
    '(%s) "%s" lleva a la sección sin descargar el PDF y cierra el menú',
    async (lang, name, open) => {
      await i18n.changeLanguage(lang);
      const user = userEvent.setup();
      render(<MobileMenu activeId="resumes" />);
      await user.click(screen.getByRole('button', { name: open }));
      const link = screen.getByRole('link', { name });
      expect(link).toHaveAttribute('href', '#resumes');
      expect(link).not.toHaveAttribute('download');
      expect(link).toHaveAttribute('aria-current', 'location');
      await user.click(link);
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    },
  );

  it('resalta la sección activa con aria-current', async () => {
    const user = userEvent.setup();
    render(<MobileMenu activeId="experience" />);
    await user.click(screen.getByRole('button', { name: openLabel }));
    expect(screen.getByRole('link', { name: 'Experiencia' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    expect(screen.getByRole('link', { name: 'Inicio' })).not.toHaveAttribute('aria-current');
  });
});

import { render, screen } from '@testing-library/react';
import { ExternalLink } from './ExternalLink';

describe('ExternalLink', () => {
  it('renderiza un enlace https con target y rel seguros', () => {
    render(<ExternalLink href="https://github.com/michaelroudergue1989">GitHub</ExternalLink>);
    const link = screen.getByRole('link', { name: /GitHub/ });
    expect(link).toHaveAttribute('href', 'https://github.com/michaelroudergue1989');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('anuncia que se abre en una pestaña nueva', () => {
    render(<ExternalLink href="https://example.com">Sitio</ExternalLink>);
    expect(screen.getByRole('link')).toHaveAccessibleName('Sitio (se abre en una pestaña nueva)');
  });

  it('sin pestaña nueva no usa target ni anuncio, pero mantiene rel', () => {
    render(
      <ExternalLink href="https://example.com" newTab={false}>
        Sitio
      </ExternalLink>,
    );
    const link = screen.getByRole('link', { name: 'Sitio' });
    expect(link).not.toHaveAttribute('target');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it.each(['http://example.com', 'javascript:alert(1)', '/interno', 'https://u:p@example.com', ''])(
    'no genera enlace para %j',
    (href) => {
      render(<ExternalLink href={href}>Texto</ExternalLink>);
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
      expect(screen.getByText('Texto')).toBeInTheDocument();
    },
  );
});

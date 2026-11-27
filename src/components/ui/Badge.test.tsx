import { render, screen } from '@testing-library/react';
import { Areas } from '@/sections/Areas';
import { Education } from '@/sections/Education';
import { Experience } from '@/sections/Experience';
import { Projects } from '@/sections/Projects';
import { Skills } from '@/sections/Skills';
import { Badge } from './Badge';

const badges = (container: HTMLElement) => [...container.querySelectorAll('.tech-badge')];

describe('etiquetas de tecnologías (realce al pasar el puntero)', () => {
  it('solo la variante tech lleva el realce y sigue siendo informativa', () => {
    render(
      <>
        <Badge tech>React</Badge>
        <Badge>216 horas</Badge>
      </>,
    );
    const tech = screen.getByText('React');
    expect(tech).toHaveClass('tech-badge');
    expect(tech.tagName).toBe('SPAN');
    expect(tech).not.toHaveAttribute('tabindex');
    expect(tech).not.toHaveAttribute('role');
    expect(tech.className).not.toMatch(/cursor-pointer/);
    expect(screen.getByText('216 horas')).not.toHaveClass('tech-badge');
  });

  it.each([
    ['Áreas', Areas],
    ['Experiencia', Experience],
    ['Proyectos', Projects],
  ] as const)('%s marca sus tecnologías', (_, Section) => {
    const { container } = render(<Section />);
    expect(badges(container).length).toBeGreaterThan(0);
    for (const badge of badges(container)) expect(badge).toHaveClass('font-mono');
  });

  it('en Habilidades marca las tecnologías y no cargos, metodologías ni competencias', () => {
    const { container } = render(<Skills />);
    const names = badges(container).map((badge) => badge.textContent);
    for (const name of ['React', 'NestJS', 'Prisma ORM', 'PostgreSQL', 'Docker', 'PHP']) {
      expect(names).toContain(name);
    }
    for (const name of ['Tech Lead', 'Scrum', 'PMBOK v6', 'Ciberseguridad', 'Full Stack']) {
      expect(names.some((value) => value.startsWith(name))).toBe(false);
    }
    // React figura en las principales y en el grupo de lenguajes y frameworks.
    expect(names.filter((value) => value === 'React')).toHaveLength(2);
  });

  it('Formación no usa el realce', () => {
    const { container } = render(<Education />);
    expect(badges(container)).toHaveLength(0);
  });
});

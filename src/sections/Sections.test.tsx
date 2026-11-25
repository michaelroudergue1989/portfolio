import { render, screen, within } from '@testing-library/react';
import i18n from '@/i18n';
import { About } from './About';
import { Certifications } from './Certifications';
import { Education } from './Education';
import { Experience } from './Experience';
import { Skills } from './Skills';
import { Stats } from './Stats';

describe('Stats', () => {
  it('muestra solo los cuatro indicadores acordados', () => {
    render(<Stats />);
    const items = within(
      screen.getByRole('region', { name: 'Indicadores profesionales' }),
    ).getAllByRole('listitem');
    expect(items.map((li) => li.textContent)).toEqual([
      '9+Años de experiencia profesional',
      '4Experiencias laborales',
      '366Horas de formación (diplomado y postítulo)',
      '3Áreas profesionales',
    ]);
  });
});

describe('About', () => {
  it('está redactada en primera persona y lista las tres líneas', () => {
    render(<About />);
    expect(screen.getByText(/^Soy Ingeniero en Informática con más de 9 años/)).toBeInTheDocument();
    expect(screen.getByText('Mi orientación profesional integra tres líneas:')).toBeInTheDocument();
    expect(screen.getByText('Michael Rodrigo Roudergue Inostroza')).toBeInTheDocument();
  });
});

describe('Experience', () => {
  it('lista los cuatro empleos en orden cronológico inverso', () => {
    render(<Experience />);
    const titles = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(titles).toEqual([
      'Universidad Católica de Temuco',
      'Universidad de La Frontera',
      'Lazos S.A. - Servicio de Salud Araucanía Sur',
      'C-Ram Ingeniería',
    ]);
  });

  it('muestra cargos, unidad, periodos y tecnologías confirmados', () => {
    render(<Experience />);
    const periodOf = (text: string) =>
      screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === text);
    expect(periodOf('Mayo 2025 – Actualidad')).toBeInTheDocument();
    expect(periodOf('Agosto 2021 – Diciembre 2024')).toBeInTheDocument();
    expect(periodOf('Agosto 2017 – Julio 2021')).toBeInTheDocument();
    expect(periodOf('Junio 2016 – Julio 2017')).toBeInTheDocument();
    expect(screen.getByText('Analista / Desarrollador de Software')).toBeInTheDocument();
    expect(screen.getByText('Dirección de Vinculación con el Medio')).toBeInTheDocument();
    expect(screen.getByText('Webmaster / Desarrollador Web')).toBeInTheDocument();
    expect(screen.getByText('Carbone.io')).toBeInTheDocument();
    expect(screen.getByText('Webpay Plus')).toBeInTheDocument();
  });

  it('usa elementos <time> con fechas ISO', () => {
    const { container } = render(<Experience />);
    const values = [...container.querySelectorAll('time')].map((t) => t.getAttribute('datetime'));
    expect(values).toContain('2025-05');
    expect(values).toContain('2024-12');
  });

  it('formatea los periodos en inglés', async () => {
    await i18n.changeLanguage('en');
    render(<Experience />);
    expect(
      screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === 'May 2025 – Present'),
    ).toBeInTheDocument();
    expect(screen.getByText('Software Analyst / Developer')).toBeInTheDocument();
  });
});

describe('Skills', () => {
  it('agrupa las habilidades principales por nivel de autoevaluación', () => {
    render(<Skills />);
    const advanced = screen.getByRole('heading', { name: 'Avanzado' }).closest('div');
    const intermediate = screen.getByRole('heading', { name: 'Intermedio' }).closest('div');
    expect(
      within(advanced as HTMLElement)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual(['Full Stack', 'PHP', 'JavaScript', 'Tech Lead']);
    expect(within(intermediate as HTMLElement).getAllByRole('listitem')).toHaveLength(6);
  });

  it('no muestra porcentajes de dominio', () => {
    const { container } = render(<Skills />);
    expect(container.textContent).not.toMatch(/\d\s?%/);
    expect(container.querySelector('[role="progressbar"], progress, meter')).toBeNull();
  });

  it('organiza las tecnologías por categorías y marca las respaldadas por formación', () => {
    render(<Skills />);
    for (const group of [
      'Lenguajes y frameworks',
      'Bases de datos',
      'Infraestructura y herramientas',
      'Gestión de proyectos',
      'Ciberseguridad',
    ]) {
      expect(screen.getByRole('heading', { level: 4, name: group })).toBeInTheDocument();
    }
    expect(screen.getByText('Ley 21.719').parentElement).toHaveTextContent(
      'Competencia respaldada principalmente por formación académica',
    );
    expect(screen.getByText('Seguridad de software').parentElement).not.toHaveTextContent(
      'formación académica',
    );
  });
});

describe('Education', () => {
  it('muestra las tres formaciones con institución, horas y estado', () => {
    render(<Education />);
    const [post, dip, ing] = screen.getAllByRole('article').map((a) => within(a));
    expect(post?.getByText('Diploma de Postítulo en Ciberseguridad')).toBeInTheDocument();
    expect(post?.getByText('Universidad de Chile')).toBeInTheDocument();
    expect(post?.getByText('2026')).toBeInTheDocument();
    expect(post?.getByText('216 horas')).toBeInTheDocument();
    expect(post?.getByText('Aprobado')).toBeInTheDocument();
    expect(dip?.getByText('Duoc UC')).toBeInTheDocument();
    expect(dip?.getByText('150 horas')).toBeInTheDocument();
    expect(dip?.getByText('Formación en PMBOK v6 y Scrum.')).toBeInTheDocument();
    expect(ing?.getByText('INACAP')).toBeInTheDocument();
    expect(ing?.getByText('2009–2016')).toBeInTheDocument();
  });

  it('conserva la denominación original y añade glosa en inglés', async () => {
    await i18n.changeLanguage('en');
    render(<Education />);
    const original = screen.getByText('Diploma de Postítulo en Ciberseguridad');
    expect(original).toHaveAttribute('lang', 'es');
    expect(original.parentElement).toHaveTextContent(
      'Diploma de Postítulo en Ciberseguridad (Postgraduate Diploma in Cybersecurity)',
    );
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });
});

describe('Certifications', () => {
  it('separa la certificación profesional de los cursos', () => {
    render(<Certifications />);
    const professional = within(
      screen
        .getByRole('heading', { name: 'Certificación profesional' })
        .closest('div') as HTMLElement,
    );
    expect(professional.getAllByRole('listitem')).toHaveLength(1);
    expect(
      professional.getByText(/Scrum Foundation Professional Certification/),
    ).toBeInTheDocument();
    const courses = within(
      screen
        .getByRole('heading', { name: 'Cursos y certificados de finalización' })
        .closest('div') as HTMLElement,
    );
    expect(courses.getAllByRole('listitem')).toHaveLength(7);
    expect(courses.queryByText(/Scrum Foundation/)).not.toBeInTheDocument();
  });

  it('aclara que el curso ISO/IEC 27001 no es una certificación acreditada', () => {
    render(<Certifications />);
    expect(
      screen.getByText(
        /No corresponde a una certificación profesional acreditada de implementador o auditor ISO/,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('Udemy · 2026 · 11 horas')).toBeInTheDocument();
  });

  it('no inventa enlaces ni identificadores de credenciales', () => {
    render(<Certifications />);
    expect(screen.queryAllByRole('link')).toHaveLength(0);
  });
});

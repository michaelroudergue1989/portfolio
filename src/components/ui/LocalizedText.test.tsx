import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { createInstance } from 'i18next';
import en from '@/i18n/locales/en.json';
import es from '@/i18n/locales/es.json';
import i18n from '@/i18n';
import { Areas } from '@/sections/Areas';
import { Certifications } from '@/sections/Certifications';
import { Education } from '@/sections/Education';
import { Experience } from '@/sections/Experience';
import { Hero } from '@/sections/Hero';
import { LocalizedText } from './LocalizedText';

/** Recorre un recurso i18n y devuelve [clave, texto] de las cadenas. */
function flatten(node: unknown, prefix = ''): [string, string][] {
  if (typeof node === 'string') return [[prefix, node]];
  if (typeof node !== 'object' || node === null) return [];
  return Object.entries(node).flatMap(([key, value]) =>
    flatten(value, prefix ? `${prefix}.${key}` : key),
  );
}

const MARKED = flatten(en).filter(([, text]) => text.includes('<es>'));

describe('LocalizedText (WCAG 3.1.2: idioma de las partes)', () => {
  it('convierte <es>…</es> en un fragmento con lang="es" y deja el resto sin marcar', async () => {
    const instance = createInstance();
    await instance.init({
      lng: 'en',
      resources: { en: { translation: { k: 'Title <es>Ingeniería</es> (Engineering)' } } },
    });
    const { container } = render(
      <I18nextProvider i18n={instance}>
        <p>
          <LocalizedText i18nKey="k" />
        </p>
      </I18nextProvider>,
    );
    const part = screen.getByText('Ingeniería');
    expect(part.tagName).toBe('SPAN');
    expect(part).toHaveAttribute('lang', 'es');
    expect(container.querySelectorAll('[lang]')).toHaveLength(1);
    expect(container.textContent).toBe('Title Ingeniería (Engineering)');
  });

  it('muestra las cadenas sin marcas tal cual, sin lang', async () => {
    const instance = createInstance();
    await instance.init({ lng: 'es', resources: { es: { translation: { k: 'Texto simple' } } } });
    const { container } = render(
      <I18nextProvider i18n={instance}>
        <LocalizedText i18nKey="k" />
      </I18nextProvider>,
    );
    expect(container.textContent).toBe('Texto simple');
    expect(container.querySelector('[lang]')).toBeNull();
  });
});

describe('marcas de idioma en los recursos de i18n', () => {
  it('hay fragmentos marcados en inglés (títulos oficiales) y ninguno en español', () => {
    expect(MARKED.length).toBeGreaterThanOrEqual(13);
    expect(flatten(es).filter(([, text]) => /<\/?es>/.test(text))).toEqual([]);
  });

  it('las etiquetas están balanceadas y no anidadas', () => {
    for (const [key, text] of MARKED) {
      const opens = text.match(/<es>/g)?.length ?? 0;
      const closes = text.match(/<\/es>/g)?.length ?? 0;
      expect([key, opens]).toEqual([key, closes]);
      expect(text, key).not.toMatch(/<es>[^<]*<es>/);
      expect(text, key).not.toMatch(/<es><\/es>/);
    }
  });

  it('cada fragmento marcado es el texto original en español de la misma clave', () => {
    const spanish = new Map(flatten(es));
    for (const [key, text] of MARKED) {
      for (const match of text.matchAll(/<es>([^<]+)<\/es>/g)) {
        expect(spanish.get(key), key).toContain(match[1]);
      }
    }
  });

  it('el resto de textos en inglés no usa otras etiquetas', () => {
    for (const [key, text] of flatten(en)) {
      expect(text.replace(/<\/?es>/g, ''), key).not.toMatch(/[<>]/);
    }
  });
});

describe('las secciones marcan en inglés los nombres oficiales en español', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en');
  });

  const langOf = (name: string) => screen.getByText(name).closest('[lang]')?.getAttribute('lang');

  it('formación', () => {
    render(<Education />);
    for (const name of [
      'Diploma de Postítulo en Ciberseguridad',
      'Diplomado en Gestión y Dirección de Proyectos TI',
      'Ingeniería en Informática',
    ]) {
      expect(langOf(name), name).toBe('es');
    }
  });

  it('certificaciones y cursos', () => {
    render(<Certifications />);
    for (const name of [
      'Curso Internacional de ISO/IEC 27001 Lead Implementer',
      'Aplicación Norma ISO 9001:2015',
      'Gestión de Proyectos con Metodologías Ágiles',
      'Introducción a la Inteligencia Artificial',
      'Ley de Protección de Datos 21.719',
      'Normas y Procedimientos de Protección de Datos Personales',
    ]) {
      expect(langOf(name), name).toBe('es');
    }
  });

  it('experiencia (unidad), áreas (formación) y Hero (cierre)', () => {
    render(
      <>
        <Hero />
        <Areas />
        <Experience />
      </>,
    );
    expect(langOf('Dirección de Vinculación con el Medio')).toBe('es');
    expect(
      screen
        .getAllByText('Diploma de Postítulo en Ciberseguridad')
        .every((element) => element.getAttribute('lang') === 'es'),
    ).toBe(true);
    expect(screen.getAllByText('Diplomado en Gestión y Dirección de Proyectos TI')).toHaveLength(2);
  });

  it('en español no se marca ningún fragmento', async () => {
    await i18n.changeLanguage('es');
    const { container } = render(
      <>
        <Hero />
        <Education />
        <Certifications />
        <Experience />
      </>,
    );
    expect(container.querySelector('[lang]')).toBeNull();
  });
});

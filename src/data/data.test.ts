import i18n from '@/i18n';
import { parseSafeHttpsUrl } from '@/lib/url';
import { areas } from './areas';
import { certifications } from './certifications';
import { contactLinks } from './contact';
import { education } from './education';
import { experience } from './experience';
import { footerNavItems, navItems } from './navigation';
import { profile } from './profile';
import { projects } from './projects';
import { resume } from './resume';
import { coreSkills, skillGroups } from './skills';

function allI18nKeys(): string[] {
  return [
    profile.titleKey,
    profile.locationKey,
    ...navItems.map((i) => i.labelKey),
    ...footerNavItems.map((i) => i.labelKey),
    ...areas.flatMap((a) => [
      a.titleKey,
      a.shortTitleKey,
      a.descriptionKey,
      ...a.experienceKeys,
      ...a.trainingKeys,
    ]),
    ...experience.flatMap((e) => [
      e.roleKey,
      ...(e.unitKey ? [e.unitKey] : []),
      ...e.responsibilityKeys,
    ]),
    ...projects.flatMap((p) => [p.titleKey, p.descriptionKey]),
    ...coreSkills.flatMap((s) => (s.nameKey ? [s.nameKey] : [])),
    ...skillGroups.flatMap((g) => [
      g.titleKey,
      ...g.skills.flatMap((s) => (s.nameKey ? [s.nameKey] : [])),
    ]),
    ...education.flatMap((e) => [
      e.titleKey,
      ...(e.statusKey ? [e.statusKey] : []),
      ...(e.noteKey ? [e.noteKey] : []),
    ]),
    ...certifications.flatMap((c) => [c.nameKey, ...(c.noteKey ? [c.noteKey] : [])]),
    ...contactLinks.map((c) => c.labelKey),
  ];
}

describe('integridad de los datos', () => {
  it.each(['es', 'en'])('todas las claves de i18n usadas por los datos existen en %s', (lng) => {
    const missing = allI18nKeys().filter((key) => !i18n.exists(key, { lng }));
    expect(missing).toEqual([]);
  });

  it('los ids de cada colección son únicos', () => {
    for (const list of [areas, experience, projects, education, certifications, contactLinks]) {
      const ids = list.map((item) => item.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('la experiencia está en orden cronológico inverso y solo el cargo vigente está abierto', () => {
    const starts = experience.map((e) => e.period.start.year * 12 + e.period.start.month);
    expect(starts).toEqual([...starts].sort((a, b) => b - a));
    expect(experience.filter((e) => e.period.end === 'present').map((e) => e.id)).toEqual(['uct']);
    expect(experience).toHaveLength(4);
  });

  it('las horas de formación suman 366 (216 + 150)', () => {
    expect(education.reduce((sum, e) => sum + (e.hours ?? 0), 0)).toBe(366);
    expect(education.find((e) => e.id === 'postitulo-ciberseguridad')?.hours).toBe(216);
    expect(education.find((e) => e.id === 'diplomado-proyectos-ti')?.hours).toBe(150);
  });

  it('solo SFPC es certificación profesional; el resto son cursos', () => {
    expect(certifications.filter((c) => c.kind === 'certification').map((c) => c.id)).toEqual([
      'sfpc',
    ]);
    expect(certifications.filter((c) => c.kind === 'course')).toHaveLength(7);
  });

  it('no hay enlaces de credenciales, repositorios ni demos inventados', () => {
    expect(certifications.some((c) => c.credentialUrl)).toBe(false);
    expect(projects.some((p) => p.repositoryUrl ?? p.demoUrl)).toBe(false);
  });

  it('hay un único currículum público, disponible, con metadatos verificados', () => {
    expect(Object.keys(resume).sort()).toEqual(
      ['available', 'language', 'pages', 'path', 'updatedAt'].sort(),
    );
    expect(resume.available).toBe(true);
    expect(resume.updatedAt).toBe('2026-11-25');
    expect(resume.path).toBe('/cv/michael-roudergue-cv.pdf');
    expect(resume.language).toBe('es');
    expect(resume.pages).toBe(2);
  });

  it('los proyectos publicados son genéricos: sin organización, estado de borrador ni enlaces', () => {
    expect(projects).toHaveLength(7);
    for (const project of projects) {
      expect(Object.keys(project).sort()).toEqual(
        ['areaIds', 'descriptionKey', 'id', 'technologies', 'titleKey'].sort(),
      );
    }
  });

  it('las habilidades principales usan solo los niveles confirmados', () => {
    const byLevel = (level: string) => coreSkills.filter((s) => s.level === level).map((s) => s.id);
    expect(byLevel('advanced')).toEqual(['full-stack', 'php', 'javascript', 'tech-lead']);
    expect(byLevel('intermediate')).toHaveLength(6);
    expect(skillGroups.flatMap((g) => g.skills).every((s) => s.level === undefined)).toBe(true);
  });

  it('las competencias de ciberseguridad de formación están marcadas', () => {
    const cyber = skillGroups.find((g) => g.id === 'cybersecurity')?.skills ?? [];
    const education = cyber.filter((s) => s.basis === 'education').map((s) => s.id);
    expect(education).toEqual(
      expect.arrayContaining([
        'risk-management',
        'isms',
        'iso27001',
        'data-protection',
        'law-21663',
        'law-21719',
      ]),
    );
  });

  it('las URLs profesionales tienen la estructura esperada', () => {
    const linkedin = contactLinks.find((c) => c.kind === 'linkedin');
    const github = contactLinks.find((c) => c.kind === 'github');
    expect(linkedin?.url).toMatch(/^https:\/\/www\.linkedin\.com\/in\/[a-z0-9-]+$/);
    expect(github?.url).toMatch(/^https:\/\/github\.com\/[A-Za-z0-9-]+$/);
    for (const link of contactLinks) expect(parseSafeHttpsUrl(link.url)).not.toBeNull();
    expect(contactLinks.some((c) => c.kind === 'email')).toBe(false);
  });

  it('la navegación principal conserva los ocho destinos acordados', () => {
    expect(navItems.map((i) => i.targetId)).toEqual([
      'home',
      'about',
      'experience',
      'projects',
      'skills',
      'education',
      'certifications',
      'contact',
    ]);
  });
});

import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { areaTone } from '@/components/ui/areaStyles';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { projects } from '@/data/projects';
import { SECTION_IDS } from '@/data/sections';
import { cx } from '@/lib/cx';

/**
 * Ámbitos de trabajo genéricos, sin nombres de proyectos ni de organizaciones.
 * Los proyectos con nombre pendientes de autorización NO están en el repositorio
 * (ver docs/PUBLICACION.md). Sin botones "Ver código" / "Ver demo": no existen recursos autorizados.
 */
export function Projects() {
  const { t } = useTranslation();

  return (
    <Section id={SECTION_IDS.projects} labelledBy="projects-title" tone="alt">
      <SectionHeading
        id="projects-title"
        eyebrow={t('projects.eyebrow')}
        title={t('projects.title')}
        description={t('projects.description')}
      />

      <p className="mb-8 flex max-w-3xl items-start gap-3 rounded-lg border border-border-strong bg-surface p-4 text-sm text-muted">
        <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
        {t('projects.confidentialityNote')}
      </p>

      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const primaryArea = project.areaIds[0] ?? 'software';
          return (
            <li key={project.id} className="flex">
              <Card as="article" className="relative flex w-full flex-col overflow-hidden">
                <span
                  aria-hidden="true"
                  className={cx('absolute inset-x-0 top-0 h-1', areaTone[primaryArea].bar)}
                />
                <h3 className="text-lg font-semibold text-balance">{t(project.titleKey)}</h3>
                <p className="mt-3 text-muted">{t(project.descriptionKey)}</p>

                {project.technologies.length > 0 ? (
                  <div className="mt-auto pt-5">
                    <h4 className="sr-only">{t('projects.technologiesLabel')}</h4>
                    <ul className="flex flex-wrap gap-2">
                      {project.technologies.map((tech) => (
                        <li key={tech}>
                          <Badge mono tech>
                            {tech}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Card>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

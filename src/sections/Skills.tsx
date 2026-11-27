import { GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Section } from '@/components/ui/Section';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { coreSkills, skillGroups } from '@/data/skills';
import { SECTION_IDS } from '@/data/sections';
import type { Skill, SkillGroupId, SkillLevel } from '@/types/portfolio';

const levels: readonly SkillLevel[] = ['advanced', 'intermediate'];
const monoGroups: readonly SkillGroupId[] = ['languages', 'databases', 'tooling'];
/** Tecnologías: las de los grupos técnicos (las principales se reconocen por el mismo id). */
const technologyIds = new Set(
  skillGroups
    .filter((group) => monoGroups.includes(group.id))
    .flatMap((group) => group.skills.map((skill) => skill.id)),
);

export function Skills() {
  const { t } = useTranslation();
  const skillName = (skill: Skill) => (skill.nameKey ? t(skill.nameKey) : (skill.name ?? skill.id));

  return (
    <Section id={SECTION_IDS.skills} labelledBy="skills-title">
      <SectionHeading
        id="skills-title"
        eyebrow={t('skills.eyebrow')}
        title={t('skills.title')}
        description={t('skills.description')}
      />

      <h3 className="mb-2 text-xl font-semibold">{t('skills.coreTitle')}</h3>
      <p className="mb-6 text-sm text-muted">{t('skills.coreNote')}</p>
      <div className="grid gap-6 md:grid-cols-2">
        {levels.map((level) => (
          <Card key={level}>
            <h4 className="mb-4 font-mono text-xs font-medium tracking-wide uppercase">
              {t(`skills.levels.${level}`)}
            </h4>
            <ul className="flex flex-wrap gap-2">
              {coreSkills
                .filter((skill) => skill.level === level)
                .map((skill) => (
                  <li key={skill.id}>
                    <Badge
                      variant={level === 'advanced' ? 'primary' : 'neutral'}
                      tech={technologyIds.has(skill.id)}
                      className="text-sm"
                    >
                      {skillName(skill)}
                    </Badge>
                  </li>
                ))}
            </ul>
          </Card>
        ))}
      </div>

      <h3 className="mt-14 mb-2 text-xl font-semibold">{t('skills.complementaryTitle')}</h3>
      <p className="mb-6 flex items-center gap-2 text-sm text-muted">
        <GraduationCap aria-hidden="true" className="size-4 shrink-0 text-primary" />
        {t('skills.legend')}
      </p>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {skillGroups.map((group) => (
          <Card key={group.id}>
            <h4 className="mb-4 text-sm font-semibold">{t(group.titleKey)}</h4>
            <ul className="flex flex-wrap gap-2">
              {group.skills.map((skill) => (
                <li key={skill.id}>
                  <Badge mono={monoGroups.includes(group.id)} tech={monoGroups.includes(group.id)}>
                    {skillName(skill)}
                    {skill.basis === 'education' ? (
                      <>
                        <GraduationCap aria-hidden="true" className="size-3.5 text-primary" />
                        <span className="sr-only"> ({t('skills.educationBasis')})</span>
                      </>
                    ) : null}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </Section>
  );
}

import { useTranslation } from 'react-i18next';
import { Container } from '@/components/ui/Container';
import { areas } from '@/data/areas';
import { education } from '@/data/education';
import { experience } from '@/data/experience';
import { profile } from '@/data/profile';
import { SECTION_IDS } from '@/data/sections';

/** Indicadores derivados de los datos (nada se escribe a mano para evitar incoherencias). */
export function Stats() {
  const { t } = useTranslation();
  const trainingHours = education.reduce((total, item) => total + (item.hours ?? 0), 0);

  const items = [
    { id: 'years', value: `${String(profile.yearsOfExperience)}+`, label: t('stats.years') },
    { id: 'jobs', value: String(experience.length), label: t('stats.jobs') },
    { id: 'hours', value: String(trainingHours), label: t('stats.hours') },
    { id: 'areas', value: String(areas.length), label: t('stats.areas') },
  ];

  return (
    <section
      id={SECTION_IDS.stats}
      aria-labelledby="stats-title"
      className="border-y border-border bg-background-alt py-10"
    >
      <Container>
        <h2 id="stats-title" className="sr-only">
          {t('stats.label')}
        </h2>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
          {items.map((item) => (
            <li key={item.id} className="border-l-2 border-border-strong pl-4">
              <p className="font-mono text-3xl font-bold tracking-tight sm:text-4xl">
                {item.value}
              </p>
              <p className="mt-1 text-sm text-balance text-muted">{item.label}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

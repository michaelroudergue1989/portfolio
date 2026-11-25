import { useTranslation } from 'react-i18next';
import { NavLinks } from './NavLinks';

export function DesktopNav({ activeId }: { activeId: string | null }) {
  const { t } = useTranslation();

  return (
    <nav aria-label={t('nav.label')} className="hidden xl:block">
      <NavLinks orientation="horizontal" activeId={activeId} />
    </nav>
  );
}

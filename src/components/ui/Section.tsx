import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import { Container } from './Container';

interface SectionProps {
  id: string;
  /** Id del encabezado que nombra la sección (landmark accesible). */
  labelledBy: string;
  /** `alt` alterna el fondo para diferenciar secciones consecutivas. */
  tone?: 'default' | 'alt';
  children: ReactNode;
  className?: string;
}

export function Section({ id, labelledBy, tone = 'default', children, className }: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cx(
        'py-section',
        tone === 'alt' && 'border-y border-border bg-background-alt',
        className,
      )}
    >
      <Container>{children}</Container>
    </section>
  );
}

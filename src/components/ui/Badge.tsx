import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';
import type { AreaId } from '@/types/portfolio';

type BadgeVariant = 'neutral' | 'primary' | 'accent' | AreaId;

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Fuente monoespaciada para nombres técnicos (tecnologías, normas). */
  mono?: boolean;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-subtle text-foreground border-border',
  primary: 'bg-primary-soft text-primary border-transparent',
  accent: 'bg-accent-soft text-accent border-transparent',
  software: 'bg-area-software-soft text-area-software border-transparent',
  leadership: 'bg-area-leadership-soft text-area-leadership border-transparent',
  security: 'bg-area-security-soft text-area-security border-transparent',
};

export function Badge({ children, variant = 'neutral', mono = false, className }: BadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium',
        mono && 'font-mono',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

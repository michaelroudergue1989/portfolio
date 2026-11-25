import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

interface CardProps {
  as?: 'div' | 'article' | 'li';
  children: ReactNode;
  className?: string;
}

export function Card({ as: Tag = 'div', children, className }: CardProps) {
  return (
    <Tag className={cx('rounded-xl border border-border bg-surface p-6 shadow-card', className)}>
      {children}
    </Tag>
  );
}

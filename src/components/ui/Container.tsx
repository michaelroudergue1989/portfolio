import type { ReactNode } from 'react';
import { cx } from '@/lib/cx';

interface ContainerProps {
  children: ReactNode;
  className?: string;
}

/** Ancho máximo y márgenes laterales coherentes en todo el sitio. */
export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cx('mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8', className)}>{children}</div>
  );
}

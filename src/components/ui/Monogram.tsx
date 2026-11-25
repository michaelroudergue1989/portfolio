import { cx } from '@/lib/cx';

interface MonogramProps {
  size?: 'sm' | 'lg';
  className?: string;
}

/** Monograma decorativo (sin fotografía). El nombre accesible lo aporta el contexto. */
export function Monogram({ size = 'sm', className }: MonogramProps) {
  return (
    <span
      aria-hidden="true"
      className={cx(
        'inline-flex items-center justify-center border border-border-strong bg-surface font-mono font-bold text-primary select-none',
        size === 'sm' ? 'size-9 rounded-md text-sm' : 'size-28 rounded-2xl text-4xl',
        className,
      )}
    >
      MR
    </span>
  );
}

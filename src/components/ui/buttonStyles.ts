import { cx } from '@/lib/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

const base =
  'transition-interactive inline-flex items-center justify-center gap-2 rounded-md font-medium ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'border border-border-strong bg-surface text-foreground hover:bg-surface-subtle',
  ghost: 'text-foreground hover:bg-surface-subtle',
};

const sizes: Record<ButtonSize, string> = {
  md: 'min-h-11 px-4 text-sm',
  lg: 'min-h-12 px-6 text-base',
};

/** Clases de botón, reutilizables en <button> y en enlaces con apariencia de botón. */
export function buttonStyles(variant: ButtonVariant = 'primary', size: ButtonSize = 'md'): string {
  return cx(base, variants[variant], sizes[size]);
}

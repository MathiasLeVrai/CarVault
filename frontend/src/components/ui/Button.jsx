import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const variants = {
  primary: 'cv-btn-primary',
  accent: 'cv-btn-accent', // added accent variant
  dark: 'cv-btn-dark',
  outline: 'cv-btn-outline',
  danger: 'cv-btn-danger',
  ghost: 'cv-btn-ghost',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-sm',
};

export default function Button({
  children, variant = 'primary', size = 'md', className, disabled, loading, ...props
}) {
  return (
    <button
      className={twMerge(clsx(
        'inline-flex items-center justify-center gap-2 cursor-pointer transition-all font-semibold outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
        variants[variant],
        sizes[size],
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      ))}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

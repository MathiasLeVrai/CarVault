import { clsx } from 'clsx';

const variants = {
  primary: 'nb-btn-primary',
  dark: 'nb-btn-dark',
  outline: 'nb-btn-outline',
  danger: 'nb-btn-danger',
  ghost: 'nb-btn-ghost',
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
      className={clsx(
        'inline-flex items-center justify-center gap-2 cursor-pointer transition-all',
        variants[variant],
        sizes[size],
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

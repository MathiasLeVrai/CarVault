import { clsx } from 'clsx';

const colors = {
  default: 'bg-bg-alt text-ink',
  lime: 'tag-lime',
  orange: 'tag-orange',
  violet: 'tag-violet',
  rose: 'tag-rose',
  sky: 'tag-sky',
  dark: 'tag-dark',
  success: 'bg-success text-white',
  warning: 'bg-warning text-ink',
  danger: 'bg-danger text-white',
  info: 'bg-info text-white',
  cyan: 'bg-sky text-ink',
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span className={clsx('nb-badge', colors[variant], className)}>
      {children}
    </span>
  );
}

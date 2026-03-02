import { clsx } from 'clsx';

const colors = {
  default: 'bg-white/10 text-white border-white/10',
  accent: 'bg-accent/20 text-accent border-accent/20',
  lime: 'bg-lime/20 text-lime border-lime/20',
  orange: 'bg-orange/20 text-orange border-orange/20',
  violet: 'bg-violet/20 text-violet border-violet/20',
  rose: 'bg-rose/20 text-rose border-rose/20',
  sky: 'bg-sky/20 text-sky border-sky/20',
  dark: 'bg-black/50 text-white border-white/10',
  success: 'bg-success/20 text-success border-success/20',
  warning: 'bg-warning/20 text-warning border-warning/20',
  danger: 'bg-danger/20 text-danger border-danger/20',
  info: 'bg-info/20 text-info border-info/20',
  cyan: 'bg-sky/20 text-sky border-sky/20',
};

export default function Badge({ children, variant = 'default', className }) {
  return (
    <span className={clsx('cv-badge', colors[variant], className)}>
      {children}
    </span>
  );
}

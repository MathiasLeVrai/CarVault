import { clsx } from 'clsx';

const styles = {
  default: 'cv-card',
  flat: 'cv-card-flat',
  accent: 'cv-card-accent',
  dark: 'cv-card-dark',
};

export default function Card({ children, variant = 'default', className, ...props }) {
  return (
    <div className={clsx(styles[variant], 'p-5', className)} {...props}>
      {children}
    </div>
  );
}

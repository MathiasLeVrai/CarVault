import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const styles = {
  default: 'cv-card',
  flat: 'cv-card-flat',
  accent: 'cv-card-accent',
  dark: 'cv-card-dark',
  bento: 'bento-card relative overflow-hidden', // added bento variant
};

export default function Card({ children, variant = 'default', className, ...props }) {
  return (
    <div className={twMerge(clsx(styles[variant], 'p-5 md:p-6', className))} {...props}>
      {children}
    </div>
  );
}

import { clsx } from 'clsx';

const styles = {
  default: 'nb-card',
  flat: 'nb-card-flat',
  lime: 'nb-card-lime',
  dark: 'nb-card-dark',
};

export default function Card({ children, variant = 'default', className, ...props }) {
  return (
    <div className={clsx(styles[variant], 'p-5', className)} {...props}>
      {children}
    </div>
  );
}

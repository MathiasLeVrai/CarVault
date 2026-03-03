import { useRef, useCallback } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const styles = {
  default: 'cv-card cv-spotlight',
  flat: 'cv-card-flat',
  accent: 'cv-card-accent',
  dark: 'cv-card-dark',
  bento: 'bento-card cv-spotlight relative overflow-hidden',
};

const SPOTLIGHT_VARIANTS = new Set(['default', 'bento']);

export default function Card({ children, variant = 'default', className, ...props }) {
  const ref = useRef(null);
  const isSpotlight = SPOTLIGHT_VARIANTS.has(variant);

  const handleMouseMove = useCallback((e) => {
    if (!isSpotlight || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--sx', `${e.clientX - rect.left}px`);
    ref.current.style.setProperty('--sy', `${e.clientY - rect.top}px`);
  }, [isSpotlight]);

  const handleMouseLeave = useCallback(() => {
    if (!isSpotlight || !ref.current) return;
    ref.current.style.setProperty('--sx', '-9999px');
    ref.current.style.setProperty('--sy', '-9999px');
  }, [isSpotlight]);

  return (
    <div
      ref={ref}
      className={twMerge(clsx(styles[variant], 'p-5 md:p-6', className))}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      {...props}
    >
      {children}
    </div>
  );
}

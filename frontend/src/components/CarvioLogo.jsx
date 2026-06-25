import { useTheme } from '../context/ThemeContext';

const LOGOS = {
  light: '/carvio-logo.png',
  dark: '/carvio-logo-white.png',
};

/**
 * @param {'auto' | 'on-light' | 'on-dark'} variant
 * - auto: suit le thème (clair → logo noir, sombre → logo blanc)
 * - on-light: fond clair → logo noir
 * - on-dark: fond sombre → logo blanc
 */
export default function CarvioLogo({ className = 'h-8 w-8', variant = 'auto', alt = 'Carvio' }) {
  const { theme } = useTheme();

  const src = (() => {
    if (variant === 'on-dark') return LOGOS.dark;
    if (variant === 'on-light') return LOGOS.light;
    return theme === 'dark' ? LOGOS.dark : LOGOS.light;
  })();

  return (
    <img
      src={src}
      alt={alt}
      width={32}
      height={32}
      className={`object-contain shrink-0 ${className}`}
      decoding="async"
    />
  );
}

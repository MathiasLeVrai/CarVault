import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import logoOnDark from '../assets/carvio-logo.png';
import logoOnLight from '../assets/carvio-logo-white.png';

const LOGOS = {
  onLight: logoOnLight,
  onDark: logoOnDark,
};

function resolveLogoSrc(variant, theme) {
  if (variant === 'on-dark') return LOGOS.onDark;
  if (variant === 'on-light') return LOGOS.onLight;
  return theme === 'dark' ? LOGOS.onDark : LOGOS.onLight;
}

/**
 * @param {'auto' | 'on-light' | 'on-dark'} variant
 */
export default function CarvioLogo({ className = 'h-9 w-9', variant = 'auto', alt = 'Carvio' }) {
  const { theme } = useTheme();
  const preferredSrc = resolveLogoSrc(variant, theme);
  const [src, setSrc] = useState(preferredSrc);

  useEffect(() => {
    setSrc(preferredSrc);
  }, [preferredSrc]);

  return (
    <img
      src={src}
      alt={alt}
      width={40}
      height={40}
      className={`object-contain shrink-0 rounded-lg ${className}`}
      decoding="async"
      onError={() => {
        if (src !== LOGOS.onDark) setSrc(LOGOS.onDark);
      }}
    />
  );
}

/**
 * Logo + libellé « Carvio »
 */
export function CarvioBrand({
  className = 'inline-flex items-center gap-2.5',
  logoClassName = 'h-9 w-9',
  showText = true,
  textClassName = 'text-lg font-bold font-display tracking-tight text-white',
  variant = 'auto',
  to,
}) {
  const content = (
    <>
      <CarvioLogo className={logoClassName} variant={variant} alt="" />
      {showText && <span className={textClassName}>Carvio</span>}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${className} transition-opacity hover:opacity-90`} aria-label="Carvio — accueil">
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}

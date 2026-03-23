import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useBodyScrollLock } from '../hooks/useBodyScrollLock';
import { Car, Sparkles, ArrowRight, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SLIDES = [
  {
    icon: Car,
    color: '#ff2a3f',
    bg: 'rgba(255,42,63,0.12)',
    title: 'Bienvenue dans CarVault',
    subtitle: 'Ton garage numérique. Documents, dépenses, alertes CT, carburant — tout en un seul endroit.',
  },
  {
    icon: Sparkles,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    title: 'Ajoute ton véhicule',
    subtitle: 'Renseigne ta plaque et on s\'occupe du reste. Ça prend 30 secondes.',
    isLast: true,
  },
];

export default function OnboardingTour({ onDone }) {
  const { user } = useAuth();
  useBodyScrollLock(true);
  const [slide, setSlide] = useState(0);
  const [direction, setDirection] = useState(1);

  const goTo = (next) => {
    setDirection(next > slide ? 1 : -1);
    setSlide(next);
  };

  const next = () => {
    if (slide < SLIDES.length - 1) goTo(slide + 1);
    else finish();
  };

  const finish = () => {
    if (user) localStorage.setItem(`carvault_tour_done_${user.id}`, '1');
    onDone();
  };

  const current = SLIDES[slide];
  const Icon = current.icon;

  const variants = {
    enter: (d) => ({ x: d > 0 ? '60%' : '-60%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d) => ({ x: d > 0 ? '-60%' : '60%', opacity: 0 }),
  };

  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center p-6" style={{ background: 'var(--color-bg)', backdropFilter: 'blur(20px)' }}>
      {/* Skip */}
      <button
        onClick={finish}
        className="absolute top-5 right-5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-white/40 hover:text-white/70 text-xs font-bold transition-colors"
      >
        Passer <X className="w-3.5 h-3.5" />
      </button>

      {/* Slide */}
      <div className="w-full max-w-sm flex flex-col items-center text-center overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <Motion.div
            key={slide}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="flex flex-col items-center w-full"
          >
            {/* Icon */}
            <Motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
              className="w-28 h-28 rounded-3xl flex items-center justify-center mb-8"
              style={{ background: current.bg, boxShadow: `0 0 60px ${current.color}30` }}
            >
              <Icon className="w-14 h-14" style={{ color: current.color }} strokeWidth={1.5} />
            </Motion.div>

            <h2 className="text-2xl font-black font-display text-white tracking-tight mb-3">
              {current.title}
            </h2>
            <p className="text-sm text-white/55 font-medium leading-relaxed max-w-xs">
              {current.subtitle}
            </p>
          </Motion.div>
        </AnimatePresence>
      </div>

      {/* Dots */}
      <div className="flex gap-2 mt-12 mb-8">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="transition-all rounded-full"
            style={{
              width: i === slide ? 24 : 8,
              height: 8,
              background: i === slide ? current.color : 'var(--color-ink-faint)',
            }}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="w-full max-w-sm flex gap-3">
        {slide > 0 && (
          <button
            onClick={() => goTo(slide - 1)}
            className="flex-1 py-4 rounded-2xl cv-btn-dark text-sm font-bold"
          >
            Retour
          </button>
        )}
        <button
          onClick={next}
          className="flex-1 py-4 rounded-2xl cv-btn-accent text-sm font-bold flex items-center justify-center gap-2"
          style={{ background: current.color }}
        >
          {current.isLast ? "C'est parti !" : 'Suivant'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

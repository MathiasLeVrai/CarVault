import { useState, useEffect } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';

/**
 * SplitText — reveals each character sliding up from below, staggered.
 */
export function SplitText({ text, delay = 0, className = '' }) {
  return (
    <span className={className}>
      {text.split('').map((char, i) => (
        <span
          key={i}
          style={{ display: 'inline-block', overflow: 'hidden', verticalAlign: 'bottom' }}
        >
          <Motion.span
            style={{ display: 'inline-block' }}
            initial={{ y: '110%' }}
            animate={{ y: 0 }}
            transition={{
              delay: delay + i * 0.03,
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {char === ' ' ? '\u00a0' : char}
          </Motion.span>
        </span>
      ))}
    </span>
  );
}

const letterVariants = {
  initial: { y: '115%' },
  enter: { y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
  exit: { y: '-115%', transition: { duration: 0.35, ease: [0.55, 0, 1, 0.6] } },
};

/**
 * CyclingWord — cycles through words letter by letter, each character
 * slides up individually with a stagger.
 */
export function CyclingWord({ words, className = '', interval = 3800 }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex(i => (i + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);

  return (
    <span style={{ display: 'inline-flex', lineHeight: '1.15' }} className={className}>
      <AnimatePresence mode="wait" initial={false}>
        <Motion.span
          key={index}
          style={{ display: 'inline-flex' }}
          variants={{
            enter: { transition: { staggerChildren: 0.055, delayChildren: 0 } },
            exit: { transition: { staggerChildren: 0.035, staggerDirection: -1 } },
          }}
          initial="initial"
          animate="enter"
          exit="exit"
        >
          {words[index].split('').map((char, i) => (
            <span
              key={i}
              style={{ display: 'inline-block', overflow: 'hidden', lineHeight: 'inherit' }}
            >
              <Motion.span style={{ display: 'inline-block' }} variants={letterVariants}>
                {char === ' ' ? '\u00a0' : char}
              </Motion.span>
            </span>
          ))}
        </Motion.span>
      </AnimatePresence>
    </span>
  );
}

/**
 * StatChip — a single animated stat with value + label.
 */
export function StatChip({ value, label, delay = 0 }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="text-2xl font-black text-white font-display leading-none">{value}</div>
      <div className="text-[11px] text-white/40 font-semibold mt-1 uppercase tracking-wide">{label}</div>
    </Motion.div>
  );
}

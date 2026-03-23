import { useEffect } from 'react';

let lockDepth = 0;
let previousBodyOverflow = '';
let previousHtmlOverflow = '';

/** Nested overlays (modal + sheet + …) share one body lock without clearing each other. */
export function acquireBodyScrollLock() {
  lockDepth += 1;
  if (lockDepth === 1) {
    previousBodyOverflow = document.body.style.overflow;
    previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  }
}

export function releaseBodyScrollLock() {
  if (lockDepth === 0) return;
  lockDepth -= 1;
  if (lockDepth === 0) {
    document.body.style.overflow = previousBodyOverflow;
    document.documentElement.style.overflow = previousHtmlOverflow;
  }
}

/**
 * Lock page scroll while `locked` is true. Safe to nest across multiple components.
 */
export function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return;
    acquireBodyScrollLock();
    return () => releaseBodyScrollLock();
  }, [locked]);
}

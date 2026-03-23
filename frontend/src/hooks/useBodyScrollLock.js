import { useEffect } from 'react';

let lockDepth = 0;

/** Nested overlays (modal + sheet + …) share one body lock without clearing each other. */
export function acquireBodyScrollLock() {
  lockDepth += 1;
  if (lockDepth === 1) {
    document.body.style.overflow = 'hidden';
  }
}

export function releaseBodyScrollLock() {
  if (lockDepth === 0) return;
  lockDepth -= 1;
  if (lockDepth === 0) {
    document.body.style.overflow = '';
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

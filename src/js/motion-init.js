// motion-init.js — loaded in <head>, before first paint.
// Adds the `motion-enabled` flag to <html> so the CSS scroll-reveal rules
// can hide pending elements. Hiding is OPT-IN: without this flag, every
// .reveal / .result-item element is fully visible. That is the safe default —
// if this script fails to load for ANY reason (CSP, network, error), nothing
// is ever hidden and the page always renders its content.
//
// Gated on two checks:
//   1. IntersectionObserver is supported (needed to reveal on scroll).
//   2. The user has NOT opted out of reduced motion.
// If either fails, the flag is never added and content stays visible.
(function () {
  'use strict';
  try {
    if ('IntersectionObserver' in window &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.documentElement.classList.add('motion-enabled');
    }
  } catch (e) {
    // Never let a failure here hide content. Silent.
  }
})();

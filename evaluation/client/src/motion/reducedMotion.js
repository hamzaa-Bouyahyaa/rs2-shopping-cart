// Whether the shopper has asked the OS for reduced motion. Motion code checks
// this before starting anything. A missing or throwing matchMedia (jsdom, very
// old browsers) is treated as "no motion", so tests stay deterministic and the
// browser keeps its native behaviour. Guard style mirrors getSystemTheme() in
// theme/theme.js.

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

export function prefersReducedMotion() {
  try {
    if (typeof window.matchMedia !== 'function') return true;
    return Boolean(window.matchMedia(REDUCED_MOTION_QUERY).matches);
  } catch {
    return true;
  }
}

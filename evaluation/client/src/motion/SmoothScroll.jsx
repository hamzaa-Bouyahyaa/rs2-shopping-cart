import { useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger, registerGsap } from './gsap';
import { prefersReducedMotion } from './reducedMotion';

// Smooth wheel and trackpad scrolling for the whole app. Lenis is driven by
// the GSAP ticker (not its own rAF loop) and reports every scroll to
// ScrollTrigger, so scroll-linked animations stay in step. With reduced motion
// requested, or no matchMedia at all, nothing starts and scrolling is native.
export default function SmoothScroll({ children }) {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    registerGsap();
    const lenis = new Lenis({ autoRaf: false });
    const unsubscribeScroll = lenis.on('scroll', ScrollTrigger.update);
    const tick = (time) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Each effect run owns its own instance and callback, so a double run
    // (React StrictMode) tears down exactly what it set up.
    return () => {
      gsap.ticker.remove(tick);
      if (typeof unsubscribeScroll === 'function') unsubscribeScroll();
      lenis.destroy();
    };
  }, []);

  return children;
}

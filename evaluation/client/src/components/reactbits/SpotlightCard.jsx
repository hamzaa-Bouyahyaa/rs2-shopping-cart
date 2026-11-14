import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../motion/reducedMotion';
import '../../styles/reactbits/SpotlightCard.css';

// Adapted from the JS + CSS SpotlightCard on reactbits.dev. A soft brand-wash
// glow follows the pointer across the card. The pointer position is written as
// CSS custom properties on the card through the ref; the stylesheet draws the
// gradient. Upstream's spotlightColor prop is dropped: the colour is always the
// --brand-wash token.
//
// With reduced motion requested, or no matchMedia (jsdom), no listener is
// attached, so the highlight never moves; hover shows it fixed in the centre.

export default function SpotlightCard({ children, className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return undefined;

    const handlePointerMove = (event) => {
      const rect = el.getBoundingClientRect();
      el.style.setProperty('--spotlight-x', `${event.clientX - rect.left}px`);
      el.style.setProperty('--spotlight-y', `${event.clientY - rect.top}px`);
    };
    el.addEventListener('pointermove', handlePointerMove);

    return () => {
      el.removeEventListener('pointermove', handlePointerMove);
      el.style.removeProperty('--spotlight-x');
      el.style.removeProperty('--spotlight-y');
    };
  }, []);

  return (
    <div ref={ref} className={['card-spotlight', className].filter(Boolean).join(' ')}>
      {children}
    </div>
  );
}

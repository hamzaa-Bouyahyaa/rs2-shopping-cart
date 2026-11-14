import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../../motion/reducedMotion';
import '../../styles/reactbits/Magnet.css';

// Adapted from the JS Magnet on reactbits.dev. The child drifts toward the
// pointer while it is within `padding` px of the wrapper. The offset is
// written as --magnet-x / --magnet-y on the inner element through a ref and
// applied as a transform by the stylesheet, so layout, tap-target size and
// focus order of the wrapped child are untouched (neither wrapper is
// focusable). Upstream's activeTransition / inactiveTransition style strings
// are replaced by the magnet__inner--active class in Magnet.css.
//
// With reduced motion requested, `disabled`, or no matchMedia (jsdom), no
// listener is attached and the child never moves.

export default function Magnet({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 2,
  wrapperClassName = '',
  innerClassName = '',
  ...props
}) {
  const wrapperRef = useRef(null);
  const innerRef = useRef(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const inner = innerRef.current;
    if (!wrapper || !inner || disabled || prefersReducedMotion()) return undefined;

    const reset = () => {
      inner.classList.remove('magnet__inner--active');
      inner.style.removeProperty('--magnet-x');
      inner.style.removeProperty('--magnet-y');
    };

    const handleMouseMove = (event) => {
      // The wrapper never moves, so its rect is a stable reference.
      const { left, top, width, height } = wrapper.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const near =
        Math.abs(centerX - event.clientX) < width / 2 + padding &&
        Math.abs(centerY - event.clientY) < height / 2 + padding;
      if (!near) {
        reset();
        return;
      }
      inner.classList.add('magnet__inner--active');
      inner.style.setProperty('--magnet-x', `${(event.clientX - centerX) / magnetStrength}px`);
      inner.style.setProperty('--magnet-y', `${(event.clientY - centerY) / magnetStrength}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      reset();
    };
  }, [padding, disabled, magnetStrength]);

  return (
    <div ref={wrapperRef} className={['magnet', wrapperClassName].filter(Boolean).join(' ')} {...props}>
      <div ref={innerRef} className={['magnet__inner', innerClassName].filter(Boolean).join(' ')}>
        {children}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useRef } from 'react';
import { gsap, registerGsap, ScrollTrigger, useGSAP } from '../../motion/gsap';
import { prefersReducedMotion } from '../../motion/reducedMotion';
import '../../styles/reactbits/CountUp.css';

// Ported from the JS CountUp on reactbits.dev, which animates with `motion`'s
// spring. This version tweens with GSAP (no extra dependency) and keeps the
// same props. It counts from `from` to `to` (or `to` down to `from` with
// direction="down") once it scrolls into view and `startWhen` is true.
//
// The final value is rendered as the element's text, so it is what shows on
// first render and if the animation never runs. With motion allowed, GSAP
// swaps in the start value at animation time and counts to the final value.
// With reduced motion requested, or no matchMedia (jsdom), the final value is
// shown and nothing is tweened; onStart and onEnd still fire once startWhen
// is true, so callers can rely on them.

function decimalPlaces(num) {
  const str = String(num);
  if (!str.includes('.')) return 0;
  const decimals = str.split('.')[1];
  return parseInt(decimals, 10) !== 0 ? decimals.length : 0;
}

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd,
}) {
  const ref = useRef(null);
  const callbacks = useRef({});
  callbacks.current = { onStart, onEnd };

  const startValue = direction === 'down' ? to : from;
  const endValue = direction === 'down' ? from : to;
  const maxDecimals = Math.max(decimalPlaces(from), decimalPlaces(to));

  const format = useCallback(
    (value) => {
      const formatted = new Intl.NumberFormat('en-US', {
        useGrouping: Boolean(separator),
        minimumFractionDigits: maxDecimals,
        maximumFractionDigits: maxDecimals,
      }).format(value);
      return separator ? formatted.replace(/,/g, separator) : formatted;
    },
    [maxDecimals, separator],
  );

  // Writes through React's own text node so later renders keep working.
  const write = useCallback(
    (value) => {
      const node = ref.current?.firstChild;
      if (node) node.nodeValue = format(value);
    },
    [format],
  );

  // Reduced motion: no tween, just the lifecycle callbacks.
  useEffect(() => {
    if (!startWhen || !prefersReducedMotion()) return;
    callbacks.current.onStart?.();
    callbacks.current.onEnd?.();
  }, [startWhen]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return undefined;
      registerGsap();

      write(startValue);
      // Whatever happens next, leave the final value behind on revert.
      const restore = () => write(endValue);
      if (!startWhen) return restore;

      const counter = { value: startValue };
      const tween = gsap.to(counter, {
        value: endValue,
        duration,
        delay,
        ease: 'power2.out',
        paused: true,
        onUpdate: () => write(counter.value),
        onComplete: () => {
          write(endValue);
          callbacks.current.onEnd?.();
        },
      });

      ScrollTrigger.create({
        trigger: el,
        start: 'top bottom',
        once: true,
        onEnter: () => {
          callbacks.current.onStart?.();
          tween.play();
        },
      });

      return restore;
    },
    {
      dependencies: [startValue, endValue, duration, delay, startWhen, write],
      scope: ref,
      revertOnUpdate: true,
    },
  );

  return (
    <span ref={ref} className={['count-up', className].filter(Boolean).join(' ')}>
      {format(endValue)}
    </span>
  );
}

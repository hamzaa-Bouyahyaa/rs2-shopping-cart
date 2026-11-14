import { useRef } from 'react';
import { gsap, registerGsap, ScrollTrigger, useGSAP } from '../../motion/gsap';
import { prefersReducedMotion } from '../../motion/reducedMotion';

// Adapted from the JS AnimatedContent on reactbits.dev. Slides and fades its
// children in once they scroll into view, and can fade them out again after
// `disappearAfter` seconds. Upstream hides the wrapper with an inline
// `visibility: hidden`; here nothing hides it except GSAP at animation time,
// so the children stay visible if the animation never runs. It needs no
// stylesheet.
//
// With reduced motion requested, or no matchMedia (jsdom), no tween or
// ScrollTrigger is created and the children render as they are.

export default function AnimatedContent({
  children,
  container,
  distance = 100,
  direction = 'vertical',
  reverse = false,
  duration = 0.8,
  ease = 'power3.out',
  initialOpacity = 0,
  animateOpacity = true,
  scale = 1,
  threshold = 0.1,
  delay = 0,
  disappearAfter = 0,
  disappearDuration = 0.5,
  disappearEase = 'power3.in',
  onComplete,
  onDisappearanceComplete,
  className = '',
  ...props
}) {
  const ref = useRef(null);
  const callbacks = useRef({});
  callbacks.current = { onComplete, onDisappearanceComplete };

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      registerGsap();

      const scroller =
        typeof container === 'string' ? document.querySelector(container) : container || undefined;
      const axis = direction === 'horizontal' ? 'x' : 'y';
      const offset = reverse ? -distance : distance;

      // Every tween lives on one timeline created here, so the useGSAP context
      // reverts all of it (and the ScrollTrigger) on unmount.
      const tl = gsap.timeline({ paused: true, delay });
      tl.fromTo(
        el,
        { [axis]: offset, scale, opacity: animateOpacity ? initialOpacity : 1 },
        { [axis]: 0, scale: 1, opacity: 1, duration, ease, immediateRender: true },
      );
      tl.call(() => callbacks.current.onComplete?.());
      if (disappearAfter > 0) {
        tl.to(el, {
          [axis]: reverse ? distance : -distance,
          scale: 0.8,
          opacity: animateOpacity ? initialOpacity : 0,
          delay: disappearAfter,
          duration: disappearDuration,
          ease: disappearEase,
        });
        tl.call(() => callbacks.current.onDisappearanceComplete?.());
      }

      ScrollTrigger.create({
        trigger: el,
        scroller,
        start: `top ${(1 - threshold) * 100}%`,
        once: true,
        onEnter: () => tl.play(),
      });
    },
    {
      dependencies: [
        container,
        distance,
        direction,
        reverse,
        duration,
        ease,
        initialOpacity,
        animateOpacity,
        scale,
        threshold,
        delay,
        disappearAfter,
        disappearDuration,
        disappearEase,
      ],
      scope: ref,
      revertOnUpdate: true,
    },
  );

  return (
    <div ref={ref} className={className || undefined} {...props}>
      {children}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { gsap, registerGsap, ScrollTrigger, SplitText as GSAPSplitText, useGSAP } from '../../motion/gsap';
import { prefersReducedMotion } from '../../motion/reducedMotion';
import '../../styles/reactbits/SplitText.css';

// Adapted from the JS + CSS SplitText on reactbits.dev. Text is split into
// chars, words or lines by GSAP's SplitText plugin and staggered in once it
// scrolls into view. The element keeps the full text as its accessible name:
// before splitting that is its own text, after splitting GSAP sets aria-label
// to the full text and marks every split piece aria-hidden.
//
// With reduced motion requested, or no matchMedia (jsdom), the text is never
// split or tweened and simply renders as written. Upstream's textAlign style
// is applied through a split-parent--<align> class instead.

const TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div']);
const ALIGNS = new Set(['left', 'center', 'right', 'start', 'end', 'justify']);

function fontsAlreadyLoaded() {
  const { fonts } = document;
  return !fonts || fonts.status === 'loaded';
}

function scrollStart(threshold, rootMargin) {
  const startPct = (1 - threshold) * 100;
  const match = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
  const value = match ? parseFloat(match[1]) : 0;
  const unit = match ? match[2] || 'px' : 'px';
  let offset = '';
  if (value < 0) offset = `-=${Math.abs(value)}${unit}`;
  else if (value > 0) offset = `+=${value}${unit}`;
  return `top ${startPct}%${offset}`;
}

export default function SplitText({
  text,
  className = '',
  delay = 100,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars',
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete,
}) {
  const ref = useRef(null);
  const onCompleteRef = useRef(onLetterAnimationComplete);
  onCompleteRef.current = onLetterAnimationComplete;
  const [fontsLoaded, setFontsLoaded] = useState(fontsAlreadyLoaded);

  // Splitting before web fonts load measures the wrong glyph widths.
  useEffect(() => {
    if (fontsLoaded || prefersReducedMotion()) return undefined;
    let active = true;
    document.fonts.ready.then(() => {
      if (active) setFontsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [fontsLoaded]);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || !text || !fontsLoaded || prefersReducedMotion()) return undefined;
      registerGsap();

      const pickTargets = (self) => {
        if (splitType.includes('chars') && self.chars.length) return self.chars;
        if (splitType.includes('words') && self.words.length) return self.words;
        if (splitType.includes('lines') && self.lines.length) return self.lines;
        if (self.chars.length) return self.chars;
        return self.words.length ? self.words : self.lines;
      };

      // The hidden "from" state is applied here, by GSAP, at animation time.
      const split = new GSAPSplitText(el, {
        type: splitType,
        aria: 'auto',
        smartWrap: true,
        autoSplit: splitType === 'lines',
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        reduceWhiteSpace: false,
        onSplit: (self) =>
          gsap.fromTo(
            pickTargets(self),
            { ...from },
            {
              ...to,
              duration,
              ease,
              stagger: delay / 1000,
              scrollTrigger: {
                trigger: el,
                start: scrollStart(threshold, rootMargin),
                once: true,
                fastScrollEnd: true,
              },
              onComplete: () => onCompleteRef.current?.(),
              willChange: 'transform, opacity',
              force3D: true,
            },
          ),
      });

      return () => {
        ScrollTrigger.getAll().forEach((st) => {
          if (st.trigger === el) st.kill();
        });
        split.revert();
      };
    },
    {
      dependencies: [
        text,
        delay,
        duration,
        ease,
        splitType,
        JSON.stringify(from),
        JSON.stringify(to),
        threshold,
        rootMargin,
        fontsLoaded,
      ],
      scope: ref,
      revertOnUpdate: true,
    },
  );

  const Tag = TAGS.has(tag) ? tag : 'p';
  const align = ALIGNS.has(textAlign) ? textAlign : 'center';
  const classes = ['split-parent', `split-parent--${align}`, className].filter(Boolean).join(' ');

  return (
    <Tag ref={ref} className={classes}>
      {text}
    </Tag>
  );
}

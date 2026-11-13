// Single place that wires GSAP plugins. Later tickets import gsap, its plugins
// and useGSAP from here and call registerGsap() before animating; repeated
// calls are cheap no-ops.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { useGSAP } from '@gsap/react';

let registered = false;

export function registerGsap() {
  if (registered) return gsap;
  gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText);
  registered = true;
  return gsap;
}

export { gsap, ScrollTrigger, SplitText, useGSAP };

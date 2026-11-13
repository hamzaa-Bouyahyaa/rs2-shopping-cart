import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// registerGsap() keeps module-level state, so each test loads a fresh copy.
// ScrollTrigger reads matchMedia while registering, which plain jsdom lacks,
// so give it the browser shape.
beforeEach(() => {
  vi.resetModules();
  window.matchMedia = vi.fn((query) => ({
    matches: false,
    media: query,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  }));
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.matchMedia;
});

describe('registerGsap', () => {
  test('registers the plugins only once over repeated calls', async () => {
    const { gsap } = await import('gsap');
    const spy = vi.spyOn(gsap, 'registerPlugin');
    const { registerGsap, ScrollTrigger, SplitText, useGSAP } = await import('./gsap');

    registerGsap();
    registerGsap();
    registerGsap();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual(
      expect.arrayContaining([ScrollTrigger, SplitText, useGSAP]),
    );
  });

  test('re-exports gsap and its plugins', async () => {
    const motion = await import('./gsap');
    const { gsap } = await import('gsap');
    expect(motion.gsap).toBe(gsap);
    expect(motion.registerGsap()).toBe(gsap);
    expect(typeof motion.ScrollTrigger.update).toBe('function');
    expect(typeof motion.SplitText).toBe('function');
    expect(typeof motion.useGSAP).toBe('function');
  });
});

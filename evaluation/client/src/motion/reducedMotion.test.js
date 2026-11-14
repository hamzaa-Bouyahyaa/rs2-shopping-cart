import { afterEach, describe, expect, test, vi } from 'vitest';
import { prefersReducedMotion } from './reducedMotion';

const QUERY = '(prefers-reduced-motion: reduce)';

afterEach(() => {
  delete window.matchMedia;
});

describe('prefersReducedMotion', () => {
  test('is true when the OS asks for reduced motion', () => {
    window.matchMedia = vi.fn((query) => ({ matches: query === QUERY, media: query }));
    expect(prefersReducedMotion()).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith(QUERY);
  });

  test('is false when motion is allowed', () => {
    window.matchMedia = vi.fn((query) => ({ matches: false, media: query }));
    expect(prefersReducedMotion()).toBe(false);
  });

  test('is true when matchMedia is missing', () => {
    delete window.matchMedia;
    expect(window.matchMedia).toBeUndefined();
    expect(prefersReducedMotion()).toBe(true);
  });

  test('is true when matchMedia throws', () => {
    window.matchMedia = vi.fn(() => {
      throw new Error('unsupported');
    });
    expect(prefersReducedMotion()).toBe(true);
  });
});

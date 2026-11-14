import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { gsap, ScrollTrigger } from '../../motion/gsap';
import AnimatedContent from './AnimatedContent';

function stubReducedMotion() {
  window.matchMedia = vi.fn((query) => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  }));
}

function spyOnGsap() {
  return [
    vi.spyOn(gsap, 'to'),
    vi.spyOn(gsap, 'from'),
    vi.spyOn(gsap, 'fromTo'),
    vi.spyOn(gsap, 'set'),
    vi.spyOn(gsap, 'timeline'),
    vi.spyOn(ScrollTrigger, 'create'),
  ];
}

function renderContent() {
  return render(
    <AnimatedContent data-testid="wrapper" distance={60} delay={0.2}>
      <p>Basket total</p>
    </AnimatedContent>,
  );
}

function expectVisibleAndStill(spies) {
  const wrapper = screen.getByTestId('wrapper');
  expect(screen.getByText('Basket total')).toBeVisible();
  expect(wrapper).toBeVisible();
  expect(wrapper).not.toHaveAttribute('style');
  spies.forEach((spy) => expect(spy).not.toHaveBeenCalled());
}

afterEach(() => {
  vi.restoreAllMocks();
  delete window.matchMedia;
});

describe('AnimatedContent', () => {
  test('without matchMedia the children are visible on first render and nothing is tweened', () => {
    const spies = spyOnGsap();
    renderContent();
    expectVisibleAndStill(spies);
  });

  test('under reduced motion the children are visible on first render and nothing is tweened', () => {
    stubReducedMotion();
    const spies = spyOnGsap();
    renderContent();
    expectVisibleAndStill(spies);
  });
});

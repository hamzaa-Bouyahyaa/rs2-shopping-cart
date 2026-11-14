import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { gsap } from '../../motion/gsap';
import CountUp from './CountUp';

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

afterEach(() => {
  vi.restoreAllMocks();
  delete window.matchMedia;
});

const cases = [
  ['without matchMedia', () => {}],
  ['under reduced motion', stubReducedMotion],
];

describe.each(cases)('CountUp %s', (_label, setup) => {
  test('shows the final value on first render, formatted with the separator', () => {
    setup();
    const tween = vi.spyOn(gsap, 'to');
    render(<CountUp from={0} to={12500} separator="," />);

    expect(screen.getByText('12,500')).toBeInTheDocument();
    expect(screen.getByText('12,500')).not.toHaveAttribute('style');
    expect(tween).not.toHaveBeenCalled();
  });

  test('shows `from` as the final value when counting down', () => {
    setup();
    render(<CountUp from={3} to={100} direction="down" />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  test('keeps decimals and a custom separator', () => {
    setup();
    render(<CountUp to={1234.5} separator=" " />);
    expect(screen.getByText('1 234.5')).toBeInTheDocument();
  });

  test('without a separator the number is not grouped', () => {
    setup();
    render(<CountUp to={4200} />);
    expect(screen.getByText('4200')).toBeInTheDocument();
  });

  test('still calls onStart and onEnd once startWhen is true', () => {
    setup();
    const onStart = vi.fn();
    const onEnd = vi.fn();
    const { rerender } = render(<CountUp to={10} startWhen={false} onStart={onStart} onEnd={onEnd} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(onStart).not.toHaveBeenCalled();

    rerender(<CountUp to={10} startWhen onStart={onStart} onEnd={onEnd} />);
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});

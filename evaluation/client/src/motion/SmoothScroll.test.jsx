import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import { gsap, ScrollTrigger } from './gsap';
import SmoothScroll from './SmoothScroll';

// A stand-in Lenis that records every instance and its scroll listeners.
const lenisMock = vi.hoisted(() => {
  const instances = [];
  class FakeLenis {
    constructor(options) {
      this.options = options;
      this.listeners = new Map();
      this.raf = vi.fn();
      this.destroy = vi.fn();
      this.unsubscribers = [];
      instances.push(this);
    }

    on(event, callback) {
      this.listeners.set(event, callback);
      const off = vi.fn(() => this.listeners.delete(event));
      this.unsubscribers.push(off);
      return off;
    }

    emit(event, ...args) {
      this.listeners.get(event)?.(...args);
    }
  }
  return { FakeLenis, instances };
});

vi.mock('lenis', () => ({ default: lenisMock.FakeLenis }));

function stubReducedMotion(reduce) {
  window.matchMedia = vi.fn((query) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

function renderSmoothScroll() {
  return render(
    <SmoothScroll>
      <p>Shop content</p>
    </SmoothScroll>,
  );
}

let tickerAdd;
let tickerRemove;

beforeEach(() => {
  lenisMock.instances.length = 0;
  tickerAdd = vi.spyOn(gsap.ticker, 'add');
  tickerRemove = vi.spyOn(gsap.ticker, 'remove');
});

afterEach(() => {
  vi.restoreAllMocks();
  delete window.matchMedia;
});

describe('SmoothScroll with motion allowed', () => {
  beforeEach(() => stubReducedMotion(false));

  test('starts one Lenis driven by the GSAP ticker', () => {
    const lagSmoothing = vi.spyOn(gsap.ticker, 'lagSmoothing');
    renderSmoothScroll();

    expect(screen.getByText('Shop content')).toBeInTheDocument();
    expect(lenisMock.instances).toHaveLength(1);
    const [lenis] = lenisMock.instances;
    expect(lenis.options).toMatchObject({ autoRaf: false });

    expect(tickerAdd).toHaveBeenCalledTimes(1);
    const tick = tickerAdd.mock.calls[0][0];
    tick(1.5);
    expect(lenis.raf).toHaveBeenCalledWith(1500);
    expect(lagSmoothing).toHaveBeenCalledWith(0);
  });

  test('forwards Lenis scroll events to ScrollTrigger.update', () => {
    const update = vi.spyOn(ScrollTrigger, 'update').mockImplementation(() => {});
    renderSmoothScroll();

    lenisMock.instances[0].emit('scroll', lenisMock.instances[0]);
    expect(update).toHaveBeenCalledTimes(1);
  });

  test('tears everything down on unmount', () => {
    const { unmount } = renderSmoothScroll();
    const [lenis] = lenisMock.instances;
    const tick = tickerAdd.mock.calls[0][0];

    unmount();

    expect(lenis.destroy).toHaveBeenCalledTimes(1);
    expect(tickerRemove).toHaveBeenCalledWith(tick);
    expect(lenis.unsubscribers).toHaveLength(1);
    expect(lenis.unsubscribers[0]).toHaveBeenCalledTimes(1);
  });

  test('leaves nothing behind under StrictMode double effects', () => {
    // gsap.ticker.add calls remove internally to dedupe, so track the live
    // callbacks directly instead of diffing spy calls.
    const liveTicks = new Set();
    tickerAdd.mockImplementation((cb) => liveTicks.add(cb));
    tickerRemove.mockImplementation((cb) => liveTicks.delete(cb));

    const { unmount } = render(
      <StrictMode>
        <SmoothScroll>
          <p>Shop content</p>
        </SmoothScroll>
      </StrictMode>,
    );

    // Only one Lenis instance and one ticker callback are live after the
    // double effect run; the first run's are already torn down.
    expect(lenisMock.instances).toHaveLength(2);
    const live = lenisMock.instances.filter((l) => l.destroy.mock.calls.length === 0);
    expect(live).toHaveLength(1);
    expect(liveTicks.size).toBe(1);

    unmount();

    lenisMock.instances.forEach((l) => {
      expect(l.destroy).toHaveBeenCalledTimes(1);
      l.unsubscribers.forEach((off) => expect(off).toHaveBeenCalledTimes(1));
    });
    expect(liveTicks.size).toBe(0);
  });

  test('renders its children with no wrapper element', () => {
    const { container } = renderSmoothScroll();
    expect(container.childNodes).toHaveLength(1);
    expect(container.firstChild.tagName).toBe('P');
  });
});

describe('SmoothScroll without motion', () => {
  test('stays native when the OS asks for reduced motion', () => {
    stubReducedMotion(true);
    renderSmoothScroll();

    expect(screen.getByText('Shop content')).toBeInTheDocument();
    expect(lenisMock.instances).toHaveLength(0);
    expect(tickerAdd).not.toHaveBeenCalled();
  });

  test('stays native when matchMedia is missing (plain jsdom)', () => {
    delete window.matchMedia;
    renderSmoothScroll();

    expect(screen.getByText('Shop content')).toBeInTheDocument();
    expect(lenisMock.instances).toHaveLength(0);
    expect(tickerAdd).not.toHaveBeenCalled();
  });
});

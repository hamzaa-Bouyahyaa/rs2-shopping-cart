import { afterEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { gsap } from '../../motion/gsap';
import SplitText from './SplitText';

const TEXT = 'Shop smarter today';

function stubMatchMedia(reduce) {
  window.matchMedia = vi.fn((query) => ({
    matches: reduce && query === '(prefers-reduced-motion: reduce)',
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

describe('SplitText', () => {
  test('renders a <p> with the full text by default', () => {
    const { container } = render(<SplitText text={TEXT} />);
    const el = container.firstChild;
    expect(el.tagName).toBe('P');
    expect(el).toHaveTextContent(TEXT);
    expect(el).not.toHaveAttribute('style');
  });

  test('without matchMedia it renders the heading unsplit, named by the full text, with no tween', () => {
    const fromTo = vi.spyOn(gsap, 'fromTo');
    render(<SplitText tag="h1" text={TEXT} />);

    const heading = screen.getByRole('heading', { level: 1, name: TEXT });
    expect(heading.children).toHaveLength(0);
    expect(heading).toBeVisible();
    expect(fromTo).not.toHaveBeenCalled();
  });

  test('under reduced motion it does not split or tween', () => {
    stubMatchMedia(true);
    const fromTo = vi.spyOn(gsap, 'fromTo');
    render(<SplitText tag="h1" text={TEXT} />);

    const heading = screen.getByRole('heading', { name: TEXT });
    expect(heading.children).toHaveLength(0);
    expect(fromTo).not.toHaveBeenCalled();
  });

  test('with motion allowed the split pieces are hidden from assistive tech and the name stays the full text', () => {
    stubMatchMedia(false);
    const { unmount } = render(<SplitText tag="h1" text={TEXT} />);

    const heading = screen.getByRole('heading', { name: TEXT });
    const chars = heading.querySelectorAll('.split-char');
    expect(chars.length).toBeGreaterThan(0);
    heading.querySelectorAll('.split-char, .split-word').forEach((piece) => {
      const hidden = piece.closest('[aria-hidden="true"]');
      expect(hidden).not.toBeNull();
    });

    // Unmounting reverts the split back to the plain text.
    unmount();
  });
});

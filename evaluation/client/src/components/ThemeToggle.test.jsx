import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle';
import { MoonIcon, SunIcon } from '../icons';

const KEY = 'rs2-theme';

// jsdom has no matchMedia; stub it to answer the dark-scheme query.
function stubOsPrefersDark(prefersDark) {
  window.matchMedia = vi.fn((query) => ({
    matches: prefersDark && query === '(prefers-color-scheme: dark)',
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));
}

function iconMarkup(Icon) {
  const { container, unmount } = render(<Icon />);
  const html = container.innerHTML;
  unmount();
  return html;
}

function setup() {
  const user = userEvent.setup();
  render(<ThemeToggle />);
  return { user, toggle: screen.getByRole('button') };
}

function expectLight(toggle) {
  expect(toggle).toHaveAccessibleName('Switch to dark theme');
  expect(toggle).toHaveAttribute('aria-pressed', 'false');
  expect(toggle.innerHTML).toBe(iconMarkup(MoonIcon));
}

function expectDark(toggle) {
  expect(toggle).toHaveAccessibleName('Switch to light theme');
  expect(toggle).toHaveAttribute('aria-pressed', 'true');
  expect(toggle.innerHTML).toBe(iconMarkup(SunIcon));
}

// A fresh in-memory Storage per test. Newer Node versions ship their own
// localStorage global that can shadow jsdom's, so the tests bring their own.
function createStorage() {
  const data = new Map();
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
  };
}

const originalMatchMedia = window.matchMedia;

beforeEach(() => {
  delete document.documentElement.dataset.theme;
  vi.stubGlobal('localStorage', createStorage());
  stubOsPrefersDark(false);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  delete document.documentElement.dataset.theme;
  window.matchMedia = originalMatchMedia;
});

describe('ThemeToggle', () => {
  test('is a plain button', () => {
    const { toggle } = setup();
    expect(toggle).toHaveAttribute('type', 'button');
    expect(toggle).not.toHaveAttribute('style');
  });

  test('clicking switches data-theme, ARIA state and icon, and a second click switches back', async () => {
    const { user, toggle } = setup();
    expectLight(toggle);

    await user.click(toggle);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expectDark(toggle);

    await user.click(toggle);
    expect(document.documentElement.dataset.theme).toBe('light');
    expectLight(toggle);
  });

  test('each click saves the new theme under rs2-theme', async () => {
    const { user, toggle } = setup();

    await user.click(toggle);
    expect(window.localStorage.getItem(KEY)).toBe('dark');

    await user.click(toggle);
    expect(window.localStorage.getItem(KEY)).toBe('light');
  });

  test('starts from a stored dark value even when the OS prefers light', () => {
    window.localStorage.setItem(KEY, 'dark');
    const { toggle } = setup();

    expect(document.documentElement.dataset.theme).toBe('dark');
    expectDark(toggle);
  });

  test('starts from a stored light value even when the OS prefers dark', () => {
    stubOsPrefersDark(true);
    window.localStorage.setItem(KEY, 'light');
    const { toggle } = setup();

    expect(document.documentElement.dataset.theme).toBe('light');
    expectLight(toggle);
  });

  test('with nothing stored it follows the OS dark preference and leaves data-theme unset', () => {
    stubOsPrefersDark(true);
    const { toggle } = setup();

    expectDark(toggle);
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  test('with nothing stored it follows the OS light preference', () => {
    const { toggle } = setup();

    expectLight(toggle);
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  test('an unrecognised stored value falls back to the OS preference', () => {
    stubOsPrefersDark(true);
    window.localStorage.setItem(KEY, 'purple');
    const { toggle } = setup();

    expectDark(toggle);
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  test('from the OS dark default, the first click switches to light', async () => {
    stubOsPrefersDark(true);
    const { user, toggle } = setup();

    await user.click(toggle);
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(window.localStorage.getItem(KEY)).toBe('light');
    expectLight(toggle);
  });

  test('a throwing localStorage does not crash and the toggle still works for the page', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage disabled');
    });

    const { user, toggle } = setup();
    expectLight(toggle);

    await user.click(toggle);
    expect(document.documentElement.dataset.theme).toBe('dark');
    expectDark(toggle);

    await user.click(toggle);
    expect(document.documentElement.dataset.theme).toBe('light');
    expectLight(toggle);

    expect(consoleError).not.toHaveBeenCalled();
  });
});

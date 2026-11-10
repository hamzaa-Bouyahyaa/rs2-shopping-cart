// Light/dark theme choice. The value lives in localStorage under rs2-theme and
// is mirrored onto <html data-theme>, which the palette in index.css keys off.
// The inline pre-paint script in index.html uses the same key and values, so
// keep the two in sync.

export const THEME_STORAGE_KEY = 'rs2-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export function isTheme(value) {
  return value === 'light' || value === 'dark';
}

// Storage can throw (privacy modes, disabled storage, quota), so every access
// is guarded and a failure simply means "no saved choice".
export function getStoredTheme() {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
}

function storeTheme(theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // The choice still applies to this page; it just won't be remembered.
  }
}

export function getSystemTheme() {
  try {
    return typeof window.matchMedia === 'function' && window.matchMedia(DARK_QUERY).matches
      ? 'dark'
      : 'light';
  } catch {
    return 'light';
  }
}

// The theme in effect: an explicit data-theme on <html> (set by the pre-paint
// script or an earlier click), then the saved choice, then the OS setting.
export function getEffectiveTheme() {
  const applied = document.documentElement.dataset.theme;
  if (isTheme(applied)) return applied;
  return getStoredTheme() ?? getSystemTheme();
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export function toggleTheme() {
  const next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  storeTheme(next);
  return next;
}

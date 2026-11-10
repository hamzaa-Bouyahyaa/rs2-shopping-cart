import { useEffect, useState } from 'react';
import { MoonIcon, SunIcon } from '../icons';
import { applyTheme, getEffectiveTheme, getStoredTheme, toggleTheme } from '../theme/theme';
import '../styles/ThemeToggle.css';

// Sun/moon button that flips the whole app between the light and dark palettes.
// With no saved choice, data-theme stays unset so the CSS keeps following the OS.

export default function ThemeToggle() {
  const [theme, setTheme] = useState(getEffectiveTheme);

  // The pre-paint script normally applies the saved choice already; this keeps
  // <html> and the button in step if it did not run (e.g. in tests).
  useEffect(() => {
    const stored = getStoredTheme();
    if (stored) {
      applyTheme(stored);
      setTheme(stored);
    }
  }, []);

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-pressed={isDark}
      aria-label={label}
      title={label}
      onClick={() => setTheme(toggleTheme())}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

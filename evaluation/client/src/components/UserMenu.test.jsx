import { describe, expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserMenu from './UserMenu';

function setup() {
  const user = userEvent.setup();
  const onLogout = vi.fn();
  render(<UserMenu user={{ loginName: 'rs2user' }} onLogout={onLogout} />);
  return { user, onLogout, toggle: screen.getByRole('button', { name: /menu/i }) };
}

// jsdom does not apply stylesheets, so visibility is asserted through the
// aria-expanded / is-open contract that the CSS keys off.
function panel() {
  return screen.getByRole('button', { name: /logout/i }).closest('.user-menu-panel');
}

describe('UserMenu', () => {
  test('burger toggles the panel open and closed', async () => {
    const { user, toggle } = setup();

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toHaveClass('is-open');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(panel()).toHaveClass('is-open');

    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(panel()).not.toHaveClass('is-open');
  });

  test('Escape closes the panel and returns focus to the burger', async () => {
    const { user, toggle } = setup();

    await user.click(toggle);
    await user.keyboard('{Escape}');

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  test('clicking outside closes the panel', async () => {
    const { user, toggle } = setup();

    await user.click(toggle);
    await user.click(document.body);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });

  test('the logout button fires onLogout', async () => {
    const { user, onLogout, toggle } = setup();

    await user.click(toggle);
    await user.click(screen.getByRole('button', { name: /logout/i }));

    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});

import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';
import * as api from '../services/api';

vi.mock('../services/api', () => ({
  login: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function setup(onLogin = vi.fn()) {
  const user = userEvent.setup();
  render(<LoginForm onLogin={onLogin} />);
  return { user, onLogin };
}

describe('LoginForm', () => {
  test('blocks submission and warns when fields are empty', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(screen.getByText(/enter both login name and password/i)).toBeInTheDocument();
    expect(api.login).not.toHaveBeenCalled();
  });

  test('passes the trimmed credentials up on success', async () => {
    api.login.mockResolvedValue({ user: { loginName: 'rs2user' } });
    const { user, onLogin } = setup();

    await user.type(screen.getByLabelText(/login name/i), '  rs2user  ');
    await user.type(screen.getByLabelText(/password/i), 'Password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(api.login).toHaveBeenCalledWith('rs2user', 'Password');
    expect(onLogin).toHaveBeenCalledWith({ loginName: 'rs2user' });
  });

  test('maps a 401 to a friendly message', async () => {
    api.login.mockRejectedValue({ status: 401, message: 'Unauthorized' });
    const { user, onLogin } = setup();

    await user.type(screen.getByLabelText(/login name/i), 'rs2user');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/invalid login name or password/i)).toBeInTheDocument();
    expect(onLogin).not.toHaveBeenCalled();
  });

  test('shows the error message for a non-401 failure', async () => {
    api.login.mockRejectedValue({
      status: 0,
      message: 'Network error. Please check your connection and try again.',
    });
    const { user } = setup();

    await user.type(screen.getByLabelText(/login name/i), 'rs2user');
    await user.type(screen.getByLabelText(/password/i), 'Password');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText(/network error/i)).toBeInTheDocument();
  });
});

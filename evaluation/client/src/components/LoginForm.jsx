import { useState } from 'react';
import * as api from '../services/api';
import { EyeIcon, EyeOffIcon } from '../icons';

// Field lengths follow the User table from the brief: Varchar2(20) for both.
const MAX_FIELD_LENGTH = 20;

export default function LoginForm({ onLogin }) {
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!loginName.trim() || !password) {
      setError('Please enter both login name and password.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { user } = await api.login(loginName.trim(), password);
      onLogin(user);
    } catch (err) {
      setError(err.status === 401 ? 'Invalid login name or password.' : err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      <div className="form-field">
        <label htmlFor="loginName">Login name</label>
        <input
          id="loginName"
          type="text"
          value={loginName}
          maxLength={MAX_FIELD_LENGTH}
          autoComplete="username"
          autoFocus
          onChange={(event) => setLoginName(event.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="password">Password</label>
        <div className="password-field">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            maxLength={MAX_FIELD_LENGTH}
            autoComplete="current-password"
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Signing in...' : 'Login'}
      </button>
    </form>
  );
}

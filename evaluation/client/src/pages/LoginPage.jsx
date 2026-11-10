import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import ThemeToggle from '../components/ThemeToggle';
import '../styles/LoginPage.css';

export default function LoginPage({ onLogin }) {
  const navigate = useNavigate();

  function handleLogin(user) {
    onLogin(user);
    navigate('/products', { replace: true });
  }

  return (
    <main className="login-page">
      <ThemeToggle />
      <section className="login-card">
        <h1>RS2 Shopping Cart</h1>
        <p className="login-subtitle">Sign in to continue</p>
        <LoginForm onLogin={handleLogin} />
        <p className="login-hint">
          Demo users: <strong>rs2user</strong>, <strong>isaac</strong> or{' '}
          <strong>neil</strong>. Password: <strong>Password</strong>
        </p>
      </section>
    </main>
  );
}

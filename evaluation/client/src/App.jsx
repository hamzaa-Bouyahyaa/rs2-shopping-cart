import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProductPage from './pages/ProductPage';
import * as api from './services/api';

export default function App() {
  // undefined = session check in progress, null = not logged in
  const [user, setUser] = useState(undefined);

  // Restore the session on page load so a refresh keeps the user logged in.
  useEffect(() => {
    api
      .getCurrentUser()
      .then(({ user: currentUser }) => setUser(currentUser))
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) {
    return <p className="app-loading">Loading...</p>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          user ? <Navigate to="/products" replace /> : <LoginPage onLogin={setUser} />
        }
      />
      <Route
        path="/products"
        element={
          user ? (
            <ProductPage user={user} onLogout={() => setUser(null)} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route path="*" element={<Navigate to={user ? '/products' : '/login'} replace />} />
    </Routes>
  );
}

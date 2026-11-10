import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchPanel from '../components/SearchPanel';
import ProductGrid from '../components/ProductGrid';
import ThemeToggle from '../components/ThemeToggle';
import UserMenu from '../components/UserMenu';
import * as api from '../services/api';
import '../styles/ProductPage.css';

const DUPLICATE_MESSAGE = 'This product has already been bought.';

export default function ProductPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loadError, setLoadError] = useState(null);

  // The grid reflects the Basket table, so a page refresh keeps its contents.
  useEffect(() => {
    api
      .getBasket()
      .then(({ items: basketItems }) => setItems(basketItems))
      .catch(() => setLoadError('Could not load your basket. Please refresh the page.'));
  }, []);

  async function handleAdd({ name, type, quantity }) {
    // Buying the same product twice is rejected. Checked here first for
    // instant feedback; the server enforces the same rule and answers 409.
    // Returning the message shows it inline and keeps the form input.
    const alreadyBought = items.some(
      (item) => item.name.toLowerCase() === name.toLowerCase() && item.type === type
    );
    if (alreadyBought) {
      return DUPLICATE_MESSAGE;
    }

    try {
      const { item } = await api.addToBasket(name, type, quantity);
      setItems((current) => [...current, item]);
      return null;
    } catch (err) {
      if (err.status === 409) {
        return DUPLICATE_MESSAGE;
      }
      return err.message;
    }
  }

  async function handleRemove(basketId) {
    try {
      await api.removeFromBasket(basketId);
      setItems((current) => current.filter((item) => item.basketId !== basketId));
      setLoadError(null);
    } catch (err) {
      // A 404 means the row is already gone (e.g. removed in another tab):
      // dropping it from the grid is the correct outcome either way.
      if (err.status === 404) {
        setItems((current) => current.filter((item) => item.basketId !== basketId));
        return;
      }
      setLoadError('Could not remove the product. Please try again.');
    }
  }

  async function handleLogout() {
    await api.logout().catch(() => {});
    onLogout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="product-page">
      <header className="product-header">
        <div className="product-title">
          <img
            className="product-logo"
            src="https://www.rs2.com/wp-content/uploads/2023/06/logo-1.png"
            alt="RS2"
          />
          <h1>Shopping Cart</h1>
        </div>
        <ThemeToggle />
        <UserMenu user={user} onLogout={handleLogout} />
      </header>

      <main className="product-content">
        <SearchPanel onAdd={handleAdd} />
        {loadError && (
          <p className="load-error" role="alert">
            {loadError}
          </p>
        )}
        <div className="basket-heading">
          <h2>Your basket</h2>
          <span className="basket-count">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </span>
        </div>
        <ProductGrid items={items} onRemove={handleRemove} />
      </main>
    </div>
  );
}

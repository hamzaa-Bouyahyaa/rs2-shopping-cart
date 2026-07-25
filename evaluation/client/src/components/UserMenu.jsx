import { useEffect, useRef, useState } from 'react';
import Avatar from './Avatar';
import { CloseIcon, MenuIcon } from '../icons';
import '../styles/UserMenu.css';

// Header account cluster. Inline on desktop; behind a burger toggle on small screens.

export default function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const toggleRef = useRef(null);

  // Document listeners exist only while open, so the closed (and desktop)
  // state costs nothing.
  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current.focus();
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={rootRef}>
      <button
        ref={toggleRef}
        type="button"
        className="user-menu-toggle"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="user-menu-panel"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <CloseIcon /> : <MenuIcon />}
      </button>
      <div
        id="user-menu-panel"
        className={open ? 'user-menu-panel is-open' : 'user-menu-panel'}
      >
        <Avatar name={user.loginName} />
        <span>{user.loginName}</span>
        <button type="button" onClick={onLogout}>
          Logout
        </button>
      </div>
    </div>
  );
}

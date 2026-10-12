import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState(params.get('search') || '');

  // Close the mobile menu whenever the page changes.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  // Keep the search box in sync with the address bar on the home page.
  useEffect(() => {
    if (location.pathname === '/') setQuery(params.get('search') || '');
  }, [location.pathname, params]);

  function handleSearch(event) {
    event.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/?search=${encodeURIComponent(trimmed)}` : '/');
  }

  function handleLogout() {
    logout();
    toast.info('You have been logged out.');
    navigate('/');
  }

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="brand" aria-label="ShopSphere home">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span className="brand-name">ShopSphere</span>
        </Link>

        <form className="nav-search" role="search" onSubmit={handleSearch}>
          <label htmlFor="nav-search-input" className="sr-only">
            Search products
          </label>
          <input
            id="nav-search-input"
            type="search"
            placeholder="Search for products, categories..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-search">
            Search
          </button>
        </form>

        <button
          type="button"
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="main-nav"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span className="sr-only">Toggle menu</span>
          <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
        </button>

        <nav id="main-nav" className={`nav-links ${menuOpen ? 'open' : ''}`} aria-label="Main">
          <NavLink to="/" end>
            Shop
          </NavLink>
          {user && <NavLink to="/orders">My Orders</NavLink>}
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
          <NavLink to="/cart" className="nav-cart">
            Cart
            {itemCount > 0 && (
              <span className="cart-badge" aria-label={`${itemCount} items in cart`}>
                {itemCount}
              </span>
            )}
          </NavLink>
          {user ? (
            <div className="nav-user">
              <span className="nav-user-name" title={user.email}>
                Hi, {user.name.split(' ')[0]}
              </span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
                Log out
              </button>
            </div>
          ) : (
            <div className="nav-user">
              <Link to="/login" className="btn btn-secondary btn-sm">
                Log in
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}

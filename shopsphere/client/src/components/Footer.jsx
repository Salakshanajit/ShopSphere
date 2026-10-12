import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="brand brand-footer">
            <span className="brand-mark" aria-hidden="true">
              S
            </span>
            <span className="brand-name">ShopSphere</span>
          </div>
          <p className="footer-text">
            A full-stack e-commerce demo built with React, Express and MySQL. No real payments are processed.
          </p>
        </div>
        <div>
          <h2 className="footer-heading">Shop</h2>
          <ul className="footer-links">
            <li>
              <Link to="/">All products</Link>
            </li>
            <li>
              <Link to="/cart">Your cart</Link>
            </li>
            <li>
              <Link to="/orders">Track orders</Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="footer-heading">Account</h2>
          <ul className="footer-links">
            <li>
              <Link to="/login">Log in</Link>
            </li>
            <li>
              <Link to="/register">Create account</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container">© {new Date().getFullYear()} ShopSphere – college project demo store</div>
      </div>
    </footer>
  );
}

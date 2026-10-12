import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container page">
      <div className="empty-state">
        <div className="empty-icon" aria-hidden="true">
          🧭
        </div>
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link to="/" className="btn btn-primary">
          Back to the shop
        </Link>
      </div>
    </div>
  );
}

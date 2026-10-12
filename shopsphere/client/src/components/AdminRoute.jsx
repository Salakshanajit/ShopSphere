import { Link, Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

// Only ADMIN users may see the pages nested inside this route. It also draws the admin sidebar.
// (The server checks the role again on every admin API call - this is just for a nicer screen.)
export default function AdminRoute() {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Checking your session..." />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location, message: 'Please log in as an administrator.' }} />;
  }
  if (!isAdmin) {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            🔒
          </div>
          <h1>Access denied</h1>
          <p>This area is only for administrators.</p>
          <Link to="/" className="btn btn-primary">
            Back to the shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page admin-layout">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <h2 className="admin-title">Admin</h2>
        <nav>
          <NavLink to="/admin" end>
            Dashboard
          </NavLink>
          <NavLink to="/admin/products">Products</NavLink>
          <NavLink to="/admin/orders">Orders</NavLink>
        </nav>
      </aside>
      <section className="admin-content">
        <Outlet />
      </section>
    </div>
  );
}

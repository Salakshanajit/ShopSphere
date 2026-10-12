import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';

// Only logged-in users may see the pages nested inside this route.
export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Loader label="Checking your session..." />;
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location, message: 'Please log in to continue.' }} />;
  }
  return <Outlet />;
}

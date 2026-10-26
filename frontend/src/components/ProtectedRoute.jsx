import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import LoadingScreen from './LoadingScreen';

function ProtectedRoute() {
  const initialized = useAuthStore((state) => state.initialized);
  const token = useAuthStore((state) => state.token);
  const location = useLocation();
  if (!initialized) return <LoadingScreen label="Checking your session" />;
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export default ProtectedRoute;
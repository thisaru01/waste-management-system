import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function ProtectedRoute() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function RoleGuard({ roles }) {
  const { hasRole } = useAuth();
  const ok = roles.some((r) => hasRole(r));
  if (!ok) return <Navigate to="/" replace />;
  return <Outlet />;
}

export default ProtectedRoute;

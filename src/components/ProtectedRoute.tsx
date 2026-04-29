import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { UserRole } from '../types';

interface Props {
  requiredRole: UserRole;
  redirectTo?: string;
}

export default function ProtectedRoute({ requiredRole, redirectTo = '/login' }: Props) {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to={redirectTo} replace />;
  if (user.role !== requiredRole) {
    const roleMap: Record<string, string> = {
      personal: '/personal/dashboard',
      aluno: '/aluno/dashboard',
      academia: '/academia/dashboard',
    };
    return <Navigate to={roleMap[user.role] ?? '/login'} replace />;
  }
  if (user.role === 'aluno' && user.isBlocked) {
    return <Navigate to="/aluno/bloqueado" replace />;
  }
  return <Outlet />;
}

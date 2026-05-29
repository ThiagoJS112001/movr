import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROLE_ROUTES } from '../lib/constants';
import type { UserRole } from '../types';

interface Props {
  requiredRole: UserRole;
  redirectTo?: string;
}

export default function ProtectedRoute({ requiredRole, redirectTo = '/login' }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-[#080B18]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to={redirectTo} replace />;
  if (user.role !== requiredRole) {
    return <Navigate to={ROLE_ROUTES[user.role] ?? '/login'} replace />;
  }
  if (user.isBlocked) {
    return <Navigate to="/aluno/bloqueado" replace />;
  }
  return <Outlet />;
}

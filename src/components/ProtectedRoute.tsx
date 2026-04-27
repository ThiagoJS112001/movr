import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import type { UserRole } from '../types';

interface Props {
  requiredRole: UserRole;
  redirectTo?: string;
}

export default function ProtectedRoute({ requiredRole, redirectTo = '/login' }: Props) {
  const { user } = useAuth();
  const { isStudentBlocked } = useApp();

  if (!user) return <Navigate to={redirectTo} replace />;
  if (user.role !== requiredRole) {
    const roleMap: Record<string, string> = {
      personal: '/personal/dashboard',
      aluno: '/aluno/dashboard',
      academia: '/academia/dashboard',
    };
    return <Navigate to={roleMap[user.role] ?? '/login'} replace />;
  }
  if (user.role === 'aluno' && isStudentBlocked(user.id)) {
    return <Navigate to="/aluno/bloqueado" replace />;
  }
  return <Outlet />;
}

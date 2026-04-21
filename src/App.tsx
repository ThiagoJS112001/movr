import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './contexts/AuthContext';

// Auth
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import PersonalLayout from './components/layout/PersonalLayout';
import AlunoLayout from './components/layout/AlunoLayout';

// Personal pages
import PersonalDashboard from './pages/personal/PersonalDashboard';
import AlunosPage from './pages/personal/AlunosPage';
import TreinosPage from './pages/personal/TreinosPage';
import TreinoDetalhe from './pages/personal/TreinoDetalhe';
import PersonalChatPage from './pages/personal/PersonalChatPage';
import DietasPage from './pages/personal/DietasPage';
import DietaDetalhe from './pages/personal/DietaDetalhe';
import PersonalRelatoriosPage from './pages/personal/PersonalRelatoriosPage';

// Aluno pages
import AlunoDashboard from './pages/aluno/AlunoDashboard';
import AlunoTreinoPage from './pages/aluno/AlunoTreinoPage';
import AlunoHistoricoPage from './pages/aluno/AlunoHistoricoPage';
import AlunoChatPage from './pages/aluno/AlunoChatPage';
import AlunoDietaPage from './pages/aluno/AlunoDietaPage';
import AlunoProgressoPage from './pages/aluno/AlunoProgressoPage';
import AcessoBloqueadoPage from './pages/aluno/AcessoBloqueadoPage';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <Navigate
      to={user.role === 'personal' ? '/personal/dashboard' : '/aluno/dashboard'}
      replace
    />
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Personal routes */}
        <Route element={<ProtectedRoute requiredRole="personal" />}>
          <Route element={<PersonalLayout />}>
            <Route path="/personal/dashboard" element={<PersonalDashboard />} />
            <Route path="/personal/alunos" element={<AlunosPage />} />
            <Route path="/personal/treinos" element={<TreinosPage />} />
            <Route path="/personal/treinos/:id" element={<TreinoDetalhe />} />
            <Route path="/personal/dietas" element={<DietasPage />} />
            <Route path="/personal/dietas/:id" element={<DietaDetalhe />} />
            <Route path="/personal/chat" element={<PersonalChatPage />} />
            <Route path="/personal/relatorios" element={<PersonalRelatoriosPage />} />
          </Route>
        </Route>

        {/* Aluno routes */}
        <Route element={<ProtectedRoute requiredRole="aluno" />}>
          <Route element={<AlunoLayout />}>
            <Route path="/aluno/dashboard" element={<AlunoDashboard />} />
            <Route path="/aluno/treino/:assignmentId" element={<AlunoTreinoPage />} />
            <Route path="/aluno/historico" element={<AlunoHistoricoPage />} />
            <Route path="/aluno/dieta" element={<AlunoDietaPage />} />
            <Route path="/aluno/progresso" element={<AlunoProgressoPage />} />
            <Route path="/aluno/chat" element={<AlunoChatPage />} />
          </Route>
        </Route>

        {/* Blocked aluno */}
        <Route path="/aluno/bloqueado" element={<AcessoBloqueadoPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors position="top-right" />
    </>
  );
}


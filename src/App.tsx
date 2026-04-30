import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './contexts/AuthContext';

// Auth
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import PersonalLayout from './components/layout/PersonalLayout';
import AlunoLayout from './components/layout/AlunoLayout';
import AcademiaLayout from './components/layout/AcademiaLayout';

// Personal pages
import PersonalDashboard from './pages/personal/PersonalDashboard';
import AlunosPage from './pages/personal/AlunosPage';
import AlunoDetalhe from './pages/personal/AlunoDetalhe';
import ExerciciosPage from './pages/personal/ExerciciosPage';
import TreinosPage from './pages/personal/TreinosPage';
import TreinoDetalhe from './pages/personal/TreinoDetalhe';
import PersonalChatPage from './pages/personal/PersonalChatPage';
import DietasPage from './pages/personal/DietasPage';
import DietaDetalhe from './pages/personal/DietaDetalhe';
import PersonalRelatoriosPage from './pages/personal/PersonalRelatoriosPage';
import HistoricoPlanoPage from './pages/personal/HistoricoPlanoPage';

// Aluno pages
import AlunoDashboard from './pages/aluno/AlunoDashboard';
import AlunoTreinoPage from './pages/aluno/AlunoTreinoPage';
import AlunoHistoricoPage from './pages/aluno/AlunoHistoricoPage';
import AlunoChatPage from './pages/aluno/AlunoChatPage';
import AlunoDietaPage from './pages/aluno/AlunoDietaPage';
import AlunoProgressoPage from './pages/aluno/AlunoProgressoPage';
import AcessoBloqueadoPage from './pages/aluno/AcessoBloqueadoPage';
import AlunoGruposPage from './pages/aluno/AlunoGruposPage';
import AlunoGrupoChatPage from './pages/aluno/AlunoGrupoChatPage';
import AlunoAcademiasPage from './pages/aluno/AlunoAcademiasPage';

// Academia pages
import AcademiaDashboard from './pages/academia/AcademiaDashboard';
import AcademiaPerfilPage from './pages/academia/AcademiaPerfilPage';
import AcademiaGruposPage from './pages/academia/AcademiaGruposPage';

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const roleMap: Record<string, string> = {
    personal: '/personal/dashboard',
    academia: '/academia/dashboard',
    aluno: '/aluno/dashboard',
  };
  return <Navigate to={roleMap[user.role] ?? '/aluno/dashboard'} replace />;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />

        {/* Personal routes */}
        <Route element={<ProtectedRoute requiredRole="personal" />}>
          <Route element={<PersonalLayout />}>
            <Route path="/personal/dashboard" element={<PersonalDashboard />} />
            <Route path="/personal/alunos" element={<AlunosPage />} />
            <Route path="/personal/alunos/:id" element={<AlunoDetalhe />} />
            <Route path="/personal/exercicios" element={<ExerciciosPage />} />
            <Route path="/personal/treinos" element={<TreinosPage />} />
            <Route path="/personal/treinos/:id" element={<TreinoDetalhe />} />
            <Route path="/personal/dietas" element={<DietasPage />} />
            <Route path="/personal/dietas/:id" element={<DietaDetalhe />} />
            <Route path="/personal/chat" element={<PersonalChatPage />} />
            <Route path="/personal/relatorios" element={<PersonalRelatoriosPage />} />
            <Route path="/personal/historico-planos" element={<HistoricoPlanoPage />} />
          </Route>
        </Route>

        {/* Aluno routes */}
        <Route element={<ProtectedRoute requiredRole="aluno" />}>
          <Route element={<AlunoLayout />}>
            <Route path="/aluno/dashboard" element={<AlunoDashboard />} />
            <Route path="/aluno/treino" element={<AlunoTreinoPage />} />
            <Route path="/aluno/historico" element={<AlunoHistoricoPage />} />
            <Route path="/aluno/dieta" element={<AlunoDietaPage />} />
            <Route path="/aluno/progresso" element={<AlunoProgressoPage />} />
            <Route path="/aluno/chat" element={<AlunoChatPage />} />
            <Route path="/aluno/grupos" element={<AlunoGruposPage />} />
            <Route path="/aluno/grupos/:id" element={<AlunoGrupoChatPage />} />
            <Route path="/aluno/academias" element={<AlunoAcademiasPage />} />
          </Route>
        </Route>

        {/* Academia routes */}
        <Route element={<ProtectedRoute requiredRole="academia" />}>
          <Route element={<AcademiaLayout />}>
            <Route path="/academia/dashboard" element={<AcademiaDashboard />} />
            <Route path="/academia/perfil" element={<AcademiaPerfilPage />} />
            <Route path="/academia/grupos" element={<AcademiaGruposPage />} />
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


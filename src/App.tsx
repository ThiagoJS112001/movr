import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuth } from './contexts/AuthContext';
import { PageSkeleton } from './components/ui';
import { ROLE_ROUTES } from './lib/constants';

// Layouts & guard â€” small, needed immediately, keep eager
import PersonalLayout from './components/layout/PersonalLayout';
import AlunoLayout from './components/layout/AlunoLayout';
import AcademiaLayout from './components/layout/AcademiaLayout';
import ProtectedRoute from './components/ProtectedRoute';

// â”€â”€ Lazy pages â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Auth (kept lazy too â€” user may land on dashboard directly)
const LoginPage             = lazy(() => import('./pages/LoginPage'));
const RegisterPage          = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage    = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage     = lazy(() => import('./pages/ResetPasswordPage'));
const CompletarPerfilPage   = lazy(() => import('./pages/CompletarPerfilPage'));

// Personal
const PersonalDashboard     = lazy(() => import('./pages/personal/PersonalDashboard'));
const AlunosPage            = lazy(() => import('./pages/personal/AlunosPage'));
const AlunoDetalhe          = lazy(() => import('./pages/personal/AlunoDetalhe'));
const ExerciciosPage        = lazy(() => import('./pages/personal/ExerciciosPage'));
const TreinosPage           = lazy(() => import('./pages/personal/TreinosPage'));
const TreinoDetalhe         = lazy(() => import('./pages/personal/TreinoDetalhe'));
const PersonalChatPage      = lazy(() => import('./pages/personal/PersonalChatPage'));
const DietasPage            = lazy(() => import('./pages/personal/DietasPage'));
const DietaDetalhe          = lazy(() => import('./pages/personal/DietaDetalhe'));
const PersonalRelatoriosPage = lazy(() => import('./pages/personal/PersonalRelatoriosPage'));
const HistoricoPlanoPage    = lazy(() => import('./pages/personal/HistoricoPlanoPage'));

// Aluno
const AlunoDashboard        = lazy(() => import('./pages/aluno/AlunoDashboard'));
const AlunoTreinoPage       = lazy(() => import('./pages/aluno/AlunoTreinoPage'));
const AlunoHistoricoPage    = lazy(() => import('./pages/aluno/AlunoHistoricoPage'));
const AlunoChatPage         = lazy(() => import('./pages/aluno/AlunoChatPage'));
const AlunoDietaPage        = lazy(() => import('./pages/aluno/AlunoDietaPage'));
const AlunoProgressoPage    = lazy(() => import('./pages/aluno/AlunoProgressoPage'));
const AcessoBloqueadoPage   = lazy(() => import('./pages/aluno/AcessoBloqueadoPage'));
const AlunoAcademiasPage    = lazy(() => import('./pages/aluno/AlunoAcademiasPage'));
const GymPerfilPage         = lazy(() => import('./pages/aluno/GymPerfilPage'));
const AlunoAmigosPage       = lazy(() => import('./pages/aluno/AlunoAmigosPage'));
const AlunoPersonaisPage    = lazy(() => import('./pages/aluno/AlunoPersonaisPage'));
const PersonalPerfilPage    = lazy(() => import('./pages/aluno/PersonalPerfilPage'));
const CheckoutPage          = lazy(() => import('./pages/aluno/CheckoutPage'));
const AlunoGruposPage       = lazy(() => import('./pages/aluno/AlunoGruposPage'));
const AlunoGrupoChatPage    = lazy(() => import('./pages/aluno/AlunoGrupoChatPage'));
const AlunoAgendaPage       = lazy(() => import('./pages/aluno/AlunoAgendaPage'));
const AlunoAssinaturaPage   = lazy(() => import('./pages/aluno/AlunoAssinaturaPage'));

// Academia
const AcademiaDashboard     = lazy(() => import('./pages/academia/AcademiaDashboard'));
const AcademiaPerfilPage    = lazy(() => import('./pages/academia/AcademiaPerfilPage'));
const AcademiaGruposPage    = lazy(() => import('./pages/academia/AcademiaGruposPage'));

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={ROLE_ROUTES[user.role] ?? '/aluno/dashboard'} replace />;
}

export default function App() {
  return (
    <>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

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
              <Route path="/aluno/academias" element={<AlunoAcademiasPage />} />
              <Route path="/aluno/academias/:id" element={<GymPerfilPage />} />
              <Route path="/aluno/personais" element={<AlunoPersonaisPage />} />
              <Route path="/aluno/personais/:id" element={<PersonalPerfilPage />} />
              <Route path="/aluno/checkout/:id" element={<CheckoutPage />} />
              <Route path="/aluno/amigos" element={<AlunoAmigosPage />} />
              <Route path="/aluno/grupos" element={<AlunoGruposPage />} />
              <Route path="/aluno/grupos/:id" element={<AlunoGrupoChatPage />} />
              <Route path="/aluno/agenda" element={<AlunoAgendaPage />} />
              <Route path="/aluno/assinatura" element={<AlunoAssinaturaPage />} />
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

          {/* Completar perfil â€“ shared full-screen page, no layout wrapper */}
          <Route path="/completar-perfil" element={<CompletarPerfilPage />} />

          {/* Blocked aluno */}
          <Route path="/aluno/bloqueado" element={<AcessoBloqueadoPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster richColors position="top-right" />
    </>
  );
}


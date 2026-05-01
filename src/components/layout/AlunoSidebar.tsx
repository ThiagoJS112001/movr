import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageCircle,
  ClipboardList,
  LogOut,
  Menu,
  X,
  Salad,
  TrendingUp,
  Settings,
  Users,
  Building2,
  UserPlus,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTotalUnread } from '../../hooks/useMessages';
import { useSettings } from '../../contexts/SettingsContext';
import { APP_NAME } from '../../lib/constants';
import SettingsModal from '../SettingsModal';
import MovrLogo from '../ui/MovrLogo';

const ALL_NAV_ITEMS = [
  { to: '/aluno/dashboard', label: 'Meus Treinos', icon: LayoutDashboard },
  { to: '/aluno/dieta', label: 'Minha Dieta', icon: Salad },
  { to: '/aluno/historico', label: 'Histórico', icon: ClipboardList },
  { to: '/aluno/progresso', label: 'Progresso', icon: TrendingUp },
  { to: '/aluno/academias', label: 'Academias', icon: Building2 },
  { to: '/aluno/amigos', label: 'Adicionar Amigos', icon: UserPlus },
  { to: '/aluno/chat', label: 'Chat', icon: MessageCircle },
];

export default function AlunoSidebar() {
  const { user, logout } = useAuth();
  const unread = useTotalUnread();
  const { isNavVisible } = useSettings();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const navItems = ALL_NAV_ITEMS.filter((item) => isNavVisible(item.to));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const links = (
    <nav className="flex flex-col gap-1 mt-4">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-emerald-600 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`
          }

        >
          <Icon size={18} />
          <span>{label}</span>
          {label === 'Chat' && unread > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {unread}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2 font-bold text-emerald-400">
          <MovrLogo size={22} />
          <span>{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setSettingsOpen(true)} className="p-1 text-slate-400 hover:text-white transition-colors">
            <Settings size={18} />
          </button>
          <button onClick={() => setMobileOpen((v) => !v)} className="p-1">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`md:hidden fixed top-0 left-0 h-full w-64 bg-slate-900 z-40 transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        <div className="flex items-center gap-2 font-bold text-emerald-400 px-4 pt-5 pb-2 text-lg">
          <MovrLogo size={22} />
          {APP_NAME}
        </div>
        <div className="px-3 flex-1 overflow-y-auto">{links}</div>
        <div className="px-3 pb-5 mt-auto">
          <div className="text-xs text-slate-500 px-4 mb-2">{user?.name}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-slate-900 min-h-screen py-5 px-3 fixed top-0 left-0 h-full">
        <div className="flex items-center gap-2 font-bold text-emerald-400 px-4 mb-2 text-lg">
          <MovrLogo size={22} />
          {APP_NAME}
        </div>
        <div className="flex-1 overflow-y-auto">{links}</div>
        <div className="mt-auto">
          <div className="text-xs text-slate-500 px-4 mb-1">{user?.name}</div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 px-4 py-2 w-full rounded-xl text-sm text-slate-400 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <Settings size={16} />
            Configurações
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        navItems={ALL_NAV_ITEMS}
        accent="emerald"
      />
    </>
  );
}


import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageCircle,
  ClipboardList,
  LogOut,
  Salad,
  TrendingUp,
  Settings,
  Building2,
  UserPlus,
  Dumbbell,
  Search,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTotalUnread } from '../../hooks/useMessages';
import { useSettings } from '../../contexts/SettingsContext';
import { APP_NAME } from '../../lib/constants';
import SettingsModal from '../SettingsModal';
import AlunoPerfilModal from '../AlunoPerfilModal';
import MovrLogo from '../ui/MovrLogo';

// Full nav items for desktop sidebar
const ALL_NAV_ITEMS = [
  { to: '/aluno/dashboard', label: 'Home',             icon: LayoutDashboard },
  { to: '/aluno/treino',    label: 'Meus Treinos',     icon: Dumbbell        },
  { to: '/aluno/dieta',     label: 'Minha Dieta',      icon: Salad           },
  { to: '/aluno/historico', label: 'Histórico',        icon: ClipboardList   },
  { to: '/aluno/progresso', label: 'Progresso',        icon: TrendingUp      },
  { to: '/aluno/academias', label: 'Buscar',           icon: Building2       },
  { to: '/aluno/amigos',    label: 'Adicionar Amigos', icon: UserPlus        },
  { to: '/aluno/chat',      label: 'Chat',             icon: MessageCircle   },
];

// 5-item bottom navigation (mobile)
const BOTTOM_NAV = [
  { to: '/aluno/dashboard', label: 'Home',   icon: LayoutDashboard },
  { to: '/aluno/treino',    label: 'Treinos', icon: Dumbbell        },
  { to: '/aluno/academias', label: 'Buscar',  icon: Search          },
  { to: '/aluno/dieta',     label: 'Dieta',   icon: Salad           },
  { to: '/aluno/progresso', label: 'Perfil',  icon: User            },
];

export default function AlunoSidebar() {
  const { user, logout } = useAuth();
  const unread = useTotalUnread();
  const { isNavVisible } = useSettings();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [perfilOpen, setPerfilOpen] = useState(false);

  const navItems = ALL_NAV_ITEMS.filter((item) => isNavVisible(item.to));

  function handleLogout() {
    logout();
    navigate('/login');
  }

  // Desktop sidebar links
  const desktopLinks = (
    <nav className="flex flex-col gap-0.5 mt-4">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-[#7c5cfc]/15 text-[#7c5cfc]'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`
          }
        >
          <Icon size={17} />
          <span>{label}</span>
          {label === 'Chat' && unread > 0 && (
            <span className="ml-auto bg-[#7c5cfc] text-white text-[10px] rounded-full w-4.5 h-4.5 flex items-center justify-center leading-none px-1">
              {unread}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      {/* ── Mobile bottom navigation ──────────────────────────────── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0d0f14] border-t border-white/5 flex safe-area-inset-bottom">
        {BOTTOM_NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-[#7c5cfc]' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── Desktop sidebar ───────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-[220px] bg-[#0d0f14] border-r border-white/5 min-h-screen py-5 px-3 fixed top-0 left-0 h-full">
        <div className="flex items-center gap-2 font-bold text-[#7c5cfc] px-3 mb-2 text-lg">
          <MovrLogo size={22} />
          <span className="font-['Syne']">{APP_NAME}</span>
        </div>
        <div className="flex-1 overflow-y-auto">{desktopLinks}</div>
        <div className="mt-auto">
          {/* Profile button */}
          <button
            onClick={() => setPerfilOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors group mb-0.5"
          >
            <div className="w-8 h-8 rounded-full bg-[#7c5cfc]/20 border border-[#7c5cfc]/40 flex items-center justify-center text-[#7c5cfc] text-xs font-bold shrink-0 select-none">
              {user?.name
                ? user.name
                    .split(' ')
                    .slice(0, 2)
                    .map((w) => w[0])
                    .join('')
                    .toUpperCase()
                : '?'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-slate-300 group-hover:text-white truncate transition-colors leading-tight">
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-600 group-hover:text-slate-400 transition-colors leading-tight">
                Ver perfil
              </p>
            </div>
          </button>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-slate-500 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Settings size={16} />
            Configurações
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm text-slate-500 hover:bg-white/5 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
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
      <AlunoPerfilModal
        open={perfilOpen}
        onClose={() => setPerfilOpen(false)}
      />
    </>
  );
}


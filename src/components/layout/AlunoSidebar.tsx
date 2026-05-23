import { NavLink, useNavigate } from 'react-router-dom';
import { Settings, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTotalUnread } from '../../hooks/useMessages';
import { useSettings } from '../../contexts/SettingsContext';
import SettingsModal from '../SettingsModal';

// -- Sidebar sections & items --------------------------------------------------

const NAV_SECTIONS = [
  {
    label: 'MEU ESPAÇO',
    items: [
      { to: '/aluno/dashboard', label: 'Dashboard'       },
      { to: '/aluno/treino',    label: 'Meus Treinos'    },
      { to: '/aluno/dieta',     label: 'Minha Dieta'     },
      { to: '/aluno/progresso', label: 'Progresso'       },
      { to: '/aluno/historico', label: 'Histórico'       },
    ],
  },
  {
    label: 'DESCOBRIR',
    items: [
      { to: '/aluno/personais', label: 'Personais'       },
      { to: '/aluno/academias', label: 'Academias'       },
    ],
  },
  {
    label: 'SOCIAL',
    items: [
      { to: '/aluno/chat',   label: 'Chat',             badge: true },
      { to: '/aluno/grupos', label: 'Grupos'                        },
      { to: '/aluno/amigos', label: 'Adicionar amigos'              },
    ],
  },
  {
    label: 'AGENDA',
    items: [
      { to: '/aluno/agenda',     label: 'Minha agenda'  },
      { to: '/aluno/assinatura', label: 'Assinatura'    },
    ],
  },
];

// Bottom nav items (mobile)
const BOTTOM_NAV = [
  { to: '/aluno/dashboard', label: 'Home'    },
  { to: '/aluno/treino',    label: 'Treinos' },
  { to: '/aluno/personais', label: 'Buscar'  },
  { to: '/aluno/dieta',     label: 'Dieta'   },
  { to: '/aluno/chat',      label: 'Chat'    },
];

// -- Component -----------------------------------------------------------------

export default function AlunoSidebar() {
  const { user, logout } = useAuth();
  const unread = useTotalUnread();
  const { isNavVisible } = useSettings();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const initials = user?.name
    ? user.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';

  return (
    <>
      {/* -- Mobile bottom navigation ---------------------------------------- */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080B18] border-t border-white/5 flex safe-area-inset-bottom">
        {BOTTOM_NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-3 text-[11px] font-medium transition-colors ${
                isActive ? 'text-[#7c5cfc]' : 'text-slate-500 hover:text-slate-300'
              }`
            }
          >
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* -- Desktop sidebar ------------------------------------------------- */}
      <aside className="hidden md:flex flex-col w-[220px] bg-[#080B18] border-r border-white/[0.06] min-h-screen py-5 px-3 fixed top-0 left-0 h-full overflow-y-auto">

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 mb-5">
          <div className="w-8 h-8 rounded-lg bg-[#7c5cfc] flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-black">M</span>
          </div>
          <span className="text-white font-bold text-base tracking-tight">movr.</span>
        </div>

        {/* Nav sections */}
        <div className="flex-1 flex flex-col gap-4">
          {NAV_SECTIONS.map(({ label, items }) => {
            const visibleItems = items.filter((item) => isNavVisible(item.to));
            if (visibleItems.length === 0) return null;
            return (
              <div key={label}>
                <p className="text-[10px] font-semibold text-slate-500 tracking-[0.12em] px-2 mb-1">
                  {label}
                </p>
                <div className="flex flex-col gap-0.5">
                  {visibleItems.map(({ to, label: itemLabel, badge }) => (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 px-3 py-[7px] rounded-lg text-sm font-medium transition-all relative ${
                          isActive
                            ? 'bg-[#7c5cfc]/10 text-white border-l-2 border-[#7c5cfc]'
                            : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200 border-l-2 border-transparent'
                        }`
                      }
                    >
                      <span className="flex-1">{itemLabel}</span>
                      {badge && unread > 0 && (
                        <span className="ml-auto bg-[#7c5cfc] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shrink-0">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom: profile + settings + logout */}
        <div className="mt-5 pt-4 border-t border-white/[0.06] flex flex-col gap-0.5">
          {/* Profile */}
          <button
            onClick={() => navigate('/completar-perfil')}
            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.04] transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-[#7c5cfc]/25 border border-[#7c5cfc]/50 flex items-center justify-center text-[#7c5cfc] text-xs font-bold shrink-0 select-none">
              {initials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-slate-200 group-hover:text-white truncate leading-tight">
                {user?.name}
              </p>
              <p className="text-[10px] text-slate-500 group-hover:text-slate-400 leading-tight">
                Ver perfil
              </p>
            </div>
            <Settings
              size={14}
              className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0"
              onClick={(e) => { e.stopPropagation(); setSettingsOpen(true); }}
            />
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 px-2 py-2 w-full rounded-lg text-sm text-slate-500 hover:bg-white/[0.04] hover:text-red-400 transition-colors"
          >
            <LogOut size={15} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        navItems={NAV_SECTIONS.flatMap((s) => s.items.map((i) => ({ to: i.to, label: i.label, icon: (() => null) as any })))}
        accent="emerald"
      />

    </>
  );
}


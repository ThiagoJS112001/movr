import { NavLink, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  Users,
  LogOut,
  Menu,
  X,
  Settings,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { APP_NAME } from '../../lib/constants';
import SettingsModal from '../SettingsModal';
import MovrLogo from '../ui/MovrLogo';

const NAV_ITEMS = [
  { to: '/academia/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/academia/perfil', label: 'Minha Academia', icon: Building2 },
  { to: '/academia/grupos', label: 'Grupos & Ofertas', icon: Users },
];

export default function AcademiaSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const links = (
    <nav className="flex flex-col gap-1 mt-4">
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? 'bg-violet-600 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`
          }
        >
          <Icon size={18} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  const footer = (
    <div className="mt-auto pt-4 border-t border-slate-700/50 space-y-1">
      <button
        onClick={() => { setSettingsOpen(true); setMobileOpen(false); }}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
      >
        <Settings size={18} />
        Configurações
      </button>
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
      >
        <LogOut size={18} />
        Sair
      </button>
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between bg-slate-900 text-white px-4 py-3 fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center gap-2 font-bold text-violet-400">
          <MovrLogo size={22} />
          <span>{APP_NAME}</span>
        </div>
        <button onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        >
          <div
            className="w-56 h-full bg-slate-900 p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 font-bold text-violet-400 mb-2 px-2">
              <MovrLogo size={22} />
              <span>{APP_NAME}</span>
            </div>
            {user && (
              <p className="text-xs text-slate-400 px-2 mb-1 truncate">{user.name}</p>
            )}
            {links}
            {footer}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col w-56 bg-slate-900 fixed top-0 left-0 h-full z-20 p-4">
        <div className="flex items-center gap-2 font-bold text-violet-400 mb-1 px-2">
          <MovrLogo size={22} />
          <span>{APP_NAME}</span>
        </div>
        {user && (
          <p className="text-xs text-slate-400 px-2 mb-2 truncate">{user.name}</p>
        )}
        {links}
        {footer}
      </aside>

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </>
  );
}

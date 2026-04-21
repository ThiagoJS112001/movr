import { X, Sun, Moon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';

export interface NavItemDef {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface Props {
  open: boolean;
  onClose: () => void;
  navItems: NavItemDef[];
  accent: 'indigo' | 'emerald';
}

export default function SettingsModal({ open, onClose, navItems, accent }: Props) {
  const { theme, toggleTheme } = useTheme();
  const { isNavVisible, toggleNavItem } = useSettings();

  if (!open) return null;

  const activeBtn =
    accent === 'indigo'
      ? 'bg-indigo-600 text-white border-transparent'
      : 'bg-emerald-600 text-white border-transparent';

  const inactiveBtn =
    'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700';

  const toggleOn =
    accent === 'indigo' ? 'bg-indigo-500' : 'bg-emerald-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-80 max-w-full flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
            Configurações
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Theme */}
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
            Aparência
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                theme === 'light' ? activeBtn : inactiveBtn
              }`}
            >
              <Sun size={14} />
              Claro
            </button>
            <button
              onClick={() => theme === 'light' && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                theme === 'dark' ? activeBtn : inactiveBtn
              }`}
            >
              <Moon size={14} />
              Escuro
            </button>
          </div>
        </div>

        {/* Nav visibility */}
        <div>
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">
            Menu lateral
          </p>
          <div className="flex flex-col gap-1">
            {navItems.map(({ to, label, icon: Icon }) => {
              const visible = isNavVisible(to);
              return (
                <label
                  key={to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                >
                  {/* Toggle switch */}
                  <button
                    role="switch"
                    aria-checked={visible}
                    onClick={() => toggleNavItem(to)}
                    className={`relative inline-flex w-9 h-5 rounded-full flex-shrink-0 transition-colors duration-200 ${
                      visible ? toggleOn : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                        visible ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                  <Icon size={15} className="text-slate-500 dark:text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-700 dark:text-slate-200">{label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

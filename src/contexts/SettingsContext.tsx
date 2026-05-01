import React, { createContext, useContext, useState } from 'react';

interface SettingsContextType {
  hiddenNav: string[];
  toggleNavItem: (to: string) => void;
  isNavVisible: (to: string) => boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

const LS_KEY = 'movr_hidden_nav';

function getInitialHidden(): string[] {
  try {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) return JSON.parse(stored) as string[];
  } catch {}
  return [];
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [hiddenNav, setHiddenNav] = useState<string[]>(getInitialHidden);

  function toggleNavItem(to: string) {
    setHiddenNav((prev) => {
      const next = prev.includes(to) ? prev.filter((p) => p !== to) : [...prev, to];
      localStorage.setItem(LS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function isNavVisible(to: string) {
    return !hiddenNav.includes(to);
  }

  return (
    <SettingsContext.Provider value={{ hiddenNav, toggleNavItem, isNavVisible }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

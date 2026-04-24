import React, { createContext, useContext, useState } from 'react';
import type { User } from '../types';
import { MOCK_USERS, MOCK_PASSWORDS } from '../data/mockData';
import { LS_USER_KEY, LS_DYNAMIC_USERS_KEY, LS_DYNAMIC_PASSWORDS_KEY } from '../lib/constants';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(LS_USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  async function login(email: string, password: string) {
    const normalizedEmail = email.toLowerCase().trim();

    const mockPassword = MOCK_PASSWORDS[normalizedEmail];
    const dynamicPasswords: Record<string, string> = JSON.parse(
      localStorage.getItem(LS_DYNAMIC_PASSWORDS_KEY) ?? '{}'
    );
    const dynamicPassword = dynamicPasswords[normalizedEmail];

    const expectedPassword = mockPassword ?? dynamicPassword;
    if (!expectedPassword || expectedPassword !== password) {
      return { success: false, error: 'E-mail ou senha inválidos.' };
    }

    let found: User | undefined = MOCK_USERS.find((u) => u.email === normalizedEmail);
    if (!found) {
      const dynamicUsers: User[] = JSON.parse(
        localStorage.getItem(LS_DYNAMIC_USERS_KEY) ?? '[]'
      );
      found = dynamicUsers.find((u) => u.email === normalizedEmail);
    }
    if (!found) return { success: false, error: 'Usuário não encontrado.' };

    setUser(found);
    localStorage.setItem(LS_USER_KEY, JSON.stringify(found));
    return { success: true };
  }

  function logout() {
    setUser(null);
    localStorage.removeItem(LS_USER_KEY);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

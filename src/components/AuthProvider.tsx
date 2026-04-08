'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { storageGet } from '@/utils/storage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => void; // ✅ IMPORTANT
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  setUser: () => {},
  logout: () => {}, // ✅ IMPORTANT
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = storageGet<AuthUser>('miq_user');
    if (u?.email) setUser(u);
    setLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem('miq_user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

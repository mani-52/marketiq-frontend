'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { storageGet } from '@/utils/storage';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

/* ✅ FIXED TYPE (ADDED logout) */
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;   // ✅ ADDED
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  setUser: () => {},
  logout: () => {},   // ✅ ADDED DEFAULT
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = storageGet<AuthUser>('miq_user');
    if (u?.email) setUser(u);
    setLoading(false);
  }, []);

  /* ✅ IMPLEMENT LOGOUT */
  const logout = () => {
    localStorage.removeItem('miq_user');
    setUser(null);
    window.location.href = '/login'; // redirect after logout
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

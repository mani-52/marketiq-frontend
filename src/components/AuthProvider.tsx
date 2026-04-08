'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { storageGet } from '@/utils/storage';

/* ✅ USER TYPE */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

/* ✅ CONTEXT TYPE (STRICT + SAFE) */
interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
}

/* ✅ DEFAULT CONTEXT (SAFE FALLBACKS) */
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: () => {},
});

/* ✅ PROVIDER */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  /* ✅ LOAD USER FROM STORAGE */
  useEffect(() => {
    try {
      const u = storageGet<AuthUser>('miq_user');
      if (u?.email) {
        setUser(u);
      }
    } catch (err) {
      console.error('Auth load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /* ✅ LOGOUT FUNCTION */
  const logout = () => {
    try {
      localStorage.removeItem('miq_user');
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ✅ STRICT RETURN TYPE (VERY IMPORTANT) */
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

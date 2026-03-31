'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolvedTheme: 'dark' | 'light';
}

const Ctx = createContext<ThemeCtx>({
  theme: 'system',
  setTheme: () => {},
  resolvedTheme: 'light',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    const saved = (localStorage.getItem('miq_theme') as Theme) || 'system';
    setThemeState(saved);
  }, []);

  useEffect(() => {
    const apply = (t: Theme) => {
      const root = document.documentElement;
      const isDark =
        t === 'dark' ||
        (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      root.classList.toggle('dark', isDark);
      setResolvedTheme(isDark ? 'dark' : 'light');
    };
    apply(theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => apply(theme);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = (t: Theme) => {
    localStorage.setItem('miq_theme', t);
    setThemeState(t);
  };

  return <Ctx.Provider value={{ theme, setTheme, resolvedTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);

'use client';

import { useState } from 'react';
import { Menu, Sun, Moon, ChevronRight, Bell } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/utils/cn';
import { useTheme } from '@/components/ThemeProvider';
import { useAuth } from '@/components/AuthProvider';

const PAGE_LABELS: Record<string, string> = {
  '/dashboard':                  'Overview',
  '/dashboard/analyze':          'Analyze',
  '/dashboard/insights':         'Insights',
  '/dashboard/history':          'History',
  '/dashboard/notifications':    'Notifications',
  '/dashboard/domain-matrix':    'Domain Matrix',
};

export function Topbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const router   = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const { user, logout } = useAuth();
  const [menu, setMenu] = useState(false);

  const pageLabel = PAGE_LABELS[pathname] ?? 'Dashboard';
  const initials  = user?.name
    ? user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-4 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-accent lg:hidden">
          <Menu className="h-4 w-4" />
        </button>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1 text-sm">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors text-xs">
            MarketIQ
          </Link>
          {pathname !== '/dashboard' && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
              <span className="text-sm font-medium text-foreground">{pageLabel}</span>
            </>
          )}
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Theme */}
        <button onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Toggle theme">
          {resolvedTheme === 'dark'
            ? <Sun className="h-4 w-4" />
            : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications bell */}
        <Link href="/dashboard/notifications"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors relative">
          <Bell className="h-4 w-4" />
        </Link>

        {/* Avatar / user */}
        <div className="relative">
          <button onClick={() => setMenu(v => !v)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
            title={user?.name || 'User'}>
            {initials}
          </button>

          {menu && (
            <div onClick={() => setMenu(false)}
              className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-xl">
              {user && (
                <div className="border-b border-border px-4 py-3">
                  <p className="text-xs font-semibold text-foreground truncate">{user.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                </div>
              )}
              {[
                { label: 'Overview',      href: '/dashboard' },
                { label: 'Notifications', href: '/dashboard/notifications' },
              ].map(({ label, href }) => (
                <button key={href} onClick={() => router.push(href)}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-muted-foreground hover:bg-accent hover:text-foreground">
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

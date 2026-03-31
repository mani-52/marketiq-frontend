'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Search, Lightbulb, Grid3X3,
  Bell, History, X, Activity, Zap,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import { UserMenu } from '@/components/UserMenu';

const NAV = [
  { label: 'Overview',      href: '/dashboard',                icon: LayoutDashboard },
  { label: 'Analyze',       href: '/dashboard/analyze',        icon: Search,   badge: 'Live' },
  { label: 'Insights',      href: '/dashboard/insights',       icon: Lightbulb },
  { label: 'Domain Matrix', href: '/dashboard/domain-matrix',  icon: Grid3X3 },
  { label: 'Notifications', href: '/dashboard/notifications',  icon: Bell },
  { label: 'History',       href: '/dashboard/history',        icon: History },
];

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

export function Sidebar({ isOpen = true, onClose, className }: SidebarProps) {
  const pathname = usePathname();
  const health   = useBackendHealth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && onClose && (
        <div className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        'fixed left-0 top-0 z-40 flex h-full w-[228px] flex-col bg-card border-r border-border',
        'transition-transform duration-200 ease-out lg:translate-x-0 lg:relative lg:z-auto',
        isOpen ? 'translate-x-0' : '-translate-x-full',
        className,
      )}>
        {/* Logo */}
        <div className="flex h-14 items-center justify-between px-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Activity className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold tracking-tight">MarketIQ</span>
          </Link>
          {onClose && (
            <button onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-accent lg:hidden">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <p className="px-2 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Navigation
          </p>
          {NAV.map(({ label, href, icon: Icon, badge }) => {
            const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm mb-0.5 transition-colors',
                  active
                    ? 'bg-primary/8 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}>
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-primary' : 'text-muted-foreground/70')} />
                <span className="flex-1 text-[13px]">{label}</span>
                {badge && (
                  <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
                    {badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-3 py-3 space-y-2">
          {/* Backend status pill */}
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/40 text-xs text-muted-foreground">
            <div className={cn('h-1.5 w-1.5 rounded-full shrink-0',
              health.checking ? 'bg-muted-foreground/50 animate-pulse' :
              health.online   ? 'bg-emerald-500' : 'bg-red-500')} />
            {health.checking ? 'Connecting…' : health.online ? 'Backend online' : 'Backend offline'}
          </div>
          {health.online && (
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/40 text-xs text-muted-foreground">
              <div className={cn('h-1.5 w-1.5 rounded-full shrink-0', health.tavilyConfigured ? 'bg-primary' : 'bg-amber-500')} />
              Tavily {health.tavilyConfigured ? 'active' : 'not configured'}
            </div>
          )}
          <UserMenu />
        </div>
      </aside>
    </>
  );
}

'use client';
import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar }  from './Topbar';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar className="hidden lg:flex" />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} className="lg:hidden" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

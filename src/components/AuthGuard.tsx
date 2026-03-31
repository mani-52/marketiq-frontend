'use client';
/**
 * AuthGuard — passthrough (login removed).
 * Kept as a component so DashboardLayout import doesn't break.
 */
import { ReactNode } from 'react';
export function AuthGuard({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

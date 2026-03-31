'use client';
import { useAuth } from '@/components/AuthProvider';

export function UserMenu() {
  const { user } = useAuth();
  if (!user) return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/40 text-xs text-muted-foreground">
      <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">?</div>
      <span>Guest mode</span>
    </div>
  );
  const initials = user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-muted/40 text-xs">
      <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">{initials}</div>
      <span className="text-foreground truncate">{user.name}</span>
    </div>
  );
}

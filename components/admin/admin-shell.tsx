'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BookOpen, CalendarClock, LayoutDashboard, LogOut, PanelsTopLeft, User } from 'lucide-react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const nav = [
  { href: '/admin', label: 'Overzicht', icon: LayoutDashboard },
  { href: '/admin/profile', label: 'Profiel', icon: User },
  { href: '/admin/logbook', label: 'Logboek', icon: BookOpen },
  { href: '/admin/projects', label: 'Projecten', icon: PanelsTopLeft },
  { href: '/admin/timeline', label: 'Timeline', icon: CalendarClock },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    router.replace('/');
    router.refresh();
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-6xl px-5 py-6">
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <aside className="glass-surface h-fit rounded-3xl p-4 shadow-card">
          <div className="flex items-center justify-between gap-2 px-2 py-2">
            <p className="text-sm font-semibold">Admin</p>
            <Button variant="ghost" size="icon" onClick={signOut} title="Uitloggen">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <nav className="mt-2 space-y-1">
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/admin' && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-2 rounded-2xl px-3 py-2 text-sm transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="glass-surface rounded-3xl p-6 shadow-card">{children}</main>
      </div>
    </div>
  );
}


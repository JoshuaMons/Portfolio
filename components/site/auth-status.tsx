'use client';

import * as React from 'react';
import Link from 'next/link';
import { Shield, GraduationCap, User } from 'lucide-react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type ProfileRow = { full_name: string | null };
type Role = 'anon' | 'admin' | 'teacher' | 'user';

export function AuthStatus() {
  const [loading, setLoading] = React.useState(true);
  const [displayName, setDisplayName] = React.useState<string | null>(null);
  const [accountEmail, setAccountEmail] = React.useState<string | null>(null);
  const [role, setRole] = React.useState<Role>('anon');

  React.useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data.user;
      if (!user) {
        setDisplayName(null);
        setAccountEmail(null);
        setRole('anon');
        setLoading(false);
        return;
      }

      setAccountEmail(user.email ?? null);

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .maybeSingle();

      const name = (profile as ProfileRow | null)?.full_name?.trim() || user.email || 'Ingelogd';
      setDisplayName(name);

      const roleRes = await fetch('/api/auth/role').catch(() => null);
      const roleJson = roleRes ? await roleRes.json().catch(() => ({})) : {};
      setRole((roleJson?.role as Role) || 'user');

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-9 w-28 rounded-xl border border-border/60 bg-background/50" />
      </div>
    );
  }

  if (!displayName) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/login">
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="gap-2">
          <Link href="/teacher/login?next=/teacher">
            <GraduationCap className="h-4 w-4" />
            Docenten
          </Link>
        </Button>
      </div>
    );
  }

  async function teacherSignOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase?.auth.signOut();
    window.location.assign('/teacher/login');
  }

  if (role === 'teacher') {
    return (
      <div className="flex max-w-full flex-wrap items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
          <Link href="/teacher">
            <GraduationCap className="h-4 w-4" />
            Docent view
          </Link>
        </Button>
        {accountEmail ? (
          <span
            className="max-w-[min(220px,42vw)] truncate rounded-xl border border-border/60 bg-background/60 px-3 py-1.5 text-xs text-muted-foreground sm:max-w-[260px]"
            title={accountEmail}
          >
            {accountEmail}
          </span>
        ) : null}
        <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => void teacherSignOut()}>
          Uitloggen
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm" className="gap-2">
        <Link href="/admin">
          <User className="h-4 w-4" />
          {displayName}
        </Link>
      </Button>
    </div>
  );
}


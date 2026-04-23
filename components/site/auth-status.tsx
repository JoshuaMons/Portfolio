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
        setRole('anon');
        setLoading(false);
        return;
      }

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

  const homeHref = role === 'teacher' ? '/teacher' : '/admin';

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="sm" className="gap-2">
        <Link href={homeHref}>
          <User className="h-4 w-4" />
          {displayName}
        </Link>
      </Button>
    </div>
  );
}


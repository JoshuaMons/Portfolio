'use client';

import * as React from 'react';
import Link from 'next/link';
import { LogIn, Shield, GraduationCap, User } from 'lucide-react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type ProfileRow = { full_name: string | null };

export function AuthStatus() {
  const [loading, setLoading] = React.useState(true);
  const [displayName, setDisplayName] = React.useState<string | null>(null);

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
          <Link href="/teacher/login">
            <GraduationCap className="h-4 w-4" />
            Docenten
          </Link>
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
      <Button asChild variant="outline" size="sm" className="gap-2">
        <Link href="/admin">
          <Shield className="h-4 w-4" />
          Admin
        </Link>
      </Button>
      <Button asChild variant="outline" size="sm" className="gap-2">
        <Link href="/teacher">
          <LogIn className="h-4 w-4" />
          Docent view
        </Link>
      </Button>
    </div>
  );
}


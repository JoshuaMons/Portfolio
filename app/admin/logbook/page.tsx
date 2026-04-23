'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';

import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

type AuditLog = {
  id: string;
  action: string;
  entity: string;
  summary: string;
  created_at: string;
};

export default function AdminLogbookPage() {
  const [items, setItems] = React.useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const supabaseRef = React.useRef<ReturnType<typeof createSupabaseBrowserClient> | null>(null);

  React.useEffect(() => {
    supabaseRef.current = createSupabaseBrowserClient();
    if (!supabaseRef.current) {
      setError('Supabase is nog niet geconfigureerd (env vars ontbreken).');
      setIsLoading(false);
    }
  }, []);

  const refresh = React.useCallback(async () => {
    const supabase = supabaseRef.current;
    if (!supabase) return;
    setIsLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('id,action,entity,summary,created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) setError(error.message);
    setItems((data as AuditLog[]) ?? []);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Logboek (automatisch)</h1>
          <p className="mt-1 text-sm text-muted-foreground">Alle admin-aanpassingen worden gelogd. Alleen laatste 7 dagen blijven.</p>
        </div>

        <Button variant="outline" onClick={refresh} disabled={isLoading}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 grid gap-2">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Laden…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nog geen logs.</p>
        ) : (
          items.map((it) => (
            <div key={it.id} className="rounded-2xl border border-border/60 bg-background/50 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold">
                  {it.action} · {it.entity}
                </p>
                <p className="text-xs text-muted-foreground">{new Date(it.created_at).toLocaleString('nl-NL')}</p>
              </div>
              {it.summary ? <p className="mt-2 text-sm text-muted-foreground">{it.summary}</p> : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

